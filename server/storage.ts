import {
  users, User, InsertUser,
  curricula, Curriculum, InsertCurriculum,
  subjects, Subject, InsertSubject,
  teachers, Teacher, InsertTeacher,
  classes, Class, InsertClass,
  rooms, Room, InsertRoom,
  timeSlots, TimeSlot, InsertTimeSlot,
  teacherSubjects, TeacherSubject, InsertTeacherSubject,
  classSubjects, ClassSubject, InsertClassSubject,
  scheduleGenerations, ScheduleGeneration, InsertScheduleGeneration,
  schedules, Schedule, InsertSchedule,
  appSettings, AppSettings, InsertAppSettings
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Curriculum management
  createCurriculum(curriculum: InsertCurriculum): Promise<Curriculum>;
  getCurriculum(id: number): Promise<Curriculum | undefined>;
  getCurricula(): Promise<Curriculum[]>;
  updateCurriculum(id: number, data: Partial<InsertCurriculum>): Promise<Curriculum | undefined>;
  deleteCurriculum(id: number): Promise<boolean>;

  // Subject management
  createSubject(subject: InsertSubject): Promise<Subject>;
  getSubject(id: number): Promise<Subject | undefined>;
  getSubjects(): Promise<Subject[]>;
  getSubjectsByCurriculum(curriculumId: number): Promise<Subject[]>;
  updateSubject(id: number, data: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;

  // Teacher management
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeachers(): Promise<Teacher[]>;
  updateTeacher(id: number, data: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;

  // Class management
  createClass(cls: InsertClass): Promise<Class>;
  getClass(id: number): Promise<Class | undefined>;
  getClasses(): Promise<Class[]>;
  getClassesByCurriculum(curriculumId: number): Promise<Class[]>;
  updateClass(id: number, data: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;

  // Room management
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(id: number): Promise<Room | undefined>;
  getRooms(): Promise<Room[]>;
  getRoomsByType(type: string): Promise<Room[]>;
  updateRoom(id: number, data: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;

  // Time slot management
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  getTimeSlot(id: number): Promise<TimeSlot | undefined>;
  getTimeSlots(): Promise<TimeSlot[]>;
  updateTimeSlot(id: number, data: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined>;
  deleteTimeSlot(id: number): Promise<boolean>;

  // Teacher-Subject assignment
  assignTeacherToSubject(assignment: InsertTeacherSubject): Promise<TeacherSubject>;
  getTeacherSubjects(teacherId: number): Promise<Subject[]>;
  getSubjectTeachers(subjectId: number): Promise<Teacher[]>;
  removeTeacherSubject(id: number): Promise<boolean>;

  // Class-Subject assignment
  assignSubjectToClass(assignment: InsertClassSubject): Promise<ClassSubject>;
  getClassSubjects(classId: number): Promise<Subject[]>;
  removeClassSubject(id: number): Promise<boolean>;

  // Schedule generation
  createScheduleGeneration(scheduleGen: InsertScheduleGeneration): Promise<ScheduleGeneration>;
  getScheduleGeneration(id: number): Promise<ScheduleGeneration | undefined>;
  getScheduleGenerations(): Promise<ScheduleGeneration[]>;
  updateScheduleGeneration(id: number, data: Partial<ScheduleGeneration>): Promise<ScheduleGeneration | undefined>;
  deleteScheduleGeneration(id: number): Promise<boolean>;

  // Schedule
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  getSchedules(): Promise<Schedule[]>;
  getSchedulesByGeneration(generationId: number): Promise<Schedule[]>;
  getSchedulesByClass(classId: number): Promise<Schedule[]>;
  getSchedulesByTeacher(teacherId: number): Promise<Schedule[]>;
  getSchedulesByRoom(roomId: number): Promise<Schedule[]>;
  deleteSchedule(id: number): Promise<boolean>;
  deleteSchedulesByGeneration(generationId: number): Promise<boolean>;

  // App settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(data: Partial<InsertAppSettings>): Promise<AppSettings | undefined>;

  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private curricula: Map<number, Curriculum>;
  private subjects: Map<number, Subject>;
  private teachers: Map<number, Teacher>;
  private classes: Map<number, Class>;
  private rooms: Map<number, Room>;
  private timeSlots: Map<number, TimeSlot>;
  private teacherSubjects: Map<number, TeacherSubject>;
  private classSubjects: Map<number, ClassSubject>;
  private scheduleGenerations: Map<number, ScheduleGeneration>;
  private schedules: Map<number, Schedule>;
  private appSettingsInstance: AppSettings | undefined;
  
  sessionStore: session.SessionStore;

  private currentIds: {
    user: number;
    curriculum: number;
    subject: number;
    teacher: number;
    class: number;
    room: number;
    timeSlot: number;
    teacherSubject: number;
    classSubject: number;
    scheduleGeneration: number;
    schedule: number;
    appSettings: number;
  };

  constructor() {
    this.users = new Map();
    this.curricula = new Map();
    this.subjects = new Map();
    this.teachers = new Map();
    this.classes = new Map();
    this.rooms = new Map();
    this.timeSlots = new Map();
    this.teacherSubjects = new Map();
    this.classSubjects = new Map();
    this.scheduleGenerations = new Map();
    this.schedules = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    this.currentIds = {
      user: 1,
      curriculum: 1,
      subject: 1,
      teacher: 1,
      class: 1,
      room: 1,
      timeSlot: 1,
      teacherSubject: 1,
      classSubject: 1,
      scheduleGeneration: 1,
      schedule: 1,
      appSettings: 1,
    };

    // Create default app settings
    this.appSettingsInstance = {
      id: 1,
      appName: "SMARTA",
      appLogo: "",
      footerText: "© 2023 SMARTA - Sistem Manajemen Penjadwalan Terpadu | Versi 1.0.0",
      updatedBy: null,
      updatedAt: new Date(),
    };
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Curriculum management
  async createCurriculum(insertCurriculum: InsertCurriculum): Promise<Curriculum> {
    const id = this.currentIds.curriculum++;
    const curriculum: Curriculum = { 
      ...insertCurriculum, 
      id,
      createdAt: new Date() 
    };
    this.curricula.set(id, curriculum);
    return curriculum;
  }

  async getCurriculum(id: number): Promise<Curriculum | undefined> {
    return this.curricula.get(id);
  }

  async getCurricula(): Promise<Curriculum[]> {
    return Array.from(this.curricula.values());
  }

  async updateCurriculum(id: number, data: Partial<InsertCurriculum>): Promise<Curriculum | undefined> {
    const curriculum = this.curricula.get(id);
    if (!curriculum) return undefined;
    
    const updatedCurriculum = { ...curriculum, ...data };
    this.curricula.set(id, updatedCurriculum);
    return updatedCurriculum;
  }

  async deleteCurriculum(id: number): Promise<boolean> {
    return this.curricula.delete(id);
  }

  // Subject management
  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.currentIds.subject++;
    const subject: Subject = { 
      ...insertSubject, 
      id,
      createdAt: new Date() 
    };
    this.subjects.set(id, subject);
    return subject;
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async getSubjectsByCurriculum(curriculumId: number): Promise<Subject[]> {
    return Array.from(this.subjects.values()).filter(
      (subject) => subject.curriculumId === curriculumId
    );
  }

  async updateSubject(id: number, data: Partial<InsertSubject>): Promise<Subject | undefined> {
    const subject = this.subjects.get(id);
    if (!subject) return undefined;
    
    const updatedSubject = { ...subject, ...data };
    this.subjects.set(id, updatedSubject);
    return updatedSubject;
  }

  async deleteSubject(id: number): Promise<boolean> {
    return this.subjects.delete(id);
  }

  // Teacher management
  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const id = this.currentIds.teacher++;
    const teacher: Teacher = { 
      ...insertTeacher, 
      id,
      createdAt: new Date() 
    };
    this.teachers.set(id, teacher);
    return teacher;
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async getTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async updateTeacher(id: number, data: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const teacher = this.teachers.get(id);
    if (!teacher) return undefined;
    
    const updatedTeacher = { ...teacher, ...data };
    this.teachers.set(id, updatedTeacher);
    return updatedTeacher;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    return this.teachers.delete(id);
  }

  // Class management
  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = this.currentIds.class++;
    const cls: Class = { 
      ...insertClass, 
      id,
      createdAt: new Date() 
    };
    this.classes.set(id, cls);
    return cls;
  }

  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClassesByCurriculum(curriculumId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(
      (cls) => cls.curriculumId === curriculumId
    );
  }

  async updateClass(id: number, data: Partial<InsertClass>): Promise<Class | undefined> {
    const cls = this.classes.get(id);
    if (!cls) return undefined;
    
    const updatedClass = { ...cls, ...data };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    return this.classes.delete(id);
  }

  // Room management
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentIds.room++;
    const room: Room = { 
      ...insertRoom, 
      id,
      createdAt: new Date() 
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoomsByType(type: string): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(
      (room) => room.type === type
    );
  }

  async updateRoom(id: number, data: Partial<InsertRoom>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...data };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    return this.rooms.delete(id);
  }

  // Time slot management
  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = this.currentIds.timeSlot++;
    const timeSlot: TimeSlot = { 
      ...insertTimeSlot, 
      id,
      createdAt: new Date() 
    };
    this.timeSlots.set(id, timeSlot);
    return timeSlot;
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    return this.timeSlots.get(id);
  }

  async getTimeSlots(): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values());
  }

  async updateTimeSlot(id: number, data: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const timeSlot = this.timeSlots.get(id);
    if (!timeSlot) return undefined;
    
    const updatedTimeSlot = { ...timeSlot, ...data };
    this.timeSlots.set(id, updatedTimeSlot);
    return updatedTimeSlot;
  }

  async deleteTimeSlot(id: number): Promise<boolean> {
    return this.timeSlots.delete(id);
  }

  // Teacher-Subject assignment
  async assignTeacherToSubject(assignment: InsertTeacherSubject): Promise<TeacherSubject> {
    const id = this.currentIds.teacherSubject++;
    const teacherSubject: TeacherSubject = { 
      ...assignment, 
      id,
      createdAt: new Date() 
    };
    this.teacherSubjects.set(id, teacherSubject);
    return teacherSubject;
  }

  async getTeacherSubjects(teacherId: number): Promise<Subject[]> {
    const assignmentIds = Array.from(this.teacherSubjects.values())
      .filter((ts) => ts.teacherId === teacherId)
      .map((ts) => ts.subjectId);
    
    return Array.from(this.subjects.values())
      .filter((subject) => assignmentIds.includes(subject.id));
  }

  async getSubjectTeachers(subjectId: number): Promise<Teacher[]> {
    const assignmentIds = Array.from(this.teacherSubjects.values())
      .filter((ts) => ts.subjectId === subjectId)
      .map((ts) => ts.teacherId);
    
    return Array.from(this.teachers.values())
      .filter((teacher) => assignmentIds.includes(teacher.id));
  }

  async removeTeacherSubject(id: number): Promise<boolean> {
    return this.teacherSubjects.delete(id);
  }

  // Class-Subject assignment
  async assignSubjectToClass(assignment: InsertClassSubject): Promise<ClassSubject> {
    const id = this.currentIds.classSubject++;
    const classSubject: ClassSubject = { 
      ...assignment, 
      id,
      createdAt: new Date() 
    };
    this.classSubjects.set(id, classSubject);
    return classSubject;
  }

  async getClassSubjects(classId: number): Promise<Subject[]> {
    const assignmentIds = Array.from(this.classSubjects.values())
      .filter((cs) => cs.classId === classId)
      .map((cs) => cs.subjectId);
    
    return Array.from(this.subjects.values())
      .filter((subject) => assignmentIds.includes(subject.id));
  }

  async removeClassSubject(id: number): Promise<boolean> {
    return this.classSubjects.delete(id);
  }

  // Schedule generation
  async createScheduleGeneration(insertScheduleGen: InsertScheduleGeneration): Promise<ScheduleGeneration> {
    const id = this.currentIds.scheduleGeneration++;
    const scheduleGeneration: ScheduleGeneration = { 
      ...insertScheduleGen, 
      id,
      fitnessValue: null,
      executionTime: null,
      conflictCount: null,
      data: null,
      status: "pending",
      createdAt: new Date(),
      completedAt: null
    };
    this.scheduleGenerations.set(id, scheduleGeneration);
    return scheduleGeneration;
  }

  async getScheduleGeneration(id: number): Promise<ScheduleGeneration | undefined> {
    return this.scheduleGenerations.get(id);
  }

  async getScheduleGenerations(): Promise<ScheduleGeneration[]> {
    return Array.from(this.scheduleGenerations.values());
  }

  async updateScheduleGeneration(id: number, data: Partial<ScheduleGeneration>): Promise<ScheduleGeneration | undefined> {
    const scheduleGeneration = this.scheduleGenerations.get(id);
    if (!scheduleGeneration) return undefined;
    
    const updatedScheduleGeneration = { ...scheduleGeneration, ...data };
    this.scheduleGenerations.set(id, updatedScheduleGeneration);
    return updatedScheduleGeneration;
  }

  async deleteScheduleGeneration(id: number): Promise<boolean> {
    return this.scheduleGenerations.delete(id);
  }

  // Schedule
  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentIds.schedule++;
    const schedule: Schedule = { 
      ...insertSchedule, 
      id,
      createdAt: new Date() 
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedulesByGeneration(generationId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.generationId === generationId
    );
  }

  async getSchedulesByClass(classId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.classId === classId
    );
  }

  async getSchedulesByTeacher(teacherId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.teacherId === teacherId
    );
  }

  async getSchedulesByRoom(roomId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.roomId === roomId
    );
  }

  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }

  async deleteSchedulesByGeneration(generationId: number): Promise<boolean> {
    const relatedSchedules = Array.from(this.schedules.values()).filter(
      (schedule) => schedule.generationId === generationId
    );
    
    for (const schedule of relatedSchedules) {
      this.schedules.delete(schedule.id);
    }
    
    return true;
  }

  // App settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    return this.appSettingsInstance;
  }

  async updateAppSettings(data: Partial<InsertAppSettings>): Promise<AppSettings | undefined> {
    if (!this.appSettingsInstance) return undefined;
    
    this.appSettingsInstance = { 
      ...this.appSettingsInstance, 
      ...data,
      updatedAt: new Date()
    };
    
    return this.appSettingsInstance;
  }
}

export const storage = new MemStorage();
