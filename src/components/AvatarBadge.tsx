import React, { useState } from 'react';

interface AvatarBadgeProps {
  name: string;
  src?: string;
  sizeClass?: string;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  name,
  src,
  sizeClass = 'w-9 h-9 text-xs',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${sizeClass} rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClass} rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center shrink-0 border border-slate-300/60`}
    >
      {initials || 'U'}
    </div>
  );
};
