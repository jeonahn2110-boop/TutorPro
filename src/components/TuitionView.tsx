import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileImage,
  Printer,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import type {
  Classroom,
  MonthlyTuitionSummary,
  StudentRecord,
  StudentTuitionBreakdown,
  UserRole,
} from '../types';
import { formatVND } from '../utils/tutorLogic';
import { downloadTuitionSlipPng } from '../services/tuitionSlipCanvas';

interface TuitionViewProps {
  role: UserRole;
  currentStudentId: string;
  tutorName: string;
  yearMonth: string;
  onChangeYearMonth: (ym: string) => void;
  classes: Classroom[];
  students: StudentRecord[];
  summary: MonthlyTuitionSummary;
  onTogglePayment: (studentId: string, classId: string) => void;
  onUpdateClassRate: (classId: string, newRate: number) => void;
  onUpdateStudentRate: (
    studentId: string,
    classId: string,
    newRate: number | null
  ) => void;
}

export const TuitionView: React.FC<TuitionViewProps> = ({
  role,
  currentStudentId,
  tutorName,
  yearMonth,
  onChangeYearMonth,
  classes,
  students,
  summary,
  onTogglePayment,
  onUpdateClassRate,
  onUpdateStudentRate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [slipPreview, setSlipPreview] = useState<StudentTuitionBreakdown | null>(
    null
  );
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const visibleBreakdowns = useMemo(() => {
    return summary.breakdowns.filter((row) => {
      if (role === 'student' && row.studentId !== currentStudentId) return false;
      if (classFilter !== 'all' && row.classId !== classFilter) return false;
      if (statusFilter === 'paid' && !row.paid) return false;
      if (statusFilter === 'unpaid' && row.paid) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.studentName.toLowerCase().includes(q) ||
          row.className.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    summary.breakdowns,
    role,
    currentStudentId,
    classFilter,
    statusFilter,
    searchQuery,
  ]);

  // Class-level revenue breakdown for visual bar chart
  const classRevenues = useMemo(() => {
    return classes.map((cls) => {
      const rows = summary.breakdowns.filter((b) => b.classId === cls.id);
      const earned = rows.reduce((s, r) => s + r.totalAmount, 0);
      const collected = rows
        .filter((r) => r.paid)
        .reduce((s, r) => s + r.totalAmount, 0);
      return {
        id: cls.id,
        name: cls.name,
        earned,
        collected,
        unpaid: Math.max(0, earned - collected),
      };
    });
  }, [classes, summary.breakdowns]);

  const collectedPercent =
    summary.totalActualEarned > 0
      ? Math.round((summary.totalCollected / summary.totalActualEarned) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 no-print">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Quản lý học phí &amp; Điểm danh tự động
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng tiền tự động nhân theo số buổi có trạng thái &ldquo;Có mặt&rdquo; trên lịch dạy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="tuition-month"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              Kỳ tháng:
            </label>
            <input
              id="tuition-month"
              type="month"
              value={yearMonth}
              onChange={(e) => onChangeYearMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono-num border border-slate-200 rounded-lg bg-white"
            />
          </div>

          {role === 'tutor' && (
            <button
              type="button"
              onClick={() => setIsRateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Thiết lập đơn giá
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      {role === 'tutor' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Dự kiến cả tháng</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums font-mono-num">
              {formatVND(summary.totalExpected)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Theo toàn bộ lịch dự kiến trong tháng
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Thực tế đã dạy (Có mặt)
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600 tabular-nums font-mono-num">
              {formatVND(summary.totalActualEarned)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {summary.totalPresentSessions} lượt điểm danh Có mặt
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Số tiền đã thu</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums font-mono-num">
              {formatVND(summary.totalCollected)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              Đạt {collectedPercent}% thực tế
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Chưa thanh toán</p>
            <p className="mt-2 text-2xl font-bold text-amber-700 tabular-nums font-mono-num">
              {formatVND(summary.totalUnpaid)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {summary.breakdowns.filter((b) => !b.paid && b.totalAmount > 0).length}{' '}
              học sinh chưa đóng
            </p>
          </div>
        </section>
      )}

      {/* Visual Revenue Bar Breakdown by Class */}
      {role === 'tutor' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 no-print">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Thống kê doanh thu theo từng lớp ({yearMonth})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                So sánh số tiền đã thu và số tiền còn chờ thanh toán
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                Đã thu
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                Chưa thanh toán
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {classRevenues.map((item) => {
              const maxVal = Math.max(
                1,
                ...classRevenues.map((r) => r.earned)
              );
              const collectedPct = (item.collected / maxVal) * 100;
              const unpaidPct = (item.unpaid / maxVal) * 100;

              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <span className="font-mono-num text-slate-600 tabular-nums">
                      Đã thu {formatVND(item.collected)} / {formatVND(item.earned)}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${collectedPct}%` }}
                      className="bg-emerald-600 h-full transition-all duration-300"
                    />
                    <div
                      style={{ width: `${unpaidPct}%` }}
                      className="bg-amber-400 h-full transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tuition & Attendance Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh, lớp..."
              aria-label="Tìm kiếm học sinh trong bảng học phí"
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Lọc theo lớp học"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">Tất cả lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  ['all', 'Tất cả'],
                  ['unpaid', 'Chưa đóng'],
                  ['paid', 'Đã đóng'],
                ] as ['all' | 'paid' | 'unpaid', string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                    statusFilter === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                <th className="py-3 px-3">Học sinh · Phụ huynh</th>
                <th className="py-3 px-3">Lớp học</th>
                <th className="py-3 px-3 text-right">Đơn giá</th>
                <th className="py-3 px-3 text-right">Có mặt</th>
                <th className="py-3 px-3 text-right">Vắng</th>
                <th className="py-3 px-3 text-right">Thành tiền</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {visibleBreakdowns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Không tìm thấy bản ghi học phí phù hợp.
                  </td>
                </tr>
              ) : (
                visibleBreakdowns.map((row) => (
                  <tr
                    key={`${row.studentId}-${row.classId}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-slate-900 whitespace-nowrap">{row.studentName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
                        {row.parentName} · {row.parentPhone}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">{row.className}</td>
                    <td className="py-3.5 px-3 text-right font-mono-num tabular-nums text-slate-700 whitespace-nowrap">
                      {formatVND(row.ratePerSession)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num tabular-nums font-semibold text-emerald-700 whitespace-nowrap">
                      {row.presentCount} buổi
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num tabular-nums text-slate-500 whitespace-nowrap">
                      {row.excusedCount} / {row.unexcusedCount}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num tabular-nums font-bold text-slate-900 whitespace-nowrap">
                      {formatVND(row.totalAmount)}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          row.paid ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        {row.paid ? 'Đã đóng học phí' : 'Chưa thanh toán'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {role === 'tutor' && (
                          <button
                            type="button"
                            onClick={() =>
                              onTogglePayment(row.studentId, row.classId)
                            }
                            className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                              row.paid
                                ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {row.paid ? 'Hoàn tác' : 'Đánh dấu đã thu'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSlipPreview(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium whitespace-nowrap shrink-0"
                        >
                          <FileImage className="w-3.5 h-3.5 text-blue-600" />
                          Phiếu báo
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rate Configuration Modal */}
      {isRateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Thiết lập đơn giá học phí"
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Thiết lập đơn giá học phí theo lớp &amp; từng học sinh
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đơn giá riêng cho học sinh sẽ ưu tiên thay thế đơn giá mặc định của lớp
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng thiết lập đơn giá"
                onClick={() => setIsRateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-5 max-h-[65vh] overflow-y-auto pr-1">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="border border-slate-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {cls.name}
                      </p>
                      <p className="text-xs text-slate-500">{cls.scheduleSummary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`rate-cls-${cls.id}`}
                        className="text-xs text-slate-600"
                      >
                        Đơn giá lớp (đ/buổi):
                      </label>
                      <input
                        id={`rate-cls-${cls.id}`}
                        type="number"
                        step={10000}
                        min={0}
                        value={cls.tuitionPerSession}
                        onChange={(e) =>
                          onUpdateClassRate(cls.id, Number(e.target.value) || 0)
                        }
                        className="w-32 px-2.5 py-1.5 text-xs font-mono-num border border-slate-200 rounded-lg text-right"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Tùy chỉnh riêng theo học sinh (để trống nếu dùng giá lớp)
                    </p>
                    {cls.studentIds.map((stuId) => {
                      const stu = students.find((s) => s.id === stuId);
                      if (!stu) return null;
                      const customVal = stu.customTuitionOverride?.[cls.id];
                      return (
                        <div
                          key={stuId}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-800 font-medium">
                            {stu.name}
                          </span>
                          <input
                            type="number"
                            step={10000}
                            min={0}
                            placeholder={String(cls.tuitionPerSession)}
                            value={customVal ?? ''}
                            aria-label={`Đơn giá riêng cho ${stu.name}`}
                            onChange={(e) => {
                              const raw = e.target.value;
                              onUpdateStudentRate(
                                stuId,
                                cls.id,
                                raw === '' ? null : Number(raw)
                              );
                            }}
                            className="w-32 px-2.5 py-1 font-mono-num border border-slate-200 rounded text-right"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsRateModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tuition Slip Preview Modal (PNG & PDF Print) */}
      {slipPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Phiếu báo học phí"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="bg-slate-900 text-white px-6 py-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold tracking-tight">
                  PHIẾU BÁO HỌC PHÍ HÀNG THÁNG
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  TutorPro AI · {tutorName} · Kỳ {yearMonth}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng phiếu báo"
                onClick={() => setSlipPreview(null)}
                className="p-1 text-slate-400 hover:text-white no-print"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
                <div>
                  <p className="text-slate-500">Học sinh</p>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">
                    {slipPreview.studentName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Lớp theo học</p>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">
                    {slipPreview.className}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Phụ huynh</p>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {slipPreview.parentName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Số điện thoại</p>
                  <p className="font-mono-num text-slate-800 mt-0.5">
                    {slipPreview.parentPhone}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Đơn giá mỗi buổi</span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    {formatVND(slipPreview.ratePerSession)}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Số buổi điểm danh Có mặt</span>
                  <span className="font-mono-num font-semibold text-emerald-700">
                    {slipPreview.presentCount} buổi
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Vắng có phép / Không phép</span>
                  <span className="font-mono-num text-slate-700">
                    {slipPreview.excusedCount} phép · {slipPreview.unexcusedCount} KP
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-900">
                    TỔNG HỌC PHÍ KỲ {yearMonth}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Trạng thái:{' '}
                    {slipPreview.paid ? 'Đã thanh toán' : 'Chờ phụ huynh thanh toán'}
                  </p>
                </div>
                <span className="text-xl font-bold font-mono-num text-blue-700 tabular-nums">
                  {formatVND(slipPreview.totalAmount)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In / Xuất PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadTuitionSlipPng(slipPreview, yearMonth, tutorName)
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải ảnh phiếu báo (PNG)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
