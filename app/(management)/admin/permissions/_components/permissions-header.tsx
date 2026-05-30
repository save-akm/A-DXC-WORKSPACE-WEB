// app/(management)/admin/permissions/_components/permissions-header.tsx
'use client';

import type React from 'react';
import { LucideIcon } from 'lucide-react';
import { DirtyBadge } from './dirty-badge';

interface PermissionsHeaderProps {
  icon: LucideIcon;
  iconStyle: React.CSSProperties;
  title: string;
  description: string;
  dirtyCount: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function PermissionsHeader({
  icon: Icon,
  iconStyle,
  title,
  description,
  dirtyCount,
  saving,
  onSave,
  onDiscard,
}: PermissionsHeaderProps) {
  const canSave = dirtyCount > 0 && !saving;

  return (
    <div className="sticky top-0 z-10 mb-5">
      <div className="rounded-2xl border border-indigo-500/15 bg-gradient-to-br from-[#1a1f3a] to-[#1e293b] p-5 shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg"
              style={iconStyle}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white">{title}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DirtyBadge count={dirtyCount} onDiscard={onDiscard} />
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                canSave
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                  : 'cursor-not-allowed bg-slate-800 text-slate-600'
              }`}
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังบันทึก…
                </>
              ) : (
                <>💾 Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
