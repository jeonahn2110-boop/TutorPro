import React from 'react';
import { Database, Key, ShieldCheck, X } from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebaseConfig';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiReady: boolean | null;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  geminiReady,
}) => {
  if (!isOpen) return null;
  const firebaseReady = isFirebaseConfigured();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn cấu hình Gemini và Firebase"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Kiến trúc triển khai &amp; Cấu hình Gemini / Firebase
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hướng dẫn nơi điền khóa cấu hình để kết nối dữ liệu thực tế
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng hướng dẫn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* 1. Gemini API */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <Key className="w-4 h-4 text-blue-600" />
                1. Gemini API (Tạo đề, Chỉnh số liệu &amp; OCR Ảnh)
              </h4>
              <span
                className={`font-semibold ${
                  geminiReady ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {geminiReady ? 'Máy chủ đã sẵn sàng' : 'Chờ biến GEMINI_API_KEY'}
              </span>
            </div>
            <p>
              Toàn bộ cuộc gọi tới <code>@google/genai</code> chạy an toàn tại máy chủ Express trong tệp{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                server.ts
              </code>{' '}
              (các route <code>/api/ai/generate-exam</code>,{' '}
              <code>/api/ai/modify-question</code>, <code>/api/ai/ocr-exam</code>).
            </p>
            <p>
              Khi chạy thực tế, điền{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                GEMINI_API_KEY=&quot;your_key&quot;
              </code>{' '}
              vào tệp <code>.env</code> hoặc bảng <strong>Settings &gt; Secrets</strong> trên AI Studio.
            </p>
          </div>

          {/* 2. Firebase */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-amber-600" />
                2. Firebase (Google Sign-In, Firestore &amp; Cloud Storage)
              </h4>
              <span
                className={`font-semibold ${
                  firebaseReady ? 'text-emerald-700' : 'text-slate-600'
                }`}
              >
                {firebaseReady ? 'Đã cấu hình Firebase' : 'Đang chạy dữ liệu mẫu'}
              </span>
            </div>
            <p>
              Cấu trúc kết nối Firebase đã được viết sẵn tại{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                src/services/firebaseConfig.ts
              </code>
              . Chỉ cần bổ sung các biến <code>VITE_FIREBASE_*</code> vào tệp{' '}
              <code>.env</code> (theo mẫu <code>.env.example</code>):
            </p>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-[11px] font-mono-num">
{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...`}
            </pre>
          </div>

          {/* 3. Firestore Collections */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              3. Cấu trúc Collections đề xuất trên Firestore
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <code>classes</code>: Lưu thông tin lớp, mã lớp (<code>classCode</code>), đơn giá buổi học và danh sách <code>studentIds</code>.
              </li>
              <li>
                <code>sessions</code>: Lưu lịch dạy, trạng thái, và bản đồ điểm danh <code>attendance</code> liên kết trực tiếp học phí.
              </li>
              <li>
                <code>posts</code> &amp; <code>submissions</code>: Lưu bài giảng, link tệp từ Firebase Storage và bài nộp học sinh.
              </li>
              <li>
                <code>exams</code>: Lưu trữ bộ đề thi chuẩn A4 và barem chấm điểm.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
