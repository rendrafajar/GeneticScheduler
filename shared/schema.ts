import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'viewer']);
export const roomTypeEnum = pgEnum('room_type', ['teori', 'praktikum']);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default('viewer'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Curricula (Kurikulum)
export const curricula = pgTable("curricula", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  academicYear: text("academic_year").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCurriculumSchema = createInsertSchema(curricula).omit({
  id: true,
  createdAt: true,
});

// Subjects (Mata Pelajaran)
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  curriculumId: integer("curriculum_id").references(() => curricula.id),
  hoursPerWeek: integer("hours_per_week").notNull(),
  requiresPractical: boolean("requires_practical").default(false),
  preferredTimeSlots: json("preferred_time_slots").$type<string[]>(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

// Teachers (Guru)
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  nip: text("nip").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  specialization: text("specialization"),
  maxHoursPerWeek: integer("max_hours_per_week").notNull().default(24),
  unavailableDays: json("unavailable_days").$type<string[]>(),
  unavailableTimeSlots: json("unavailable_time_slots").$type<string[]>(),
  preferredDays: json("preferred_days").$type<string[]>(),
  preferredTimeSlots: json("preferred_time_slots").$type<string[]>(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
});

// Classes (Kelas)
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  grade: integer("grade").notNull(),
  department: text("department").notNull(), // jurusan
  academicYear: text("academic_year").notNull(),
  capacity: integer("capacity").notNull().default(30),
  curriculumId: integer("curriculum_id").references(() => curricula.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

// Rooms (Ruangan)
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  type: roomTypeEnum("type").notNull(),
  capacity: integer("capacity").notNull(),
  allowedDepartments: json("allowed_departments").$type<string[]>(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

// Time Slots (Slot Waktu)
export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(), // Senin, Selasa, etc.
  startTime: text("start_time").notNull(), // e.g., "07:00"
  endTime: text("end_time").notNull(), // e.g., "08:30"
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  createdAt: true,
});

// Teacher-Subject Assignment
export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => teachers.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeacherSubjectSchema = createInsertSchema(teacherSubjects).omit({
  id: true,
  createdAt: true,
});

// Class-Subject Assignment
export const classSubjects = pgTable("class_subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassSubjectSchema = createInsertSchema(classSubjects).omit({
  id: true,
  createdAt: true,
});

// Schedule Generation
export const scheduleGenerations = pgTable("schedule_generations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  academicYear: text("academic_year").notNull(),
  semester: text("semester").notNull(), // "ganjil" or "genap"
  populationSize: integer("population_size").notNull(),
  maxGenerations: integer("max_generations").notNull(),
  crossoverRate: text("crossover_rate").notNull(),
  mutationRate: text("mutation_rate").notNull(),
  selectionMethod: text("selection_method").notNull(),
  fitnessValue: text("fitness_value"), // final fitness value achieved
  executionTime: integer("execution_time"), // in seconds
  conflictCount: integer("conflict_count"), // number of conflicts in final schedule
  data: json("data").$type<any>(), // the actual schedule data
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertScheduleGenerationSchema = createInsertSchema(scheduleGenerations).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  fitnessValue: true,
  executionTime: true,
  conflictCount: true,
  data: true,
  status: true,
});

// Schedules (Jadwal)
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  generationId: integer("generation_id").references(() => scheduleGenerations.id),
  classId: integer("class_id").references(() => classes.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  teacherId: integer("teacher_id").references(() => teachers.id),
  roomId: integer("room_id").references(() => rooms.id),
  timeSlotId: integer("time_slot_id").references(() => timeSlots.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

// App Settings
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  appName: text("app_name").notNull().default("SMARTA"),
  appLogo: text("app_logo"),
  footerText: text("footer_text"),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Curriculum = typeof curricula.$inferSelect;
export type InsertCurriculum = z.infer<typeof insertCurriculumSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;

export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;

export type ClassSubject = typeof classSubjects.$inferSelect;
export type InsertClassSubject = z.infer<typeof insertClassSubjectSchema>;

export type ScheduleGeneration = typeof scheduleGenerations.$inferSelect;
export type InsertScheduleGeneration = z.infer<typeof insertScheduleGenerationSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
