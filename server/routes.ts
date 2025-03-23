import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertUserSchema,
  insertCurriculumSchema,
  insertSubjectSchema,
  insertTeacherSchema,
  insertClassSchema,
  insertRoomSchema,
  insertTimeSlotSchema,
  insertTeacherSubjectSchema,
  insertClassSubjectSchema,
  insertScheduleGenerationSchema,
  insertAppSettingsSchema
} from "@shared/schema";
import { generateSchedule } from "./geneticAlgorithm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // User routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat pengguna" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui pengguna" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    const result = await storage.deleteUser(id);
    
    if (!result) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Curriculum routes
  app.get("/api/curricula", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const curricula = await storage.getCurricula();
    res.json(curricula);
  });

  app.post("/api/curricula", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const curriculumData = insertCurriculumSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const curriculum = await storage.createCurriculum(curriculumData);
      res.status(201).json(curriculum);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat kurikulum" });
    }
  });

  app.put("/api/curricula/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    
    try {
      const curriculumData = insertCurriculumSchema.partial().parse(req.body);
      const curriculum = await storage.updateCurriculum(id, curriculumData);
      
      if (!curriculum) {
        return res.status(404).json({ message: "Kurikulum tidak ditemukan" });
      }
      
      res.json(curriculum);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui kurikulum" });
    }
  });

  app.delete("/api/curricula/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    const result = await storage.deleteCurriculum(id);
    
    if (!result) {
      return res.status(404).json({ message: "Kurikulum tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Subject routes
  app.get("/api/subjects", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const curriculumId = req.query.curriculumId ? parseInt(req.query.curriculumId as string) : undefined;
    let subjects;
    
    if (curriculumId) {
      subjects = await storage.getSubjectsByCurriculum(curriculumId);
    } else {
      subjects = await storage.getSubjects();
    }
    
    res.json(subjects);
  });

  app.post("/api/subjects", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const subjectData = insertSubjectSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const subject = await storage.createSubject(subjectData);
      res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat mata pelajaran" });
    }
  });

  app.put("/api/subjects/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    
    try {
      const subjectData = insertSubjectSchema.partial().parse(req.body);
      const subject = await storage.updateSubject(id, subjectData);
      
      if (!subject) {
        return res.status(404).json({ message: "Mata pelajaran tidak ditemukan" });
      }
      
      res.json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui mata pelajaran" });
    }
  });

  app.delete("/api/subjects/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    const result = await storage.deleteSubject(id);
    
    if (!result) {
      return res.status(404).json({ message: "Mata pelajaran tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Teacher routes
  app.get("/api/teachers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const teachers = await storage.getTeachers();
    res.json(teachers);
  });

  app.post("/api/teachers", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const teacherData = insertTeacherSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const teacher = await storage.createTeacher(teacherData);
      res.status(201).json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat data guru" });
    }
  });

  app.put("/api/teachers/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    
    try {
      const teacherData = insertTeacherSchema.partial().parse(req.body);
      const teacher = await storage.updateTeacher(id, teacherData);
      
      if (!teacher) {
        return res.status(404).json({ message: "Guru tidak ditemukan" });
      }
      
      res.json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui data guru" });
    }
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    const result = await storage.deleteTeacher(id);
    
    if (!result) {
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Class routes
  app.get("/api/classes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const curriculumId = req.query.curriculumId ? parseInt(req.query.curriculumId as string) : undefined;
    let classes;
    
    if (curriculumId) {
      classes = await storage.getClassesByCurriculum(curriculumId);
    } else {
      classes = await storage.getClasses();
    }
    
    res.json(classes);
  });

  app.post("/api/classes", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const classData = insertClassSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const cls = await storage.createClass(classData);
      res.status(201).json(cls);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat kelas" });
    }
  });

  app.put("/api/classes/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    
    try {
      const classData = insertClassSchema.partial().parse(req.body);
      const cls = await storage.updateClass(id, classData);
      
      if (!cls) {
        return res.status(404).json({ message: "Kelas tidak ditemukan" });
      }
      
      res.json(cls);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui kelas" });
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    const result = await storage.deleteClass(id);
    
    if (!result) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Room routes
  app.get("/api/rooms", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const type = req.query.type as string | undefined;
    let rooms;
    
    if (type) {
      rooms = await storage.getRoomsByType(type);
    } else {
      rooms = await storage.getRooms();
    }
    
    res.json(rooms);
  });

  app.post("/api/rooms", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const roomData = insertRoomSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat ruangan" });
    }
  });

  app.put("/api/rooms/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    
    try {
      const roomData = insertRoomSchema.partial().parse(req.body);
      const room = await storage.updateRoom(id, roomData);
      
      if (!room) {
        return res.status(404).json({ message: "Ruangan tidak ditemukan" });
      }
      
      res.json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui ruangan" });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    const result = await storage.deleteRoom(id);
    
    if (!result) {
      return res.status(404).json({ message: "Ruangan tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Time slot routes
  app.get("/api/timeslots", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const timeSlots = await storage.getTimeSlots();
    res.json(timeSlots);
  });

  app.post("/api/timeslots", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const timeSlotData = insertTimeSlotSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.status(201).json(timeSlot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat slot waktu" });
    }
  });

  app.put("/api/timeslots/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    
    try {
      const timeSlotData = insertTimeSlotSchema.partial().parse(req.body);
      const timeSlot = await storage.updateTimeSlot(id, timeSlotData);
      
      if (!timeSlot) {
        return res.status(404).json({ message: "Slot waktu tidak ditemukan" });
      }
      
      res.json(timeSlot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui slot waktu" });
    }
  });

  app.delete("/api/timeslots/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    const result = await storage.deleteTimeSlot(id);
    
    if (!result) {
      return res.status(404).json({ message: "Slot waktu tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Teacher-Subject assignment routes
  app.get("/api/teacher-subjects/:teacherId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const teacherId = parseInt(req.params.teacherId);
    const subjects = await storage.getTeacherSubjects(teacherId);
    res.json(subjects);
  });

  app.get("/api/subject-teachers/:subjectId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const subjectId = parseInt(req.params.subjectId);
    const teachers = await storage.getSubjectTeachers(subjectId);
    res.json(teachers);
  });

  app.post("/api/teacher-subjects", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const assignmentData = insertTeacherSubjectSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const assignment = await storage.assignTeacherToSubject(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat penetapan guru-mata pelajaran" });
    }
  });

  app.delete("/api/teacher-subjects/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    const result = await storage.removeTeacherSubject(id);
    
    if (!result) {
      return res.status(404).json({ message: "Penetapan guru-mata pelajaran tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Class-Subject assignment routes
  app.get("/api/class-subjects/:classId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const classId = parseInt(req.params.classId);
    const subjects = await storage.getClassSubjects(classId);
    res.json(subjects);
  });

  app.post("/api/class-subjects", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const assignmentData = insertClassSubjectSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const assignment = await storage.assignSubjectToClass(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat penetapan kelas-mata pelajaran" });
    }
  });

  app.delete("/api/class-subjects/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    const result = await storage.removeClassSubject(id);
    
    if (!result) {
      return res.status(404).json({ message: "Penetapan kelas-mata pelajaran tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Schedule generation routes
  app.get("/api/schedule-generations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const scheduleGenerations = await storage.getScheduleGenerations();
    res.json(scheduleGenerations);
  });

  app.get("/api/schedule-generations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const id = parseInt(req.params.id);
    const scheduleGeneration = await storage.getScheduleGeneration(id);
    
    if (!scheduleGeneration) {
      return res.status(404).json({ message: "Generasi jadwal tidak ditemukan" });
    }
    
    res.json(scheduleGeneration);
  });

  app.post("/api/schedule-generations", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const scheduleGenData = insertScheduleGenerationSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const scheduleGeneration = await storage.createScheduleGeneration(scheduleGenData);
      
      // Start the schedule generation process asynchronously
      generateSchedule(scheduleGeneration.id, storage).catch(console.error);
      
      res.status(201).json(scheduleGeneration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat membuat generasi jadwal" });
    }
  });

  app.delete("/api/schedule-generations/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'user')) {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    const id = parseInt(req.params.id);
    
    // First, delete all schedules associated with this generation
    await storage.deleteSchedulesByGeneration(id);
    
    // Then delete the generation itself
    const result = await storage.deleteScheduleGeneration(id);
    
    if (!result) {
      return res.status(404).json({ message: "Generasi jadwal tidak ditemukan" });
    }
    
    res.status(204).end();
  });

  // Schedule routes
  app.get("/api/schedules", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const generationId = req.query.generationId ? parseInt(req.query.generationId as string) : undefined;
    const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
    const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined;
    const roomId = req.query.roomId ? parseInt(req.query.roomId as string) : undefined;
    
    let schedules;
    
    if (generationId) {
      schedules = await storage.getSchedulesByGeneration(generationId);
    } else if (classId) {
      schedules = await storage.getSchedulesByClass(classId);
    } else if (teacherId) {
      schedules = await storage.getSchedulesByTeacher(teacherId);
    } else if (roomId) {
      schedules = await storage.getSchedulesByRoom(roomId);
    } else {
      schedules = await storage.getSchedules();
    }
    
    res.json(schedules);
  });

  // App settings routes
  app.get("/api/app-settings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }
    
    const settings = await storage.getAppSettings();
    res.json(settings);
  });

  app.put("/api/app-settings", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Tidak memiliki akses" });
    }
    
    try {
      const settingsData = insertAppSettingsSchema.partial().parse({
        ...req.body,
        updatedBy: req.user.id
      });
      
      const settings = await storage.updateAppSettings(settingsData);
      
      if (!settings) {
        return res.status(404).json({ message: "Pengaturan aplikasi tidak ditemukan" });
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui pengaturan aplikasi" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
