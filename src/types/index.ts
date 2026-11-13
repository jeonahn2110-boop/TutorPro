export type UserRole = 'tutor' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  phone?: string;
  school?: string;
}

export type SessionStatus = 'upcoming' | 'completed' | 'makeup' | 'cancelled';

export type SessionColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';

export type AttendanceStatus = 'pending' | 'present' | 'excused' | 'unexcused';

export interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade: string;
  classCode: string;
  tuitionPerSession: number; // VND
  color: SessionColor;
  scheduleSummary: string;
  studentIds: string[];
  meetLink?: string;
}

export interface ProgressTestScore {
  id: string;
  studentId: string;
  classId: string;
  testName: string;
  date: string; // YYYY-MM-DD
  score: number; // 0 - 10
  maxScore: number;
  note?: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  email: string; // Gmail for Google Sign-In & notifications
  parentName: string;
  parentPhone: string;
  grade: string;
  school: string;
  avatarUrl?: string;
  customTuitionOverride?: Record<string, number>; // classId -> custom rate VND
  tutorSummaryComment?: string;
}

export interface CalendarSession {
  id: string;
  classId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  meetLink?: string;
  notes?: string;
  color: SessionColor;
  status: SessionStatus;
  recurringGroupId?: string;
  recurringDays?: number[]; // 0=Sun..6=Sat
  attendance: Record<string, AttendanceStatus>; // studentId -> status
}

export interface TuitionPayment {
  id: string;
  studentId: string;
  classId: string;
  yearMonth: string; // YYYY-MM
  paid: boolean;
  paidAt?: string;
  method?: 'Chuyển khoản' | 'Tiền mặt';
}

export type MaterialType = 'pdf' | 'word' | 'slide' | 'video' | 'link';

export interface AttachmentItem {
  id: string;
  name: string;
  type: MaterialType;
  url: string;
  sizeLabel?: string;
}

export interface StudentSubmission {
  id: string;
  postId: string;
  studentId: string;
  submittedAt: string;
  fileName: string;
  fileType: 'image' | 'pdf' | 'doc';
  previewNote?: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
}

export interface ClassroomPost {
  id: string;
  classId: string;
  kind: 'lecture' | 'assignment';
  title: string;
  content: string;
  createdAt: string;
  deadline?: string; // ISO or YYYY-MM-DDTHH:mm
  attachments: AttachmentItem[];
  emailDispatchedTo?: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetRole: UserRole | 'all';
  tabTarget?: AppTab;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export interface TrueFalseStatement {
  label: string; // a, b, c, d
  text: string;
  isTrue: boolean;
}

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  cognitiveLevel: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
  prompt: string; // Supports LaTeX $...$ and $$...$$
  options?: string[]; // 4 options for multiple_choice
  correctOptionIndex?: number; // 0..3
  statements?: TrueFalseStatement[]; // 4 statements for true_false
  shortAnswer?: string;
  rubricSteps: { step: string; points: number }[];
  totalPoints: number;
}

export interface ExamHeaderMeta {
  departmentName: string; // e.g. SỞ GD&ĐT TP. HỒ CHÍ MINH
  schoolName: string; // e.g. TRUNG TÂM GIA SƯ TUTORPRO AI
  examTitle: string; // e.g. ĐỀ KIỂM TRA GIỮA HỌC KỲ I
  subject: string; // Toán học
  grade: string; // Lớp 9
  durationMinutes: number; // 90
  examCode: string; // 101
  academicYear: string; // 2026 - 2027
}

export interface ExamDocument {
  id: string;
  header: ExamHeaderMeta;
  questions: ExamQuestion[];
  updatedAt: string;
}

export type AppTab =
  | 'dashboard'
  | 'calendar'
  | 'tuition'
  | 'classroom'
  | 'exam'
  | 'progress';

export interface StudentTuitionBreakdown {
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  classId: string;
  className: string;
  ratePerSession: number;
  presentCount: number;
  excusedCount: number;
  unexcusedCount: number;
  scheduledCount: number;
  totalAmount: number;
  paid: boolean;
  paidAt?: string;
}

export interface MonthlyTuitionSummary {
  yearMonth: string;
  totalExpected: number; // Based on scheduled + present active sessions
  totalActualEarned: number; // Based on present sessions
  totalCollected: number;
  totalUnpaid: number;
  totalPresentSessions: number;
  breakdowns: StudentTuitionBreakdown[];
}
