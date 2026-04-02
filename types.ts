
export interface Notification {
  id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  room?: string;
  description: string;
  type: 'urgent' | 'social' | 'academic';
}

export interface Exam {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  subject: string;
  branch: string; // CSE, ECE, MECH, etc.
  description?: string;
  marks?: number;
  internalScore?: number;
  status?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  branch: string;
  author: string;
  date: string;
}

export interface CourseRegistration {
  userId: string;
  courseId: string;
  registrationDate: string;
}

export interface Club {
  id: string;
  name: string;
  members: string;
  frequency: string;
  image: string;
}

export interface AttendanceDay {
  day: string;
  status: 'present' | 'absent' | 'none';
}

export interface AttendanceConfig {
  branches: string[];
  groups: string[];
}

export interface Student {
  id: string;
  name: string;
  branch: string;
  group: string;
  faceTemplate?: string; // Base64 or reference
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  date: string; // YYYY-MM-DD for uniqueness check
}

export interface BusRoute {
  id: string;
  number: string;
  destination: string;
  status: 'on-time' | 'delayed' | 'departed';
  nextStop: string;
  eta: string;
}
