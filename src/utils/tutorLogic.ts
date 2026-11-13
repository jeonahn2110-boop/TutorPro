import type {
  CalendarSession,
  Classroom,
  ExamQuestion,
  MonthlyTuitionSummary,
  StudentRecord,
  StudentTuitionBreakdown,
  TuitionPayment,
} from '../types';

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day; // Monday first
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeekDates(anchorDate: Date): Date[] {
  const monday = getStartOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function getMonthGridDates(anchorDate: Date): Date[] {
  const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const startGrid = getStartOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startGrid);
    d.setDate(startGrid.getDate() + i);
    return d;
  });
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getEffectiveSessionRate(
  student: StudentRecord,
  classroom: Classroom
): number {
  const override = student.customTuitionOverride?.[classroom.id];
  return typeof override === 'number' && override >= 0
    ? override
    : classroom.tuitionPerSession;
}

export function calculateMonthlyTuitionSummary(
  sessions: CalendarSession[],
  classes: Classroom[],
  students: StudentRecord[],
  payments: TuitionPayment[],
  yearMonth: string
): MonthlyTuitionSummary {
  const monthSessions = sessions.filter(
    (s) => s.date.startsWith(yearMonth) && s.status !== 'cancelled'
  );

  const classMap = new Map(classes.map((c) => [c.id, c]));
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const paymentMap = new Map(
    payments
      .filter((p) => p.yearMonth === yearMonth)
      .map((p) => [`${p.studentId}::${p.classId}`, p])
  );

  const breakdowns: StudentTuitionBreakdown[] = [];

  for (const cls of classes) {
    for (const studentId of cls.studentIds) {
      const student = studentMap.get(studentId);
      if (!student) continue;

      const rate = getEffectiveSessionRate(student, cls);
      const clsSessions = monthSessions.filter((s) => s.classId === cls.id);

      let presentCount = 0;
      let excusedCount = 0;
      let unexcusedCount = 0;

      for (const sess of clsSessions) {
        const att = sess.attendance[studentId];
        if (att === 'present') presentCount++;
        else if (att === 'excused') excusedCount++;
        else if (att === 'unexcused') unexcusedCount++;
      }

      const scheduledCount = clsSessions.length;
      const totalAmount = presentCount * rate;
      const payment = paymentMap.get(`${studentId}::${cls.id}`);
      const paid = Boolean(payment?.paid);

      breakdowns.push({
        studentId,
        studentName: student.name,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        classId: cls.id,
        className: cls.name,
        ratePerSession: rate,
        presentCount,
        excusedCount,
        unexcusedCount,
        scheduledCount,
        totalAmount,
        paid,
        paidAt: payment?.paidAt,
      });
    }
  }

  let totalExpected = 0;
  let totalActualEarned = 0;
  let totalCollected = 0;
  let totalPresentSessions = 0;

  for (const row of breakdowns) {
    const cls = classMap.get(row.classId);
    if (!cls) continue;
    // Expected for month counts scheduled non-cancelled sessions excluding explicitly excused/unexcused
    const billableProjected = Math.max(
      row.presentCount,
      row.scheduledCount - row.excusedCount - row.unexcusedCount
    );
    totalExpected += billableProjected * row.ratePerSession;
    totalActualEarned += row.totalAmount;
    totalPresentSessions += row.presentCount;
    if (row.paid) {
      totalCollected += row.totalAmount;
    }
  }

  const totalUnpaid = Math.max(0, totalActualEarned - totalCollected);

  return {
    yearMonth,
    totalExpected,
    totalActualEarned,
    totalCollected,
    totalUnpaid,
    totalPresentSessions,
    breakdowns,
  };
}

export function expandRecurringSessions(
  baseSession: Omit<CalendarSession, 'id'>,
  daysOfWeek: number[],
  weeksCount: number
): CalendarSession[] {
  if (!daysOfWeek.length || weeksCount <= 1) {
    return [
      {
        ...baseSession,
        id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      },
    ];
  }

  const groupId = `rec-${Date.now()}`;
  const baseDate = parseISODate(baseSession.date);
  const startMonday = getStartOfWeek(baseDate);
  const result: CalendarSession[] = [];
  const sortedDays = [...new Set(daysOfWeek)].sort((a, b) => {
    const normA = a === 0 ? 7 : a;
    const normB = b === 0 ? 7 : b;
    return normA - normB;
  });

  for (let w = 0; w < weeksCount; w++) {
    for (const dow of sortedDays) {
      const offsetFromMonday = dow === 0 ? 6 : dow - 1;
      const target = new Date(startMonday);
      target.setDate(startMonday.getDate() + w * 7 + offsetFromMonday);
      if (target < baseDate) continue;

      const iso = formatDateISO(target);
      result.push({
        ...baseSession,
        id: `sess-${iso}-${dow}-${Math.random().toString(36).slice(2, 6)}`,
        date: iso,
        recurringGroupId: groupId,
        recurringDays: sortedDays,
      });
    }
  }

  return result.length > 0
    ? result
    : [
        {
          ...baseSession,
          id: `sess-${Date.now()}`,
        },
      ];
}

export interface AnswerKeyEntry {
  questionNumber: number;
  typeLabel: string;
  answerSummary: string;
  points: number;
  rubricSteps: { step: string; points: number }[];
}

export function buildExamAnswerKey(questions: ExamQuestion[]): {
  totalPoints: number;
  entries: AnswerKeyEntry[];
} {
  const letters = ['A', 'B', 'C', 'D'];
  let totalPoints = 0;

  const entries: AnswerKeyEntry[] = questions.map((q, idx) => {
    totalPoints += q.totalPoints;
    let answerSummary = '';
    let typeLabel = '';

    if (q.type === 'multiple_choice') {
      typeLabel = 'Trắc nghiệm';
      const idxOpt = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;
      answerSummary = `Chọn ${letters[idxOpt] || 'A'}`;
    } else if (q.type === 'true_false') {
      typeLabel = 'Đúng / Sai';
      answerSummary = (q.statements || [])
        .map((st) => `${st.label}) ${st.isTrue ? 'Đúng' : 'Sai'}`)
        .join(' · ');
    } else if (q.type === 'short_answer') {
      typeLabel = 'Trả lời ngắn';
      answerSummary = q.shortAnswer || 'Xem hướng dẫn chấm';
    } else {
      typeLabel = 'Tự luận';
      answerSummary = q.shortAnswer || 'Chấm theo các ý trong barem';
    }

    return {
      questionNumber: idx + 1,
      typeLabel,
      answerSummary,
      points: q.totalPoints,
      rubricSteps: q.rubricSteps || [],
    };
  });

  return {
    totalPoints: Math.round(totalPoints * 100) / 100,
    entries,
  };
}
