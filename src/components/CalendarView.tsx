import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Repeat,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import type {
  AttendanceStatus,
  CalendarSession,
  Classroom,
  SessionColor,
  SessionStatus,
  StudentRecord,
  UserRole,
} from '../types';
import {
  formatDateISO,
  getMonthGridDates,
  getWeekDates,
  timeToMinutes,
} from '../utils/tutorLogic';

interface CalendarViewProps {
  role: UserRole;
  currentStudentId: string;
  classes: Classroom[];
  students: StudentRecord[];
  sessions: CalendarSession[];
  onSaveSessions: (newOrUpdated: CalendarSession[], replaceId?: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateAttendance: (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => void;
}

type CalendarMode = 'day' | 'week' | 'month';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 -> 22:00
const HOUR_HEIGHT = 46; // Fits full 07:00-22:00 day cleanly in desktop viewport

const COLOR_STYLES: Record<
  SessionColor,
  { card: string; swatch: string; label: string }
> = {
  blue: {
    card: 'bg-blue-50 border-blue-200 text-blue-950 hover:bg-blue-100/80',
    swatch: 'bg-blue-600',
    label: 'Xanh dương',
  },
  emerald: {
    card: 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100/80',
    swatch: 'bg-emerald-600',
    label: 'Xanh lá',
  },
  amber: {
    card: 'bg-amber-50 border-amber-200 text-amber-950 hover:bg-amber-100/80',
    swatch: 'bg-amber-500',
    label: 'Vàng cam',
  },
  indigo: {
    card: 'bg-indigo-50 border-indigo-200 text-indigo-950 hover:bg-indigo-100/80',
    swatch: 'bg-indigo-600',
    label: 'Chàm',
  },
  rose: {
    card: 'bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-100/80',
    swatch: 'bg-rose-600',
    label: 'Đỏ hồng',
  },
  slate: {
    card: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200/70',
    swatch: 'bg-slate-600',
    label: 'Xám trung tính',
  },
};

const STATUS_LABELS: Record<SessionStatus, string> = {
  upcoming: 'Sắp tới',
  completed: 'Đã dạy',
  makeup: 'Dạy bù',
  cancelled: 'Đã hủy',
};

const DAY_NAMES_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DOW_OPTIONS = [
  { dow: 1, label: 'T2' },
  { dow: 2, label: 'T3' },
  { dow: 3, label: 'T4' },
  { dow: 4, label: 'T5' },
  { dow: 5, label: 'T6' },
  { dow: 6, label: 'T7' },
  { dow: 0, label: 'CN' },
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  role,
  currentStudentId,
  classes,
  students,
  sessions,
  onSaveSessions,
  onDeleteSession,
  onUpdateAttendance,
}) => {
  const [viewMode, setViewMode] = useState<CalendarMode>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Modal & Quick Attendance Drawer State
  const [editingSession, setEditingSession] = useState<CalendarSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] =
    useState<CalendarSession | null>(null);

  // Form states
  const [formClassId, setFormClassId] = useState(classes[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(formatDateISO(new Date()));
  const [formStartTime, setFormStartTime] = useState('18:00');
  const [formEndTime, setFormEndTime] = useState('19:30');
  const [formMeetLink, setFormMeetLink] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formColor, setFormColor] = useState<SessionColor>('blue');
  const [formStatus, setFormStatus] = useState<SessionStatus>('upcoming');
  const [formRepeatEnabled, setFormRepeatEnabled] = useState(false);
  const [formRepeatDays, setFormRepeatDays] = useState<number[]>([1, 3]);
  const [formRepeatWeeks, setFormRepeatWeeks] = useState(4);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const classMap = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes]
  );
  const studentMap = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );

  const visibleSessions = useMemo(() => {
    if (role === 'tutor') return sessions;
    return sessions.filter((s) => {
      const cls = classMap.get(s.classId);
      return cls?.studentIds.includes(currentStudentId);
    });
  }, [role, sessions, classMap, currentStudentId]);

  const todayISO = formatDateISO(new Date());
  const weekDates = useMemo(() => getWeekDates(anchorDate), [anchorDate]);
  const monthDates = useMemo(() => getMonthGridDates(anchorDate), [anchorDate]);

  const headerDateLabel = useMemo(() => {
    if (viewMode === 'day') {
      return `Ngày ${anchorDate.getDate()} tháng ${anchorDate.getMonth() + 1}, ${anchorDate.getFullYear()}`;
    }
    if (viewMode === 'week') {
      const first = weekDates[0];
      const last = weekDates[6];
      return `${first.getDate()}/${first.getMonth() + 1} – ${last.getDate()}/${last.getMonth() + 1}/${last.getFullYear()}`;
    }
    return `Tháng ${anchorDate.getMonth() + 1} / ${anchorDate.getFullYear()}`;
  }, [viewMode, anchorDate, weekDates]);

  const stepAnchor = (direction: -1 | 1) => {
    const next = new Date(anchorDate);
    if (viewMode === 'day') next.setDate(next.getDate() + direction);
    else if (viewMode === 'week') next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    setAnchorDate(next);
  };

  const openQuickCreateModal = (dateISO: string, hour: number) => {
    if (role !== 'tutor') return;
    const defaultClass = classes[0];
    setEditingSession(null);
    setFormClassId(defaultClass?.id || '');
    setFormTitle('');
    setFormDate(dateISO);
    const startH = String(Math.min(21, Math.max(7, hour))).padStart(2, '0');
    const endH = String(Math.min(22, Math.max(8, hour + 1))).padStart(2, '0');
    setFormStartTime(`${startH}:00`);
    setFormEndTime(`${endH}:30`);
    setFormMeetLink(defaultClass?.meetLink || '');
    setFormNotes('');
    setFormColor(defaultClass?.color || 'blue');
    setFormStatus('upcoming');
    setFormRepeatEnabled(false);
    setFormRepeatDays([new Date(dateISO).getDay()]);
    setFormRepeatWeeks(4);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sess: CalendarSession) => {
    if (role !== 'tutor') {
      setSelectedSessionForAttendance(sess);
      return;
    }
    setEditingSession(sess);
    setFormClassId(sess.classId);
    setFormTitle(sess.title);
    setFormDate(sess.date);
    setFormStartTime(sess.startTime);
    setFormEndTime(sess.endTime);
    setFormMeetLink(sess.meetLink || '');
    setFormNotes(sess.notes || '');
    setFormColor(sess.color);
    setFormStatus(sess.status);
    setFormRepeatEnabled(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleClassChange = (newClassId: string) => {
    setFormClassId(newClassId);
    const cls = classMap.get(newClassId);
    if (cls && !editingSession) {
      setFormColor(cls.color);
      setFormMeetLink(cls.meetLink || '');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Vui lòng nhập tiêu đề buổi học.');
      return;
    }
    if (timeToMinutes(formEndTime) <= timeToMinutes(formStartTime)) {
      setFormError('Giờ kết thúc phải lớn hơn giờ bắt đầu.');
      return;
    }

    const cls = classMap.get(formClassId);
    const initialAttendance: Record<string, AttendanceStatus> = {};
    (cls?.studentIds || []).forEach((id) => {
      initialAttendance[id] = editingSession?.attendance[id] || 'pending';
    });

    if (editingSession) {
      const updated: CalendarSession = {
        ...editingSession,
        classId: formClassId,
        title: formTitle.trim(),
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        meetLink: formMeetLink.trim() || undefined,
        notes: formNotes.trim() || undefined,
        color: formColor,
        status: formStatus,
        attendance: initialAttendance,
      };
      onSaveSessions([updated], editingSession.id);
      setIsModalOpen(false);
      return;
    }

    // Create new (single or recurring)
    if (formRepeatEnabled && formRepeatDays.length > 0) {
      import('../utils/tutorLogic').then(({ expandRecurringSessions }) => {
        const created = expandRecurringSessions(
          {
            classId: formClassId,
            title: formTitle.trim(),
            date: formDate,
            startTime: formStartTime,
            endTime: formEndTime,
            meetLink: formMeetLink.trim() || undefined,
            notes: formNotes.trim() || undefined,
            color: formColor,
            status: formStatus,
            attendance: initialAttendance,
          },
          formRepeatDays,
          formRepeatWeeks
        );
        onSaveSessions(created);
        setIsModalOpen(false);
      });
    } else {
      const created: CalendarSession = {
        id: `sess-${Date.now()}`,
        classId: formClassId,
        title: formTitle.trim(),
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        meetLink: formMeetLink.trim() || undefined,
        notes: formNotes.trim() || undefined,
        color: formColor,
        status: formStatus,
        attendance: initialAttendance,
      };
      onSaveSessions([created]);
      setIsModalOpen(false);
    }
  };

  // Current time indicator vertical position (relative to 07:00 = 420 mins)
  const currentTimeTopPx = ((nowMinutes - 7 * 60) / 60) * HOUR_HEIGHT;
  const isCurrentTimeVisible = nowMinutes >= 7 * 60 && nowMinutes <= 22 * 60;

  // Keep selectedSessionForAttendance synced with live sessions prop
  const activeAttendanceSession = selectedSessionForAttendance
    ? sessions.find((s) => s.id === selectedSessionForAttendance.id) || null
    : null;

  const renderTimeGrid = (dates: Date[]) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Column Day Headers */}
      <div
        className="grid border-b border-slate-200 bg-slate-50/80"
        style={{
          gridTemplateColumns: `64px repeat(${dates.length}, minmax(110px, 1fr))`,
        }}
      >
        <div className="py-3 px-2 text-center text-[11px] font-medium text-slate-400 border-r border-slate-200">
          GMT+7
        </div>
        {dates.map((d) => {
          const iso = formatDateISO(d);
          const isToday = iso === todayISO;
          const dowLabel = DAY_NAMES_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
          return (
            <div
              key={iso}
              className={`py-2.5 px-2 text-center border-r last:border-r-0 border-slate-200 ${
                isToday ? 'bg-blue-50/60' : ''
              }`}
            >
              <p className="text-[11px] font-medium text-slate-500">{dowLabel}</p>
              <p
                className={`mt-0.5 text-sm font-bold tabular-nums inline-flex items-center justify-center w-7 h-7 rounded-full ${
                  isToday ? 'bg-blue-600 text-white' : 'text-slate-900'
                }`}
              >
                {d.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Scrollable Hour Grid */}
      <div className="overflow-x-auto">
        <div
          className="relative grid min-w-[680px]"
          style={{
            gridTemplateColumns: `64px repeat(${dates.length}, minmax(110px, 1fr))`,
            height: `${HOURS.length * HOUR_HEIGHT}px`,
          }}
        >
          {/* Left Time Axis */}
          <div className="border-r border-slate-200 bg-white select-none">
            {HOURS.map((hr) => (
              <div
                key={hr}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="relative pr-2 text-right"
              >
                <span className="text-[11px] font-mono-num text-slate-400 -top-2 relative">
                  {String(hr).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {dates.map((d) => {
            const iso = formatDateISO(d);
            const isToday = iso === todayISO;
            const daySessions = visibleSessions.filter((s) => s.date === iso);

            return (
              <div
                key={iso}
                className={`relative border-r last:border-r-0 border-slate-200 ${
                  isToday ? 'bg-blue-50/15' : 'bg-white'
                }`}
              >
                {/* Clickable Hour Slots */}
                {HOURS.map((hr) => (
                  <button
                    key={hr}
                    type="button"
                    aria-label={`Tạo lịch dạy ngày ${iso} lúc ${hr}:00`}
                    onClick={() => openQuickCreateModal(iso, hr)}
                    className={`w-full block border-b border-slate-100 text-left transition-colors ${
                      role === 'tutor'
                        ? 'hover:bg-blue-50/40 cursor-pointer'
                        : 'cursor-default'
                    }`}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Current Time Red Line */}
                {isToday && isCurrentTimeVisible && (
                  <div
                    data-testid="current-time-indicator"
                    style={{ top: `${currentTimeTopPx}px` }}
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 -ml-1.5 shrink-0" />
                    <div className="h-[2px] w-full bg-red-600" />
                  </div>
                )}

                {/* Session Event Cards */}
                {daySessions.map((sess) => {
                  const startMins = Math.max(7 * 60, timeToMinutes(sess.startTime));
                  const endMins = Math.min(22 * 60, timeToMinutes(sess.endTime));
                  const topPx = ((startMins - 7 * 60) / 60) * HOUR_HEIGHT + 2;
                  const heightPx = Math.max(
                    44,
                    ((endMins - startMins) / 60) * HOUR_HEIGHT - 4
                  );
                  const style = COLOR_STYLES[sess.color] || COLOR_STYLES.blue;
                  const cls = classMap.get(sess.classId);
                  const presentCount = Object.values(sess.attendance).filter(
                    (a) => a === 'present'
                  ).length;
                  const totalStudents = cls?.studentIds.length || 0;

                  return (
                    <div
                      key={sess.id}
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                      className={`absolute left-1 right-1 z-10 rounded-lg border p-1.5 flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-sm ${
                        style.card
                      } ${sess.status === 'cancelled' ? 'opacity-60 line-through' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(sess);
                        }}
                        className="text-left min-w-0 flex-1 focus:outline-none"
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono-num opacity-80">
                          <span className="truncate">
                            {sess.startTime}–{sess.endTime}
                          </span>
                          <span className="shrink-0">{STATUS_LABELS[sess.status]}</span>
                        </div>
                        <p className="text-xs font-semibold leading-tight truncate mt-0.5">
                          {sess.title}
                        </p>
                      </button>

                      {role === 'tutor' && heightPx >= 56 && (
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-black/5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSessionForAttendance(sess);
                            }}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/80 hover:bg-white text-slate-800 border border-black/10 whitespace-nowrap"
                          >
                            Điểm danh ({presentCount}/{totalStudents})
                          </button>
                          {sess.recurringGroupId && (
                            <Repeat
                              className="w-3 h-3 opacity-60 shrink-0"
                              aria-label="Lịch lặp lại định kỳ"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMonthGrid = () => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DAY_NAMES_SHORT.map((d) => (
          <div
            key={d}
            className="py-2.5 text-center text-xs font-semibold text-slate-600 border-r last:border-r-0 border-slate-200"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthDates.map((d) => {
          const iso = formatDateISO(d);
          const isCurrentMonth = d.getMonth() === anchorDate.getMonth();
          const isToday = iso === todayISO;
          const daySessions = visibleSessions.filter((s) => s.date === iso);

          return (
            <div
              key={iso}
              className={`min-h-[110px] p-2 border-r border-b border-slate-200 flex flex-col gap-1 ${
                isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold tabular-nums w-6 h-6 rounded-full inline-flex items-center justify-center ${
                    isToday ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  {d.getDate()}
                </span>
                {role === 'tutor' && (
                  <button
                    type="button"
                    aria-label={`Thêm lịch ngày ${iso}`}
                    onClick={() => openQuickCreateModal(iso, 18)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[82px]">
                {daySessions.map((sess) => {
                  const style = COLOR_STYLES[sess.color] || COLOR_STYLES.blue;
                  return (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => openEditModal(sess)}
                      className={`w-full text-left px-1.5 py-1 rounded border text-[11px] truncate ${style.card}`}
                    >
                      <span className="font-mono-num font-medium mr-1">
                        {sess.startTime}
                      </span>
                      <span>{sess.title}</span>
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

  return (
    <div className="space-y-5">
      {/* Calendar Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchorDate(new Date())}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Hôm nay
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              aria-label="Khoảng thời gian trước"
              onClick={() => stepAnchor(-1)}
              className="p-1.5 hover:bg-slate-50 text-slate-600 border-r border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Khoảng thời gian sau"
              onClick={() => stepAnchor(1)}
              className="p-1.5 hover:bg-slate-50 text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 ml-1 tabular-nums">
            {headerDateLabel}
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Day / Week / Month Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                ['day', 'Ngày'],
                ['week', 'Tuần'],
                ['month', 'Tháng'],
              ] as [CalendarMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === mode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {role === 'tutor' && (
            <button
              type="button"
              onClick={() => openQuickCreateModal(todayISO, 18)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tạo buổi dạy
            </button>
          )}
        </div>
      </div>

      {/* Hint bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
        <span>
          {role === 'tutor'
            ? 'Nhấp vào bất kỳ ô giờ nào trên lịch để tạo nhanh buổi dạy hoặc nhấn vào thẻ buổi học để sửa màu, trạng thái & điểm danh.'
            : 'Nhấn vào từng buổi học để xem link học trực tuyến và trạng thái điểm danh cá nhân.'}
        </span>
        <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
          <Clock className="w-3.5 h-3.5" />
          Đường kẻ đỏ chỉ thời gian hiện tại
        </span>
      </div>

      {/* Main Calendar Canvas */}
      {viewMode === 'day' && renderTimeGrid([anchorDate])}
      {viewMode === 'week' && renderTimeGrid(weekDates)}
      {viewMode === 'month' && renderMonthGrid()}

      {/* Quick Attendance Popover Modal */}
      {activeAttendanceSession && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Điểm danh buổi dạy"
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-medium text-slate-500 tabular-nums">
                  {activeAttendanceSession.date} · {activeAttendanceSession.startTime}–
                  {activeAttendanceSession.endTime}
                </p>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  {activeAttendanceSession.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {classMap.get(activeAttendanceSession.classId)?.name}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng cửa sổ điểm danh"
                onClick={() => setSelectedSessionForAttendance(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeAttendanceSession.meetLink && (
              <div className="mt-4">
                <a
                  href={activeAttendanceSession.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  <Video className="w-3.5 h-3.5" />
                  {activeAttendanceSession.meetLink}
                </a>
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-700">
                Danh sách điểm danh (Tự động tính học phí khi chọn Có mặt)
              </p>
              {(classMap.get(activeAttendanceSession.classId)?.studentIds || []).map(
                (stuId) => {
                  const st = studentMap.get(stuId);
                  if (!st) return null;
                  const att = activeAttendanceSession.attendance[stuId] || 'pending';

                  return (
                    <div
                      key={stuId}
                      className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {st.name}
                      </span>
                      {role === 'tutor' ? (
                        <div className="flex items-center gap-1">
                          {(
                            [
                              ['present', 'Có mặt'],
                              ['excused', 'Vắng phép'],
                              ['unexcused', 'Vắng KP'],
                            ] as [AttendanceStatus, string][]
                          ).map(([key, label]) => {
                            const active = att === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() =>
                                  onUpdateAttendance(
                                    activeAttendanceSession.id,
                                    stuId,
                                    key
                                  )
                                }
                                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                                  active
                                    ? key === 'present'
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : key === 'excused'
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-700">
                          {att === 'present'
                            ? 'Có mặt'
                            : att === 'excused'
                              ? 'Vắng có phép'
                              : att === 'unexcused'
                                ? 'Vắng không phép'
                                : 'Chưa điểm danh'}
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              {role === 'tutor' && (
                <button
                  type="button"
                  onClick={() => {
                    const target = activeAttendanceSession;
                    setSelectedSessionForAttendance(null);
                    openEditModal(target);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Chỉnh sửa lịch
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedSessionForAttendance(null)}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingSession ? 'Chỉnh sửa buổi dạy' : 'Tạo buổi dạy mới'}
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                {editingSession ? 'Cập nhật lịch dạy' : 'Tạo lịch dạy nhanh'}
              </h3>
              <button
                type="button"
                aria-label="Đóng biểu mẫu lịch dạy"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              {formError && (
                <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="cal-class"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Lớp học
                  </label>
                  <select
                    id="cal-class"
                    value={formClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cal-status"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Trạng thái buổi học
                  </label>
                  <select
                    id="cal-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as SessionStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Sắp tới</option>
                    <option value="completed">Đã dạy</option>
                    <option value="makeup">Dạy bù</option>
                    <option value="cancelled">Hủy buổi</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="cal-title"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Tiêu đề buổi học
                </label>
                <input
                  id="cal-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập Hệ thức Vi-ét & Chữa đề số 05"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="cal-date"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Ngày học
                  </label>
                  <input
                    id="cal-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cal-start"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Bắt đầu
                  </label>
                  <input
                    id="cal-start"
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cal-end"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Kết thúc
                  </label>
                  <input
                    id="cal-end"
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cal-meet"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Link học online (Google Meet / Zoom)
                </label>
                <input
                  id="cal-meet"
                  type="url"
                  value={formMeetLink}
                  onChange={(e) => setFormMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label
                  htmlFor="cal-notes"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Ghi chú nội dung giảng dạy
                </label>
                <textarea
                  id="cal-notes"
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Nội dung trọng tâm, bài tập cần chuẩn bị..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              {/* Color Swatches */}
              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1.5">
                  Màu thẻ lịch dạy
                </span>
                <div className="flex items-center gap-2.5">
                  {(Object.keys(COLOR_STYLES) as SessionColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Chọn màu ${COLOR_STYLES[c].label}`}
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full ${COLOR_STYLES[c].swatch} transition-transform ${
                        formColor === c
                          ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Recurring Option (Create mode) */}
              {!editingSession && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formRepeatEnabled}
                      onChange={(e) => setFormRepeatEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <Repeat className="w-3.5 h-3.5 text-blue-600" />
                    Lặp lại lịch định kỳ hàng tuần
                  </label>

                  {formRepeatEnabled && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {DOW_OPTIONS.map((item) => {
                          const active = formRepeatDays.includes(item.dow);
                          return (
                            <button
                              key={item.dow}
                              type="button"
                              onClick={() =>
                                setFormRepeatDays((prev) =>
                                  prev.includes(item.dow)
                                    ? prev.filter((x) => x !== item.dow)
                                    : [...prev, item.dow]
                                )
                              }
                              className={`px-2.5 py-1 rounded text-xs font-medium border ${
                                active
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <label htmlFor="repeat-weeks">Số tuần lặp:</label>
                        <select
                          id="repeat-weeks"
                          value={formRepeatWeeks}
                          onChange={(e) => setFormRepeatWeeks(Number(e.target.value))}
                          className="px-2 py-1 border border-slate-200 rounded bg-white tabular-nums"
                        >
                          <option value={2}>2 tuần</option>
                          <option value={4}>4 tuần (1 tháng)</option>
                          <option value={8}>8 tuần (2 tháng)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingSession ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteSession(editingSession.id);
                        setIsModalOpen(false);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa buổi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedSessionForAttendance(editingSession);
                      }}
                      className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
                    >
                      Điểm danh
                    </button>
                  </div>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    {editingSession ? 'Lưu thay đổi' : 'Lưu lịch dạy'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
