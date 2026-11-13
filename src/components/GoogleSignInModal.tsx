import React, { useState } from 'react';
import { LogIn, X } from 'lucide-react';
import type { UserProfile } from '../types';
import {
  isFirebaseConfigured,
  signInWithGooglePopup,
} from '../services/firebaseConfig';
import { AvatarBadge } from './AvatarBadge';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorProfile: UserProfile;
  studentProfiles: UserProfile[];
  onSelectDemoProfile: (profile: UserProfile) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  tutorProfile,
  studentProfiles,
  onSelectDemoProfile,
}) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRealGoogleLogin = async () => {
    setErrorMsg('');
    if (!isFirebaseConfigured()) {
      setErrorMsg(
        'Chế độ trải nghiệm nhanh đang bật (chưa điền VITE_FIREBASE_* trong .env). Hãy chọn một tài khoản mẫu bên dưới để chuyển vai trò ngay.'
      );
      return;
    }
    setLoading(true);
    try {
      const user = await signInWithGooglePopup();
      onSelectDemoProfile({
        id: user.uid,
        name: user.displayName || 'Người dùng Google',
        email: user.email || '',
        role: 'student',
        avatarUrl: user.photoURL || '',
      });
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Không thể đăng nhập Google.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Đăng nhập tài khoản Google"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Đăng nhập Google Sign-In
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuyển đổi nhanh tài khoản Gia sư hoặc Học sinh để trải nghiệm phân quyền
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng đăng nhập"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <button
            type="button"
            disabled={loading}
            onClick={handleRealGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <LogIn className="w-4 h-4 text-blue-600" />
            Tiếp tục với tài khoản Google (Firebase Auth)
          </button>

          {errorMsg && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              {errorMsg}
            </p>
          )}

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-semibold text-slate-500">
              Tài khoản trải nghiệm tức thì:
            </p>

            {[tutorProfile, ...studentProfiles].map((prof) => (
              <button
                key={prof.id}
                type="button"
                onClick={() => {
                  onSelectDemoProfile(prof);
                  onClose();
                }}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarBadge
                    name={prof.name}
                    src={prof.avatarUrl}
                    sizeClass="w-9 h-9 text-xs"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {prof.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {prof.email}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 shrink-0">
                  {prof.role === 'tutor' ? 'Giáo viên' : 'Học sinh'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
