import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CreditCard,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import type {
  AppTab,
  AttendanceStatus,
  CalendarSession,
  Classroom,
  ClassroomPost,
  ExamDocument,
  NotificationItem,
  ProgressTestScore,
  StudentRecord,
  StudentSubmission,
  TuitionPayment,
  UserProfile,
  UserRole,
} from './types';
import {
  INITIAL_CLASSES,
  INITIAL_EXAM,
  INITIAL_NOTIFICATIONS,
  INITIAL_POSTS,
  INITIAL_PROGRESS_SCORES,
  INITIAL_STUDENTS,
  INITIAL_SUBMISSIONS,
  STUDENT_DEMO_PROFILES,
  TUTOR_PROFILE,
  createInitialPayments,
  createInitialSessions,
} from './services/seedData';
import {
  calculateMonthlyTuitionSummary,
  formatDateISO,
} from './utils/tutorLogic';
import { AvatarBadge } from './components/AvatarBadge';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { TuitionView } from './components/TuitionView';
import { ClassroomView } from './components/ClassroomView';
import { ExamBuilderView } from './components/ExamBuilderView';
import { ProgressReportView } from './components/ProgressReportView';
import { SetupGuideModal } from './components/SetupGuideModal';
import { GoogleSignInModal } from './components/GoogleSignInModal';

const STORAGE_KEY = 'tutorpro_ai_workspace_v1';

interface PersistedState {
  role: UserRole;
  currentStudentId: string;
  classes: Classroom[];
  students: StudentRecord[];
  sessions: CalendarSession[];
  payments: TuitionPayment[];
  posts: ClassroomPost[];
  submissions: StudentSubmission[];
  notifications: NotificationItem[];
  scores: ProgressTestScore[];
  exam: ExamDocument;
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed && Array.isArray(parsed.classes) && Array.isArray(parsed.sessions)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to deterministic seed data
  }
  return {
    role: 'tutor',
    currentStudentId: 'stu-1',
    classes: INITIAL_CLASSES,
    students: INITIAL_STUDENTS,
    sessions: createInitialSessions(new Date()),
    payments: createInitialPayments(new Date()),
    posts: INITIAL_POSTS,
    submissions: INITIAL_SUBMISSIONS,
    notifications: INITIAL_NOTIFICATIONS,
    scores: INITIAL_PROGRESS_SCORES,
    exam: INITIAL_EXAM,
  };
}

const TAB_TITLES: Record<AppTab, string> = {
  dashboard: 'Bảng điều khiển tổng quan',
  calendar: 'Lịch dạy thời gian thực',
  tuition: 'Học phí & Điểm danh tự động',
  classroom: 'Lớp học & Kho tài liệu',
  exam: 'Trình soạn đề thi AI (A4)',
  progress: 'Báo cáo tiến độ học tập',
};

export default function App() {
  const [initial] = useState<PersistedState>(() => loadInitialState());

  const [role, setRole] = useState<UserRole>(initial.role);
  const [currentStudentId, setCurrentStudentId] = useState<string>(
    initial.currentStudentId
  );
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [yearMonth, setYearMonth] = useState<string>(() =>
    formatDateISO(new Date()).slice(0, 7)
  );

  const [classes, setClasses] = useState<Classroom[]>(initial.classes);
  const [students, setStudents] = useState<StudentRecord[]>(initial.students);
  const [sessions, setSessions] = useState<CalendarSession[]>(initial.sessions);
  const [payments, setPayments] = useState<TuitionPayment[]>(initial.payments);
  const [posts, setPosts] = useState<ClassroomPost[]>(initial.posts);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(
    initial.submissions
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initial.notifications
  );
  const [scores, setScores] = useState<ProgressTestScore[]>(initial.scores);
  const [exam, setExam] = useState<ExamDocument>(initial.exam);

  // UI Chrome State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [geminiReady, setGeminiReady] = useState<boolean | null>(null);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setGeminiReady(Boolean(d.geminiReady)))
      .catch(() => setGeminiReady(false));
  }, []);

  useEffect(() => {
    const payload: PersistedState = {
      role,
      currentStudentId,
      classes,
      students,
      sessions,
      payments,
      posts,
      submissions,
      notifications,
      scores,
      exam,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }, [
    role,
    currentStudentId,
    classes,
    students,
    sessions,
    payments,
    posts,
    submissions,
    notifications,
    scores,
    exam,
  ]);

  const showToast = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const activeUserProfile: UserProfile = useMemo(() => {
    if (role === 'tutor') return TUTOR_PROFILE;
    const foundStu = students.find((s) => s.id === currentStudentId);
    const demoProf = STUDENT_DEMO_PROFILES.find(
      (p) => p.id === currentStudentId
    );
    return (
      demoProf || {
        id: foundStu?.id || 'stu-1',
        name: foundStu?.name || 'Học sinh',
        email: foundStu?.email || 'student@gmail.com',
        role: 'student',
        avatarUrl: foundStu?.avatarUrl || '',
        school: foundStu?.school,
      }
    );
  }, [role, students, currentStudentId]);

  const tuitionSummary = useMemo(
    () =>
      calculateMonthlyTuitionSummary(
        sessions,
        classes,
        students,
        payments,
        yearMonth
      ),
    [sessions, classes, students, payments, yearMonth]
  );

  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (n) => n.targetRole === 'all' || n.targetRole === role
      ),
    [notifications, role]
  );

  const unreadCount = useMemo(
    () => visibleNotifications.filter((n) => !n.read).length,
    [visibleNotifications]
  );

  // Handlers
  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    setNotifPopoverOpen(false);
    if (
      nextRole === 'student' &&
      (activeTab === 'exam' || activeTab === 'tuition')
    ) {
      setActiveTab('dashboard');
    }
  };

  const handleSelectProfile = (profile: UserProfile) => {
    if (profile.role === 'tutor') {
      handleRoleSwitch('tutor');
    } else {
      setCurrentStudentId(profile.id);
      handleRoleSwitch('student');
    }
    showToast(`Đã chuyển sang tài khoản ${profile.name}`);
  };

  const handleSaveSessions = (
    incoming: CalendarSession[],
    replaceId?: string
  ) => {
    if (replaceId) {
      setSessions((prev) =>
        prev.map((s) => (s.id === replaceId ? incoming[0] : s))
      );
      showToast('Đã cập nhật buổi dạy trên lịch.');
    } else {
      setSessions((prev) => [...prev, ...incoming]);
      showToast(
        incoming.length > 1
          ? `Đã tạo ${incoming.length} buổi học định kỳ.`
          : 'Đã thêm buổi dạy mới vào lịch.'
      );
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Đã xóa buổi dạy khỏi lịch.');
  };

  const handleUpdateAttendance = (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          status: status === 'present' && s.status === 'upcoming' ? 'completed' : s.status,
          attendance: {
            ...s.attendance,
            [studentId]: status,
          },
        };
      })
    );
  };

  const handleTogglePayment = (studentId: string, classId: string) => {
    setPayments((prev) => {
      const existing = prev.find(
        (p) =>
          p.studentId === studentId &&
          p.classId === classId &&
          p.yearMonth === yearMonth
      );
      if (existing) {
        return prev.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                paid: !p.paid,
                paidAt: !p.paid ? formatDateISO(new Date()) : undefined,
              }
            : p
        );
      }
      return [
        ...prev,
        {
          id: `pay-${studentId}-${classId}-${yearMonth}`,
          studentId,
          classId,
          yearMonth,
          paid: true,
          paidAt: formatDateISO(new Date()),
          method: 'Chuyển khoản',
        },
      ];
    });
  };

  const handleUpdateClassRate = (classId: string, newRate: number) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, tuitionPerSession: newRate } : c
      )
    );
  };

  const handleUpdateStudentRate = (
    studentId: string,
    classId: string,
    newRate: number | null
  ) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;
        const nextOverrides = { ...(st.customTuitionOverride || {}) };
        if (newRate === null) {
          delete nextOverrides[classId];
        } else {
          nextOverrides[classId] = newRate;
        }
        return { ...st, customTuitionOverride: nextOverrides };
      })
    );
  };

  const handleCreatePost = async (newPost: ClassroomPost) => {
    setPosts((prev) => [newPost, ...prev]);
    const cls = classes.find((c) => c.id === newPost.classId);

    // Add bell notification for students
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title:
        newPost.kind === 'assignment'
          ? `Bài tập mới: ${cls?.name || ''}`
          : `Tài liệu mới: ${cls?.name || ''}`,
      message: newPost.title,
      createdAt: 'Vừa xong',
      read: false,
      targetRole: 'student',
      tabTarget: 'classroom',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Trigger backend email dispatch route
    try {
      await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: newPost.emailDispatchedTo || [],
          className: cls?.name,
          postTitle: newPost.title,
          subject: `[TutorPro AI] ${cls?.name}: ${newPost.title}`,
        }),
      });
    } catch {
      // Non-blocking
    }
    showToast(
      `Đã đăng bài và gửi thông báo tới ${newPost.emailDispatchedTo?.length || 0} Gmail học sinh.`
    );
  };

  const handleSubmitHomework = (sub: StudentSubmission) => {
    setSubmissions((prev) => [sub, ...prev]);
    const stu = students.find((s) => s.id === sub.studentId);
    setNotifications((prev) => [
      {
        id: `notif-sub-${Date.now()}`,
        title: 'Học sinh vừa nộp bài tập',
        message: `${stu?.name || 'Học sinh'} đã nộp ${sub.fileName}`,
        createdAt: 'Vừa xong',
        read: false,
        targetRole: 'tutor',
        tabTarget: 'classroom',
      },
      ...prev,
    ]);
    showToast('Đã nộp bài thành công! Gia sư sẽ nhận được thông báo.');
  };

  const handleGradeSubmission = (
    submissionId: string,
    score: number,
    feedback: string
  ) => {
    let gradedSub: StudentSubmission | undefined;
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== submissionId) return s;
        gradedSub = { ...s, score, feedback, status: 'graded' };
        return gradedSub;
      })
    );

    if (gradedSub) {
      const post = posts.find((p) => p.id === gradedSub!.postId);
      setScores((prev) => [
        ...prev,
        {
          id: `sc-grade-${Date.now()}`,
          studentId: gradedSub!.studentId,
          classId: post?.classId || classes[0].id,
          testName: post?.title.slice(0, 32) || 'Bài tập đã chấm',
          date: formatDateISO(new Date()),
          score,
          maxScore: 10,
          note: feedback,
        },
      ]);
      setNotifications((prev) => [
        {
          id: `notif-gr-${Date.now()}`,
          title: `Gia sư đã chấm bài (${score}/10)`,
          message: feedback,
          createdAt: 'Vừa xong',
          read: false,
          targetRole: 'student',
          tabTarget: 'classroom',
        },
        ...prev,
      ]);
    }
    showToast('Đã lưu điểm & đồng bộ vào báo cáo tiến độ học sinh.');
  };

  const handleJoinClassByCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    const target = classes.find((c) => c.classCode.toUpperCase() === clean);
    if (!target) {
      return {
        ok: false,
        message: `Không tìm thấy lớp học với mã "${clean}".`,
      };
    }
    if (target.studentIds.includes(currentStudentId)) {
      return { ok: true, message: `Bạn đã ở trong lớp ${target.name}.` };
    }
    setClasses((prev) =>
      prev.map((c) =>
        c.id === target.id
          ? { ...c, studentIds: [...c.studentIds, currentStudentId] }
          : c
      )
    );
    showToast(`Đã tham gia lớp ${target.name}!`);
    return { ok: true, message: `Đã tham gia lớp ${target.name} thành công.` };
  };

  const navItems: { id: AppTab; label: string; icon: React.ElementType; tutorOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'calendar', label: 'Lịch dạy', icon: CalendarDays },
    { id: 'tuition', label: 'Học phí & Điểm danh', icon: CreditCard, tutorOnly: true },
    { id: 'classroom', label: 'Lớp học & Tài liệu', icon: BookOpen },
    { id: 'exam', label: 'Soạn đề thi AI', icon: FileSpreadsheet, tutorOnly: true },
    { id: 'progress', label: 'Tiến độ học tập', icon: LineChart },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.tutorOnly || role === 'tutor'
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30 no-print">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            TutorPro AI
          </span>
        </div>

        <nav
          aria-label="Điều hướng chính"
          className="flex-1 px-3 py-5 space-y-1 overflow-y-auto"
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <button
            type="button"
            onClick={() => setSetupModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            Cấu hình Gemini &amp; Firebase
          </button>

          <button
            type="button"
            onClick={() => setSignInModalOpen(true)}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
          >
            <AvatarBadge
              name={activeUserProfile.name}
              src={activeUserProfile.avatarUrl}
              sizeClass="w-8 h-8 text-xs"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {activeUserProfile.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {role === 'tutor' ? 'Giáo viên / Gia sư' : 'Học sinh'}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
        >
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200">
              <span className="text-base font-bold text-slate-900">TutorPro AI</span>
              <button
                type="button"
                aria-label="Đóng menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSetupModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <Settings className="w-4 h-4" />
                Cấu hình Gemini &amp; Firebase
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSignInModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left"
              >
                <AvatarBadge
                  name={activeUserProfile.name}
                  src={activeUserProfile.avatarUrl}
                  sizeClass="w-8 h-8 text-xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {activeUserProfile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Đổi tài khoản Google
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-20 h-14 sm:h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Mở menu điều hướng"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                {TAB_TITLES[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Role Segmented Switcher */}
            <div
              role="group"
              aria-label="Chuyển đổi phân quyền"
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                onClick={() => handleRoleSwitch('tutor')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  role === 'tutor'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gia sư
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('student')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  role === 'student'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Học sinh
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label={`Thông báo (${unreadCount} chưa đọc)`}
                onClick={() => setNotifPopoverOpen((o) => !o)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifPopoverOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      Thông báo hệ thống
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        )
                      }
                      className="text-[11px] font-medium text-blue-600 hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {visibleNotifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500">
                        Chưa có thông báo mới.
                      </p>
                    ) : (
                      visibleNotifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((x) =>
                                x.id === n.id ? { ...x, read: true } : x
                              )
                            );
                            if (n.tabTarget) setActiveTab(n.tabTarget);
                            setNotifPopoverOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                            !n.read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {n.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {n.createdAt}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile / Sign In Trigger */}
            <button
              type="button"
              aria-label="Tài khoản Google Sign-In"
              onClick={() => setSignInModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <AvatarBadge
                name={activeUserProfile.name}
                src={activeUserProfile.avatarUrl}
                sizeClass="w-6 h-6 text-[10px]"
              />
              <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate">
                {activeUserProfile.name}
              </span>
            </button>
          </div>
        </header>

        {/* Toast Feedback */}
        {toastBanner && (
          <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg no-print">
            {toastBanner}
          </div>
        )}

        {/* Active Module Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1380px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              role={role}
              currentStudentId={currentStudentId}
              classes={classes}
              students={students}
              sessions={sessions}
              posts={posts}
              submissions={submissions}
              scores={scores}
              tuitionSummary={tuitionSummary}
              onNavigate={setActiveTab}
              onUpdateAttendance={handleUpdateAttendance}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              role={role}
              currentStudentId={currentStudentId}
              classes={classes}
              students={students}
              sessions={sessions}
              onSaveSessions={handleSaveSessions}
              onDeleteSession={handleDeleteSession}
              onUpdateAttendance={handleUpdateAttendance}
            />
          )}

          {activeTab === 'tuition' && role === 'tutor' && (
            <TuitionView
              role={role}
              currentStudentId={currentStudentId}
              tutorName={TUTOR_PROFILE.name}
              yearMonth={yearMonth}
              onChangeYearMonth={setYearMonth}
              classes={classes}
              students={students}
              summary={tuitionSummary}
              onTogglePayment={handleTogglePayment}
              onUpdateClassRate={handleUpdateClassRate}
              onUpdateStudentRate={handleUpdateStudentRate}
            />
          )}

          {activeTab === 'classroom' && (
            <ClassroomView
              role={role}
              currentStudentId={currentStudentId}
              classes={classes}
              students={students}
              posts={posts}
              submissions={submissions}
              onCreatePost={handleCreatePost}
              onSubmitHomework={handleSubmitHomework}
              onGradeSubmission={handleGradeSubmission}
              onJoinClassByCode={handleJoinClassByCode}
            />
          )}

          {activeTab === 'exam' && role === 'tutor' && (
            <ExamBuilderView exam={exam} onChangeExam={setExam} />
          )}

          {activeTab === 'progress' && (
            <ProgressReportView
              role={role}
              currentStudentId={currentStudentId}
              students={students}
              classes={classes}
              scores={scores}
              onAddScore={(sc) => {
                setScores((prev) => [...prev, sc]);
                showToast('Đã ghi nhận điểm kiểm tra mới.');
              }}
              onUpdateComment={(stuId, comment) =>
                setStudents((prev) =>
                  prev.map((st) =>
                    st.id === stuId
                      ? { ...st, tutorSummaryComment: comment }
                      : st
                  )
                )
              }
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <SetupGuideModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        geminiReady={geminiReady}
      />

      <GoogleSignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        tutorProfile={TUTOR_PROFILE}
        studentProfiles={STUDENT_DEMO_PROFILES}
        onSelectDemoProfile={handleSelectProfile}
      />
    </div>
  );
}
