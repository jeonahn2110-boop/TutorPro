import type { StudentTuitionBreakdown } from '../types';
import { formatVND } from '../utils/tutorLogic';

export function downloadTuitionSlipPng(
  item: StudentTuitionBreakdown,
  yearMonth: string,
  tutorName: string
): void {
  const width = 820;
  const height = 560;
  const dpr = 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Top Header Band
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, width, 108);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PHIẾU BÁO HỌC PHÍ HÀNG THÁNG', 44, 48);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`TutorPro AI · ${tutorName} · Kỳ thanh toán ${yearMonth}`, 44, 78);

  // Status badge text on right
  ctx.textAlign = 'right';
  ctx.fillStyle = item.paid ? '#4ADE80' : '#FBBF24';
  ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(item.paid ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN', width - 44, 58);
  ctx.textAlign = 'left';

  // Student Info Block
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(44, 134, width - 88, 104);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 134, width - 88, 104);

  ctx.fillStyle = '#64748B';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('HỌC SINH', 64, 162);
  ctx.fillText('LỚP HỌC', 340, 162);
  ctx.fillText('PHỤ HUYNH', 64, 206);
  ctx.fillText('LIÊN HỆ', 340, 206);

  ctx.fillStyle = '#0F172A';
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(item.studentName, 64, 184);
  ctx.fillText(item.className, 340, 184);

  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(item.parentName, 64, 226);
  ctx.fillText(item.parentPhone, 340, 226);

  // Calculation Rows
  const rows: [string, string][] = [
    ['Đơn giá học phí / buổi', formatVND(item.ratePerSession)],
    ['Số buổi điểm danh Có mặt', `${item.presentCount} buổi`],
    ['Số buổi Vắng có phép / Vắng không phép', `${item.excusedCount} phép · ${item.unexcusedCount} không phép`],
  ];

  let y = 282;
  rows.forEach(([label, value]) => {
    ctx.fillStyle = '#475569';
    ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, 48, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillText(value, width - 48, y);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.moveTo(48, y + 16);
    ctx.lineTo(width - 48, y + 16);
    ctx.stroke();
    y += 44;
  });

  // Total Box
  ctx.fillStyle = '#EFF6FF';
  ctx.fillRect(44, 412, width - 88, 76);
  ctx.strokeStyle = '#BFDBFE';
  ctx.strokeRect(44, 412, width - 88, 76);

  ctx.fillStyle = '#1E3A8A';
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TỔNG HỌC PHÍ CẦN THANH TOÁN', 64, 456);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1D4ED8';
  ctx.font = '700 26px "JetBrains Mono", monospace';
  ctx.fillText(formatVND(item.totalAmount), width - 64, 459);
  ctx.textAlign = 'left';

  // Footer note
  ctx.fillStyle = '#64748B';
  ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'Phiếu báo được tổng hợp tự động theo lịch điểm danh thực tế trên hệ thống TutorPro AI.',
    44,
    524
  );

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `Phieu_Hoc_Phi_${item.studentName.replace(/\s+/g, '_')}_${yearMonth}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
