import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExamAnswerKey,
  calculateMonthlyTuitionSummary,
  expandRecurringSessions,
  formatVND,
  getWeekDates,
} from './tutorLogic';
import type {
  CalendarSession,
  Classroom,
  ExamQuestion,
  StudentRecord,
  TuitionPayment,
} from '../types';

test('formatVND formats Vietnamese Dong cleanly', () => {
  const formatted = formatVND(200000);
  assert.ok(formatted.includes('200') && formatted.endsWith('đ'));
});

test('calculateMonthlyTuitionSummary calculates tuition strictly from present attendance and overrides', () => {
  const classes: Classroom[] = [
    {
      id: 'c1',
      name: 'Toán 9A',
      subject: 'Toán',
      grade: 'Lớp 9',
      classCode: 'TOAN9A',
      tuitionPerSession: 200000,
      color: 'blue',
      scheduleSummary: 'T2 - T4',
      studentIds: ['s1', 's2'],
    },
  ];

  const students: StudentRecord[] = [
    {
      id: 's1',
      name: 'Nguyễn Khánh An',
      email: 'an@gmail.com',
      parentName: 'Chị Hương',
      parentPhone: '0901234567',
      grade: 'Lớp 9',
      school: 'THCS Lê Quý Đôn',
    },
    {
      id: 's2',
      name: 'Trần Bảo Linh',
      email: 'linh@gmail.com',
      parentName: 'Anh Tuấn',
      parentPhone: '0907654321',
      grade: 'Lớp 9',
      school: 'THCS Nguyễn Du',
      customTuitionOverride: { c1: 180000 },
    },
  ];

  const sessions: CalendarSession[] = [
    {
      id: 'sess-1',
      classId: 'c1',
      title: 'Buổi 1',
      date: '2026-11-02',
      startTime: '18:00',
      endTime: '19:30',
      color: 'blue',
      status: 'completed',
      attendance: { s1: 'present', s2: 'present' },
    },
    {
      id: 'sess-2',
      classId: 'c1',
      title: 'Buổi 2',
      date: '2026-11-04',
      startTime: '18:00',
      endTime: '19:30',
      color: 'blue',
      status: 'completed',
      attendance: { s1: 'present', s2: 'excused' },
    },
    {
      id: 'sess-3',
      classId: 'c1',
      title: 'Buổi hủy',
      date: '2026-11-09',
      startTime: '18:00',
      endTime: '19:30',
      color: 'rose',
      status: 'cancelled',
      attendance: { s1: 'present', s2: 'present' },
    },
  ];

  const payments: TuitionPayment[] = [
    {
      id: 'pay-1',
      studentId: 's1',
      classId: 'c1',
      yearMonth: '2026-11',
      paid: true,
      paidAt: '2026-11-10',
    },
  ];

  const summary = calculateMonthlyTuitionSummary(
    sessions,
    classes,
    students,
    payments,
    '2026-11'
  );

  // s1: 2 present * 200,000 = 400,000 (paid)
  // s2: 1 present * 180,000 = 180,000 (unpaid)
  // cancelled session ignored
  assert.equal(summary.totalActualEarned, 580000);
  assert.equal(summary.totalCollected, 400000);
  assert.equal(summary.totalUnpaid, 180000);
  assert.equal(summary.totalPresentSessions, 3);
  assert.equal(summary.breakdowns.length, 2);
});

test('expandRecurringSessions generates multi-week recurring events', () => {
  const generated = expandRecurringSessions(
    {
      classId: 'c1',
      title: 'Lớp Toán 9A',
      date: '2026-11-09', // Monday
      startTime: '18:00',
      endTime: '19:30',
      color: 'blue',
      status: 'upcoming',
      attendance: {},
    },
    [1, 3], // Monday and Wednesday
    2
  );

  assert.equal(generated.length, 4);
  assert.equal(generated[0].date, '2026-11-09');
  assert.equal(generated[1].date, '2026-11-11');
  assert.equal(generated[2].date, '2026-11-16');
  assert.equal(generated[3].date, '2026-11-18');
  assert.ok(generated[0].recurringGroupId);
});

test('getWeekDates always returns 7 days starting Monday', () => {
  const week = getWeekDates(new Date(2026, 10, 13)); // Nov 13, 2026 (Friday)
  assert.equal(week.length, 7);
  assert.equal(week[0].getDay(), 1); // Monday
  assert.equal(week[6].getDay(), 0); // Sunday
});

test('buildExamAnswerKey aggregates total points and answer summaries', () => {
  const questions: ExamQuestion[] = [
    {
      id: 'q1',
      type: 'multiple_choice',
      cognitiveLevel: 'Nhận biết',
      prompt: 'Tính $\\sqrt{16}$',
      options: ['2', '4', '8', '16'],
      correctOptionIndex: 1,
      rubricSteps: [{ step: 'Chọn đúng đáp án B', points: 0.5 }],
      totalPoints: 0.5,
    },
    {
      id: 'q2',
      type: 'essay',
      cognitiveLevel: 'Vận dụng',
      prompt: 'Giải phương trình $x^2 - 5x + 6 = 0$',
      shortAnswer: '$S = \\{2; 3\\}$',
      rubricSteps: [
        { step: 'Tính đúng biệt thức $\\Delta = 1$', points: 0.5 },
        { step: 'Tìm đúng 2 nghiệm $x_1 = 2, x_2 = 3$', points: 1.0 },
      ],
      totalPoints: 1.5,
    },
  ];

  const key = buildExamAnswerKey(questions);
  assert.equal(key.totalPoints, 2.0);
  assert.equal(key.entries.length, 2);
  assert.equal(key.entries[0].answerSummary, 'Chọn B');
  assert.equal(key.entries[1].rubricSteps.length, 2);
});
