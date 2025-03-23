import { IStorage } from "./storage";
import {
  Schedule, Teacher, Class, Subject, Room, TimeSlot,
  ScheduleGeneration, InsertSchedule
} from "@shared/schema";

interface Individual {
  schedules: {
    classId: number;
    subjectId: number;
    teacherId: number;
    roomId: number;
    timeSlotId: number;
  }[];
  fitness: number;
}

// Cache for data to avoid repetitive storage calls
interface GeneticAlgorithmCache {
  classes: Class[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  timeSlots: TimeSlot[];
  teacherSubjects: Map<number, number[]>; // teacherId -> subjectIds
  classSubjects: Map<number, number[]>; // classId -> subjectIds
}

/**
 * Main function to generate schedules using genetic algorithm
 */
export async function generateSchedule(generationId: number, storage: IStorage): Promise<void> {
  try {
    const generation = await storage.getScheduleGeneration(generationId);
    if (!generation) {
      throw new Error(`Generation with ID ${generationId} not found`);
    }

    // Update status to in_progress
    await storage.updateScheduleGeneration(generationId, { status: "in_progress" });

    const startTime = Date.now();

    // Initialize cache
    const cache = await initializeCache(storage);

    // Run genetic algorithm
    const result = await runGeneticAlgorithm(generation, cache, storage);

    // Save schedules to database
    await saveSchedules(result, generation, storage);

    const endTime = Date.now();
    const executionTime = Math.floor((endTime - startTime) / 1000); // in seconds

    // Update generation with results
    await storage.updateScheduleGeneration(generationId, {
      status: "completed",
      fitnessValue: result.fitness.toString(),
      executionTime,
      conflictCount: countConflicts(result, cache),
      completedAt: new Date()
    });
  } catch (error) {
    console.error("Error in schedule generation:", error);
    // Update status to failed
    await storage.updateScheduleGeneration(generationId, {
      status: "failed",
      completedAt: new Date()
    });
  }
}

/**
 * Initialize cache with data from storage
 */
async function initializeCache(storage: IStorage): Promise<GeneticAlgorithmCache> {
  const [classes, teachers, subjects, rooms, timeSlots] = await Promise.all([
    storage.getClasses(),
    storage.getTeachers(),
    storage.getSubjects(),
    storage.getRooms(),
    storage.getTimeSlots()
  ]);

  // Build teacher-subject mappings
  const teacherSubjects = new Map<number, number[]>();
  for (const teacher of teachers) {
    const subjects = await storage.getTeacherSubjects(teacher.id);
    teacherSubjects.set(teacher.id, subjects.map(s => s.id));
  }

  // Build class-subject mappings
  const classSubjects = new Map<number, number[]>();
  for (const cls of classes) {
    const subjects = await storage.getClassSubjects(cls.id);
    classSubjects.set(cls.id, subjects.map(s => s.id));
  }

  return {
    classes,
    teachers,
    subjects,
    rooms,
    timeSlots,
    teacherSubjects,
    classSubjects
  };
}

/**
 * Run the genetic algorithm to generate schedules
 */
async function runGeneticAlgorithm(
  generation: ScheduleGeneration,
  cache: GeneticAlgorithmCache,
  storage: IStorage
): Promise<Individual> {
  const populationSize = generation.populationSize;
  const maxGenerations = generation.maxGenerations;
  const crossoverRate = parseFloat(generation.crossoverRate);
  const mutationRate = parseFloat(generation.mutationRate);
  const selectionMethod = generation.selectionMethod;

  // Create initial population
  let population = createInitialPopulation(populationSize, cache);

  // Evaluate fitness for each individual
  population = evaluatePopulation(population, cache);

  // Sort by fitness (descending order - higher is better)
  population.sort((a, b) => b.fitness - a.fitness);

  // Main genetic algorithm loop
  for (let gen = 0; gen < maxGenerations; gen++) {
    // Create new population
    const newPopulation: Individual[] = [];

    // Elitism: Keep the best individual(s)
    const elitismCount = Math.max(1, Math.floor(populationSize * 0.1));
    for (let i = 0; i < elitismCount; i++) {
      newPopulation.push(cloneIndividual(population[i]));
    }

    // Fill the rest of the population with crossover and mutation
    while (newPopulation.length < populationSize) {
      // Select parents
      const parent1 = selectParent(population, selectionMethod);
      const parent2 = selectParent(population, selectionMethod);

      // Create children through crossover
      let child: Individual;
      if (Math.random() < crossoverRate) {
        child = crossover(parent1, parent2);
      } else {
        // If no crossover, just clone parent1
        child = cloneIndividual(parent1);
      }

      // Mutation
      if (Math.random() < mutationRate) {
        mutate(child, cache);
      }

      // Calculate fitness
      child.fitness = calculateFitness(child, cache);

      // Add to new population
      newPopulation.push(child);
    }

    // Replace old population
    population = newPopulation;

    // Sort by fitness
    population.sort((a, b) => b.fitness - a.fitness);

    // Log progress every 10 generations
    if (gen % 10 === 0) {
      console.log(`Generation ${gen}: Best fitness = ${population[0].fitness.toFixed(4)}`);
    }

    // Early termination if we reach a very good solution
    if (population[0].fitness > 0.95) {
      console.log(`Reached satisfactory solution at generation ${gen}`);
      break;
    }
  }

  // Return the best individual
  return population[0];
}

/**
 * Create initial population of random individuals
 */
function createInitialPopulation(size: number, cache: GeneticAlgorithmCache): Individual[] {
  const population: Individual[] = [];

  for (let i = 0; i < size; i++) {
    population.push(createRandomIndividual(cache));
  }

  return population;
}

/**
 * Create a random individual (schedule)
 */
function createRandomIndividual(cache: GeneticAlgorithmCache): Individual {
  const schedules: Individual['schedules'] = [];

  // For each class-subject pair, create a schedule
  for (const cls of cache.classes) {
    const subjectIds = cache.classSubjects.get(cls.id) || [];
    
    for (const subjectId of subjectIds) {
      const subject = cache.subjects.find(s => s.id === subjectId);
      if (!subject) continue;

      // Schedule multiple sessions based on hours per week
      const sessionsNeeded = subject.hoursPerWeek / 2; // Assuming each session is 2 hours
      
      for (let i = 0; i < sessionsNeeded; i++) {
        // Find teachers who can teach this subject
        const eligibleTeacherIds: number[] = [];
        cache.teacherSubjects.forEach((subjectIds, teacherId) => {
          if (subjectIds.includes(subjectId)) {
            eligibleTeacherIds.push(teacherId);
          }
        });

        if (eligibleTeacherIds.length === 0) continue;

        // Select random teacher, room, and time slot
        const teacherId = eligibleTeacherIds[Math.floor(Math.random() * eligibleTeacherIds.length)];
        
        // Select appropriate room type (theoretical or practical)
        let eligibleRooms = cache.rooms;
        if (subject.requiresPractical) {
          eligibleRooms = cache.rooms.filter(r => r.type === 'praktikum');
        } else {
          eligibleRooms = cache.rooms.filter(r => r.type === 'teori');
        }

        // Check department restrictions for rooms
        const classRoom = eligibleRooms.filter(r => {
          if (!r.allowedDepartments || r.allowedDepartments.length === 0) return true;
          return r.allowedDepartments.includes(cls.department);
        });

        const finalRooms = classRoom.length > 0 ? classRoom : eligibleRooms;
        const roomId = finalRooms[Math.floor(Math.random() * finalRooms.length)].id;
        
        const timeSlotId = cache.timeSlots[Math.floor(Math.random() * cache.timeSlots.length)].id;

        schedules.push({
          classId: cls.id,
          subjectId,
          teacherId,
          roomId,
          timeSlotId
        });
      }
    }
  }

  // Create individual with initial fitness of 0
  return {
    schedules,
    fitness: 0
  };
}

/**
 * Evaluate fitness for every individual in the population
 */
function evaluatePopulation(population: Individual[], cache: GeneticAlgorithmCache): Individual[] {
  return population.map(individual => {
    individual.fitness = calculateFitness(individual, cache);
    return individual;
  });
}

/**
 * Calculate fitness for an individual
 * Higher value means better schedule
 */
function calculateFitness(individual: Individual, cache: GeneticAlgorithmCache): number {
  let score = 1.0; // Start with perfect score and subtract for each constraint violation
  
  // Track conflicts
  const teacherTimeSlots = new Map<string, number>(); // teacherId-timeSlotId -> count
  const classTimeSlots = new Map<string, number>(); // classId-timeSlotId -> count
  const roomTimeSlots = new Map<string, number>(); // roomId-timeSlotId -> count
  
  // Check for each schedule in the individual
  for (const schedule of individual.schedules) {
    const { teacherId, classId, roomId, timeSlotId, subjectId } = schedule;
    
    // Check teacher availability for this time slot
    const teacherTimeKey = `${teacherId}-${timeSlotId}`;
    teacherTimeSlots.set(teacherTimeKey, (teacherTimeSlots.get(teacherTimeKey) || 0) + 1);
    
    // Check class availability for this time slot
    const classTimeKey = `${classId}-${timeSlotId}`;
    classTimeSlots.set(classTimeKey, (classTimeSlots.get(classTimeKey) || 0) + 1);
    
    // Check room availability for this time slot
    const roomTimeKey = `${roomId}-${timeSlotId}`;
    roomTimeSlots.set(roomTimeKey, (roomTimeSlots.get(roomTimeKey) || 0) + 1);
    
    // Check if teacher can teach this subject
    const teacher = cache.teachers.find(t => t.id === teacherId);
    const canTeach = cache.teacherSubjects.get(teacherId)?.includes(subjectId) || false;
    
    if (!canTeach) {
      score -= 0.1; // Penalty for teacher not qualified for subject
    }
    
    // Check if subject requires practical room but assigned to theory room or vice versa
    const subject = cache.subjects.find(s => s.id === subjectId);
    const room = cache.rooms.find(r => r.id === roomId);
    
    if (subject && room) {
      if (subject.requiresPractical && room.type !== 'praktikum') {
        score -= 0.05; // Penalty for practical subject in theory room
      }
    }
    
    // Check room capacity versus class size
    const cls = cache.classes.find(c => c.id === classId);
    if (cls && room && cls.capacity > room.capacity) {
      score -= 0.05; // Penalty for room too small
    }
    
    // Check teacher preferences and unavailable times
    if (teacher) {
      const timeSlot = cache.timeSlots.find(ts => ts.id === timeSlotId);
      if (timeSlot) {
        // Check if teacher has specified this day as unavailable
        if (teacher.unavailableDays && teacher.unavailableDays.includes(timeSlot.day)) {
          score -= 0.2; // Major penalty for scheduling on unavailable day
        }
        
        // Check if teacher has specified this time slot as unavailable
        const timeSlotString = `${timeSlot.day}-${timeSlot.startTime}`;
        if (teacher.unavailableTimeSlots && teacher.unavailableTimeSlots.includes(timeSlotString)) {
          score -= 0.2; // Major penalty for unavailable time slot
        }
        
        // Bonus for preferred days
        if (teacher.preferredDays && teacher.preferredDays.includes(timeSlot.day)) {
          score += 0.02; // Small bonus for preferred day
        }
        
        // Bonus for preferred time slots
        if (teacher.preferredTimeSlots && teacher.preferredTimeSlots.includes(timeSlotString)) {
          score += 0.02; // Small bonus for preferred time slot
        }
      }
    }
  }
  
  // Apply penalties for conflicts
  teacherTimeSlots.forEach((count, key) => {
    if (count > 1) {
      score -= 0.2 * (count - 1); // Penalty for teacher scheduled in same time slot multiple times
    }
  });
  
  classTimeSlots.forEach((count, key) => {
    if (count > 1) {
      score -= 0.2 * (count - 1); // Penalty for class scheduled in same time slot multiple times
    }
  });
  
  roomTimeSlots.forEach((count, key) => {
    if (count > 1) {
      score -= 0.2 * (count - 1); // Penalty for room scheduled in same time slot multiple times
    }
  });
  
  // Check teacher workload
  const teacherWorkload = new Map<number, number>();
  for (const schedule of individual.schedules) {
    teacherWorkload.set(
      schedule.teacherId, 
      (teacherWorkload.get(schedule.teacherId) || 0) + 2 // Assuming each session is 2 hours
    );
  }
  
  teacherWorkload.forEach((hours, teacherId) => {
    const teacher = cache.teachers.find(t => t.id === teacherId);
    if (teacher && hours > teacher.maxHoursPerWeek) {
      score -= 0.1 * ((hours - teacher.maxHoursPerWeek) / 2); // Penalty for exceeding max hours
    }
  });
  
  // Normalize fitness between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Select a parent for crossover based on the selection method
 */
function selectParent(population: Individual[], method: string): Individual {
  // Make a copy to avoid modifying original array
  const populationCopy = [...population];
  
  if (method === 'tournament') {
    // Tournament selection
    const tournamentSize = Math.max(2, Math.floor(populationCopy.length * 0.1));
    const tournament: Individual[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * populationCopy.length);
      tournament.push(populationCopy[randomIndex]);
    }
    
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  } else {
    // Default to roulette wheel selection
    const totalFitness = populationCopy.reduce((sum, individual) => sum + individual.fitness, 0);
    let rouletteWheel = 0;
    const random = Math.random() * totalFitness;
    
    for (const individual of populationCopy) {
      rouletteWheel += individual.fitness;
      if (rouletteWheel >= random) {
        return individual;
      }
    }
    
    // Fallback in case of rounding errors
    return populationCopy[0];
  }
}

/**
 * Create a new individual by crossing over two parents
 */
function crossover(parent1: Individual, parent2: Individual): Individual {
  // Create a child with empty schedules
  const child: Individual = {
    schedules: [],
    fitness: 0
  };
  
  // Group schedules by class for better crossover
  const parent1ByClass = new Map<number, typeof parent1.schedules>();
  const parent2ByClass = new Map<number, typeof parent1.schedules>();
  
  parent1.schedules.forEach(schedule => {
    const classSchedules = parent1ByClass.get(schedule.classId) || [];
    classSchedules.push(schedule);
    parent1ByClass.set(schedule.classId, classSchedules);
  });
  
  parent2.schedules.forEach(schedule => {
    const classSchedules = parent2ByClass.get(schedule.classId) || [];
    classSchedules.push(schedule);
    parent2ByClass.set(schedule.classId, classSchedules);
  });
  
  // For each class, decide which parent to use
  const allClassIds = new Set([...parent1ByClass.keys(), ...parent2ByClass.keys()]);
  
  allClassIds.forEach(classId => {
    // Randomly choose parent for this class
    const useParent1 = Math.random() < 0.5;
    const schedules = useParent1 
      ? (parent1ByClass.get(classId) || [])
      : (parent2ByClass.get(classId) || []);
    
    // Add schedules to child
    schedules.forEach(schedule => {
      child.schedules.push({...schedule});
    });
  });
  
  return child;
}

/**
 * Mutate an individual by randomly changing some schedules
 */
function mutate(individual: Individual, cache: GeneticAlgorithmCache): void {
  // Define mutation probability for each schedule
  const scheduleMutationProb = 0.1;
  
  for (let i = 0; i < individual.schedules.length; i++) {
    if (Math.random() < scheduleMutationProb) {
      const schedule = individual.schedules[i];
      
      // Determine what to mutate
      const mutationType = Math.floor(Math.random() * 3);
      
      switch (mutationType) {
        case 0: // Mutate teacher
          const subject = cache.subjects.find(s => s.id === schedule.subjectId);
          if (subject) {
            // Find teachers who can teach this subject
            const eligibleTeacherIds: number[] = [];
            cache.teacherSubjects.forEach((subjectIds, teacherId) => {
              if (subjectIds.includes(subject.id)) {
                eligibleTeacherIds.push(teacherId);
              }
            });
            
            if (eligibleTeacherIds.length > 0) {
              schedule.teacherId = eligibleTeacherIds[
                Math.floor(Math.random() * eligibleTeacherIds.length)
              ];
            }
          }
          break;
          
        case 1: // Mutate room
          const sub = cache.subjects.find(s => s.id === schedule.subjectId);
          if (sub) {
            // Select appropriate room type
            let eligibleRooms = cache.rooms;
            if (sub.requiresPractical) {
              eligibleRooms = cache.rooms.filter(r => r.type === 'praktikum');
            } else {
              eligibleRooms = cache.rooms.filter(r => r.type === 'teori');
            }
            
            if (eligibleRooms.length > 0) {
              schedule.roomId = eligibleRooms[
                Math.floor(Math.random() * eligibleRooms.length)
              ].id;
            }
          }
          break;
          
        case 2: // Mutate time slot
          if (cache.timeSlots.length > 0) {
            schedule.timeSlotId = cache.timeSlots[
              Math.floor(Math.random() * cache.timeSlots.length)
            ].id;
          }
          break;
      }
    }
  }
}

/**
 * Clone an individual to avoid reference issues
 */
function cloneIndividual(individual: Individual): Individual {
  return {
    schedules: individual.schedules.map(schedule => ({...schedule})),
    fitness: individual.fitness
  };
}

/**
 * Count the number of conflicts in the schedule
 */
function countConflicts(individual: Individual, cache: GeneticAlgorithmCache): number {
  let conflicts = 0;
  
  // Track resource usage
  const teacherTimeSlots = new Map<string, number>(); // teacherId-timeSlotId -> count
  const classTimeSlots = new Map<string, number>(); // classId-timeSlotId -> count
  const roomTimeSlots = new Map<string, number>(); // roomId-timeSlotId -> count
  
  // Check each schedule
  for (const schedule of individual.schedules) {
    const { teacherId, classId, roomId, timeSlotId, subjectId } = schedule;
    
    // Check teacher conflicts
    const teacherTimeKey = `${teacherId}-${timeSlotId}`;
    teacherTimeSlots.set(teacherTimeKey, (teacherTimeSlots.get(teacherTimeKey) || 0) + 1);
    
    // Check class conflicts
    const classTimeKey = `${classId}-${timeSlotId}`;
    classTimeSlots.set(classTimeKey, (classTimeSlots.get(classTimeKey) || 0) + 1);
    
    // Check room conflicts
    const roomTimeKey = `${roomId}-${timeSlotId}`;
    roomTimeSlots.set(roomTimeKey, (roomTimeSlots.get(roomTimeKey) || 0) + 1);
    
    // Check if teacher can teach this subject
    const canTeach = cache.teacherSubjects.get(teacherId)?.includes(subjectId) || false;
    if (!canTeach) {
      conflicts++;
    }
    
    // Check if subject requires practical room but assigned to theory room
    const subject = cache.subjects.find(s => s.id === subjectId);
    const room = cache.rooms.find(r => r.id === roomId);
    
    if (subject && room && subject.requiresPractical && room.type !== 'praktikum') {
      conflicts++;
    }
    
    // Check teacher unavailable times
    const teacher = cache.teachers.find(t => t.id === teacherId);
    const timeSlot = cache.timeSlots.find(ts => ts.id === timeSlotId);
    
    if (teacher && timeSlot) {
      if (teacher.unavailableDays && teacher.unavailableDays.includes(timeSlot.day)) {
        conflicts++;
      }
      
      const timeSlotString = `${timeSlot.day}-${timeSlot.startTime}`;
      if (teacher.unavailableTimeSlots && teacher.unavailableTimeSlots.includes(timeSlotString)) {
        conflicts++;
      }
    }
  }
  
  // Count all instances where resources are used more than once at the same time
  teacherTimeSlots.forEach((count) => {
    if (count > 1) conflicts += (count - 1);
  });
  
  classTimeSlots.forEach((count) => {
    if (count > 1) conflicts += (count - 1);
  });
  
  roomTimeSlots.forEach((count) => {
    if (count > 1) conflicts += (count - 1);
  });
  
  return conflicts;
}

/**
 * Save the generated schedules to the database
 */
async function saveSchedules(
  individual: Individual,
  generation: ScheduleGeneration,
  storage: IStorage
): Promise<void> {
  // Delete any existing schedules for this generation
  await storage.deleteSchedulesByGeneration(generation.id);
  
  // Save the new schedules
  for (const schedule of individual.schedules) {
    const insertSchedule: InsertSchedule = {
      generationId: generation.id,
      classId: schedule.classId,
      subjectId: schedule.subjectId,
      teacherId: schedule.teacherId,
      roomId: schedule.roomId,
      timeSlotId: schedule.timeSlotId,
      createdBy: generation.createdBy || null
    };
    
    await storage.createSchedule(insertSchedule);
  }
  
  // Save the result data to the generation record
  await storage.updateScheduleGeneration(generation.id, {
    data: individual.schedules
  });
}
