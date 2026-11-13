import React from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  Video,
  AlertCircle,
} from 'lucide-react';
import type {
  AppTab,
  AttendanceStatus,
  CalendarSession,
  Classroom,
  ClassroomPost,
  MonthlyTuitionSummary,
  ProgressTestScore,
  StudentRecord,
  StudentSubmission,
  UserRole,
} from '../types';
import { formatDateISO, formatVND } from '../utils/tutorLogic';
import { AvatarBadge } from './AvatarBadge';

interface DashboardViewProps {
  role: UserRole;
  currentStudentId: string;
  classes: Classroom[];
  students: StudentRecord[];
  sessions: CalendarSession[];
  posts: ClassroomPost[];
  submissions: StudentSubmission[];
  scores: ProgressTestScore[];
  tuitionSummary: MonthlyTuitionSummary;
  onNavigate: (tab: AppTab) => void;
  onUpdateAttendance: (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => void;
}

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  pending: 'Chưa điểm danh',
  present: 'Có mặt',
  excused: 'Vắng có phép',
  unexcused: 'Vắng không phép',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  role,
  currentStudentId,
  classes,
  students,
  sessions,
  posts,
  submissions,
  scores,
  tuitionSummary,
  onNavigate,
  onUpdateAttendance,
}) => {
  const todayISO = formatDateISO(new Date());
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const postMap = new Map(posts.map((p) => [p.id, p]));

  const visibleSessions =
    role === 'tutor'
      ? sessions
      : sessions.filter((s) => {
          const cls = classMap.get(s.classId);
          return cls?.studentIds.includes(currentStudentId);
        });

  const todaySessions = visibleSessions
    .filter((s) => s.date === todayISO && s.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted');
  const unpaidBreakdowns = tuitionSummary.breakdowns.filter(
    (b) => !b.paid && b.totalAmount > 0
  );

  // Student-specific aggregations
  const studentClasses = classes.filter((c) =>
    c.studentIds.includes(currentStudentId)
  );
  const studentAssignments = posts.filter(
    (p) =>
      p.kind === 'assignment' &&
      studentClasses.some((c) => c.id === p.classId)
  );
  const studentLectures = posts.filter(
    (p) =>
      p.kind === 'lecture' &&
      studentClasses.some((c) => c.id === p.classId)
  );
  const studentRecentScores = scores
    .filter((s) => s.studentId === currentStudentId)
    .slice(-3)
    .reverse();

  if (role === 'student') {
    const currentStudent = studentMap.get(currentStudentId);
    const pendingHomeworkCount = studentAssignments.filter(
      (a) => !submissions.some((s) => s.postId === a.id && s.studentId === currentStudentId)
    ).length;

    return (
      <div className="space-y-8">
        {/* KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Buổi học hôm nay</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums font-mono-num">
              {todaySessions.length} buổi
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {todaySessions[0]
                ? `Bắt đầu lúc ${todaySessions[0].startTime}`
                : 'Không có lịch học hôm nay'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Bài tập được giao</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums font-mono-num">
              {studentAssignments.length} bài
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {pendingHomeworkCount > 0
                ? `${pendingHomeworkCount} bài chưa nộp`
                : 'Đã nộp đủ bài tập'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Điểm kiểm tra gần nhất</p>
            <p className="mt-2 text-2xl font-bold text-blue-600 tabular-nums font-mono-num">
              {studentRecentScores[0]
                ? `${studentRecentScores[0].score.toFixed(1)} / 10`
                : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500 truncate">
              {studentRecentScores[0]?.testName || 'Chưa có bài kiểm tra'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Tài liệu &amp; Bài giảng</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums font-mono-num">
              {studentLectures.length} mục
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Thuộc {studentClasses.length} lớp đang theo học
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's schedule */}
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Lịch học hôm nay
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xin chào {currentStudent?.name}, kiểm tra giờ vào lớp trực tuyến bên dưới
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0"
              >
                Xem toàn bộ lịch
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todaySessions.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Hôm nay bạn không có ca học nào
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy tranh thủ xem lại tài liệu hoặc làm bài tập về nhà.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {todaySessions.map((sess) => {
                  const cls = classMap.get(sess.classId);
                  const att = sess.attendance[currentStudentId] || 'pending';
                  return (
                    <div
                      key={sess.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                          <span className="font-mono-num font-medium text-slate-700">
                            {sess.startTime} – {sess.endTime}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{cls?.name}</span>
                          <span aria-hidden="true">·</span>
                          <span className={att === 'present' ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                            {ATTENDANCE_LABELS[att]}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          {sess.title}
                        </p>
                        {sess.notes && (
                          <p className="text-xs text-slate-500 mt-0.5">{sess.notes}</p>
                        )}
                      </div>

                      {sess.meetLink && (
                        <a
                          href={sess.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Vào lớp online
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Homework & Feedback */}
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Bài tập &amp; Tài liệu mới
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('classroom')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0"
              >
                Vào lớp học
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {studentAssignments.slice(0, 4).map((post) => {
                const cls = classMap.get(post.classId);
                const mySub = submissions.find(
                  (s) => s.postId === post.id && s.studentId === currentStudentId
                );
                return (
                  <div key={post.id} className="py-3.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="truncate">{cls?.name}</span>
                      <span className="shrink-0 tabular-nums">
                        {post.deadline ? `Hạn: ${post.deadline.replace('T', ' ')}` : post.createdAt}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {post.title}
                    </p>
                    <p className="text-xs mt-1 font-medium">
                      {mySub ? (
                        mySub.status === 'graded' ? (
                          <span className="text-emerald-700">
                            Đã chấm: {mySub.score}/10 · {mySub.feedback}
                          </span>
                        ) : (
                          <span className="text-blue-600">
                            Đã nộp ({mySub.fileName}) · Chờ gia sư chấm
                          </span>
                        )
                      ) : (
                        <span className="text-amber-700">Chưa nộp bài</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // TUTOR DASHBOARD
  return (
    <div className="space-y-8">
      {/* Top 4-KPI Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Ca dạy hôm nay</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums font-mono-num">
            {todaySessions.length} ca
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {todaySessions[0]
              ? `Ca gần nhất: ${todaySessions[0].startTime}`
              : 'Lịch trống hôm nay'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Bài nộp chờ chấm</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600 tabular-nums font-mono-num">
            {pendingSubmissions.length} bài
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Từ {classes.length} lớp học đang hoạt động
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Doanh thu đã thu ({tuitionSummary.yearMonth})</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums font-mono-num">
            {formatVND(tuitionSummary.totalCollected)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Tổng {tuitionSummary.totalPresentSessions} lượt Có mặt
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Học phí chưa thanh toán</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700 tabular-nums font-mono-num">
            {formatVND(tuitionSummary.totalUnpaid)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {unpaidBreakdowns.length} học sinh cần nhắc phí
          </p>
        </div>
      </section>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Teaching Schedule + Quick Attendance */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Lịch dạy hôm nay &amp; Điểm danh nhanh
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đánh dấu Có mặt để tự động cộng buổi vào bảng học phí tháng
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0"
            >
              Mở lịch dạy
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todaySessions.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Chưa có buổi dạy nào trong ngày hôm nay
              </p>
              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="mt-3 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tạo lịch dạy nhanh
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 mt-2">
              {todaySessions.map((sess) => {
                const cls = classMap.get(sess.classId);
                const roster = (cls?.studentIds || [])
                  .map((id) => studentMap.get(id))
                  .filter(Boolean) as StudentRecord[];

                return (
                  <div key={sess.id} className="py-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono-num font-semibold text-slate-800">
                            {sess.startTime} – {sess.endTime}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{cls?.name}</span>
                          {sess.status === 'makeup' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700 font-medium">Dạy bù</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mt-1">
                          {sess.title}
                        </h3>
                      </div>

                      {sess.meetLink && (
                        <a
                          href={sess.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          <Video className="w-3.5 h-3.5 text-blue-600" />
                          Mở phòng dạy
                        </a>
                      )}
                    </div>

                    {/* Quick inline attendance buttons per student */}
                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                      {roster.map((st) => {
                        const currentAtt = sess.attendance[st.id] || 'pending';
                        return (
                          <div
                            key={st.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <AvatarBadge
                                name={st.name}
                                src={st.avatarUrl}
                                sizeClass="w-6 h-6 text-[10px]"
                              />
                              <span className="font-medium text-slate-800 truncate">
                                {st.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {(
                                [
                                  ['present', 'Có mặt'],
                                  ['excused', 'Có phép'],
                                  ['unexcused', 'Không phép'],
                                ] as [AttendanceStatus, string][]
                              ).map(([statusKey, label]) => {
                                const active = currentAtt === statusKey;
                                const activeStyle =
                                  statusKey === 'present'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : statusKey === 'excused'
                                      ? 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-rose-600 text-white border-rose-600';
                                return (
                                  <button
                                    key={statusKey}
                                    type="button"
                                    onClick={() =>
                                      onUpdateAttendance(sess.id, st.id, statusKey)
                                    }
                                    className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                                      active
                                        ? activeStyle
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: New Submissions + Tuition Reminders */}
        <div className="lg:col-span-5 space-y-6">
          {/* New Student Submissions */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Bài tập học sinh mới nộp
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('classroom')}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0"
              >
                Chấm bài ngay
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                Tất cả bài nộp đã được chấm điểm.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {pendingSubmissions.map((sub) => {
                  const st = studentMap.get(sub.studentId);
                  const post = postMap.get(sub.postId);
                  return (
                    <div key={sub.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <AvatarBadge
                          name={st?.name || 'Học sinh'}
                          src={st?.avatarUrl}
                          sizeClass="w-8 h-8 text-xs"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {st?.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {post?.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {sub.fileName} · {sub.submittedAt}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('classroom')}
                        className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md whitespace-nowrap shrink-0"
                      >
                        Chấm điểm
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Tuition Reminders */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Nhắc nhở học phí đến hạn
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('tuition')}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0"
              >
                Quản lý học phí
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {unpaidBreakdowns.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Toàn bộ học phí tháng đã được thanh toán đầy đủ.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {unpaidBreakdowns.slice(0, 4).map((row) => (
                  <div
                    key={`${row.studentId}-${row.classId}`}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        {row.studentName}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {row.className} · {row.presentCount} buổi Có mặt
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums font-mono-num shrink-0">
                      {formatVND(row.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
