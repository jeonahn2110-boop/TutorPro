import React, { useMemo, useState } from 'react';
import { Check, Copy, Plus, TrendingUp } from 'lucide-react';
import type {
  Classroom,
  ProgressTestScore,
  StudentRecord,
  UserRole,
} from '../types';
import { AvatarBadge } from './AvatarBadge';

interface ProgressReportViewProps {
  role: UserRole;
  currentStudentId: string;
  students: StudentRecord[];
  classes: Classroom[];
  scores: ProgressTestScore[];
  onAddScore: (score: ProgressTestScore) => void;
  onUpdateComment: (studentId: string, comment: string) => void;
}

export const ProgressReportView: React.FC<ProgressReportViewProps> = ({
  role,
  currentStudentId,
  students,
  classes,
  scores,
  onAddScore,
  onUpdateComment,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(
    role === 'student' ? currentStudentId : students[0]?.id || ''
  );
  const [copiedReport, setCopiedReport] = useState(false);

  // Add new test score state
  const [newTestName, setNewTestName] = useState('');
  const [newTestScore, setNewTestScore] = useState('8.5');
  const [newTestDate, setNewTestDate] = useState('2026-11-13');

  const activeStudentId =
    role === 'student' ? currentStudentId : selectedStudentId;
  const student =
    students.find((s) => s.id === activeStudentId) || students[0];

  const studentScores = useMemo(
    () =>
      scores
        .filter((s) => s.studentId === student?.id)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [scores, student]
  );

  const avgScore = useMemo(() => {
    if (!studentScores.length) return 0;
    const sum = studentScores.reduce((acc, s) => acc + s.score, 0);
    return sum / studentScores.length;
  }, [studentScores]);

  const deltaScore = useMemo(() => {
    if (studentScores.length < 2) return 0;
    return (
      studentScores[studentScores.length - 1].score - studentScores[0].score
    );
  }, [studentScores]);

  // SVG Chart geometry
  const chartWidth = 680;
  const chartHeight = 240;
  const padX = 44;
  const padY = 24;
  const innerW = chartWidth - padX * 2;
  const innerH = chartHeight - padY * 2;

  const points = useMemo(() => {
    return studentScores.map((item, idx) => {
      const x =
        studentScores.length === 1
          ? padX + innerW / 2
          : padX + (idx / (studentScores.length - 1)) * innerW;
      const clamped = Math.max(0, Math.min(10, item.score));
      const y = padY + innerH - (clamped / 10) * innerH;
      return { ...item, x, y };
    });
  }, [studentScores, innerW, innerH]);

  const linePath = useMemo(() => {
    if (!points.length) return '';
    return points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (!points.length) return '';
    const bottomY = padY + innerH;
    return `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [linePath, points, innerH]);

  const handleCopyParentReport = () => {
    if (!student) return;
    const lines = [
      `BÁO CÁO TIẾN ĐỘ HỌC TẬP — ${student.name.toUpperCase()}`,
      `Phụ huynh: ${student.parentName}`,
      `Điểm trung bình: ${avgScore.toFixed(1)}/10 (${deltaScore >= 0 ? '+' : ''}${deltaScore.toFixed(1)} so với đầu kỳ)`,
      '',
      'Lịch sử kiểm tra:',
      ...studentScores.map(
        (s) => `- ${s.date}: ${s.testName} -> ${s.score.toFixed(1)}/10`
      ),
      '',
      `Nhận xét của gia sư: ${student.tutorSummaryComment || 'Tiến bộ đều đặn.'}`,
    ];
    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {});
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleAddScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !newTestName.trim()) return;
    const studentClass =
      classes.find((c) => c.studentIds.includes(student.id)) || classes[0];
    onAddScore({
      id: `sc-${Date.now()}`,
      studentId: student.id,
      classId: studentClass.id,
      testName: newTestName.trim(),
      date: newTestDate,
      score: Math.max(0, Math.min(10, Number(newTestScore) || 0)),
      maxScore: 10,
    });
    setNewTestName('');
  };

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Header & Student Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <AvatarBadge
            name={student.name}
            src={student.avatarUrl}
            sizeClass="w-11 h-11 text-sm"
          />
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Báo cáo tiến độ học tập · {student.name}
            </h2>
            <p className="text-xs text-slate-500">
              {student.school} · {student.grade} · Phụ huynh: {student.parentName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {role === 'tutor' && (
            <select
              aria-label="Chọn học sinh xem tiến độ"
              value={student.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.grade})
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={handleCopyParentReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap shrink-0"
          >
            {copiedReport ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Đã sao chép gửi phụ huynh
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Sao chép báo cáo phụ huynh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics + SVG Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Biểu đồ điểm số các bài kiểm tra theo thời gian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thang điểm 10 · Cập nhật tự động từ bài kiểm tra và bài tập đã chấm
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs tabular-nums">
              <span>
                Trung bình:{' '}
                <strong className="text-slate-900 font-mono-num">
                  {avgScore.toFixed(1)}/10
                </strong>
              </span>
              <span
                className={`inline-flex items-center gap-1 font-semibold font-mono-num ${
                  deltaScore >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {deltaScore >= 0 ? '+' : ''}
                {deltaScore.toFixed(1)} điểm
              </span>
            </div>
          </div>

          <div className="mt-4">
            {points.length === 0 ? (
              <p className="py-16 text-center text-xs text-slate-500">
                Chưa có dữ liệu điểm kiểm tra cho học sinh này.
              </p>
            ) : (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto"
                role="img"
                aria-label={`Biểu đồ điểm số của ${student.name}`}
              >
                <defs>
                  <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Horizontal Y Grid Lines (0, 2, 4, 6, 8, 10) */}
                {[0, 2, 4, 6, 8, 10].map((tick) => {
                  const y = padY + innerH - (tick / 10) * innerH;
                  return (
                    <g key={tick}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={chartWidth - padX}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padX - 10}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fill="#64748B"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {/* Area & Line */}
                <path d={areaPath} fill="url(#scoreAreaGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points & Score Labels */}
                {points.map((pt) => (
                  <g key={pt.id}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 11}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#0F172A"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {pt.score.toFixed(1)}
                    </text>
                    <text
                      x={pt.x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748B"
                    >
                      {pt.date.slice(5)}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </section>

        {/* Right: Periodic Feedback & Add Score */}
        <section className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Nhận xét định kỳ gửi phụ huynh
            </h3>
            {role === 'tutor' ? (
              <textarea
                rows={4}
                value={student.tutorSummaryComment || ''}
                onChange={(e) => onUpdateComment(student.id, e.target.value)}
                placeholder="Nhập nhận xét chi tiết về ưu điểm và phần cần cải thiện..."
                className="w-full px-3 py-2 text-xs leading-relaxed border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {student.tutorSummaryComment || 'Chưa có nhận xét định kỳ.'}
              </p>
            )}
          </div>

          {role === 'tutor' && (
            <form
              onSubmit={handleAddScoreSubmit}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                Ghi nhận điểm kiểm tra mới
              </h3>
              <input
                type="text"
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
                placeholder="Tên bài kiểm tra (VD: Đề thi thử số 05)"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={10}
                  aria-label="Điểm số"
                  value={newTestScore}
                  onChange={(e) => setNewTestScore(e.target.value)}
                  className="px-3 py-2 text-xs font-mono-num border border-slate-200 rounded-lg"
                />
                <input
                  type="date"
                  aria-label="Ngày kiểm tra"
                  value={newTestDate}
                  onChange={(e) => setNewTestDate(e.target.value)}
                  className="px-2.5 py-2 text-xs font-mono-num border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm vào biểu đồ tiến độ
              </button>
            </form>
          )}
        </section>
      </div>

      {/* Detailed Scores History Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            Lịch sử bài kiểm tra chi tiết
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Bài kiểm tra</th>
                <th className="py-3 px-4">Ghi chú chuyên môn</th>
                <th className="py-3 px-4 text-right">Điểm số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentScores.map((sc) => (
                <tr key={sc.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono-num text-slate-500">
                    {sc.date}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {sc.testName}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{sc.note || '—'}</td>
                  <td className="py-3 px-4 text-right font-mono-num font-bold text-blue-700 tabular-nums">
                    {sc.score.toFixed(1)} / {sc.maxScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
