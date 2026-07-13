// app/(management)/admin/permissions/_components/permission-checkbox.tsx
'use client';

import { motion } from 'framer-motion';

export type CheckboxState = 'checked' | 'unchecked' | 'dirty-added' | 'dirty-removed';
export type CheckboxVariant = 'default' | 'privilege';

interface PermissionCheckboxProps {
  state: CheckboxState;
  onToggle: () => void;
  disabled?: boolean;
  /** 'privilege' renders an amber/orange treatment for high-privilege actions. */
  variant?: CheckboxVariant;
}

const BASE =
  'relative w-[18px] h-[18px] rounded-[5px] flex items-center justify-center cursor-pointer transition-all duration-150 select-none';

const STATE_CLASSES: Record<CheckboxState, string> = {
  checked:
    'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_2px_8px_rgba(99,102,241,0.4)]',
  unchecked: 'bg-transparent border border-slate-600',
  'dirty-added':
    'bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_2px_8px_rgba(16,185,129,0.4)] outline outline-2 outline-emerald-500/40 outline-offset-1',
  'dirty-removed':
    'bg-transparent border border-red-500/50 outline outline-2 outline-red-500/20 outline-offset-1',
};

const PRIVILEGE_STATE_CLASSES: Record<CheckboxState, string> = {
  ...STATE_CLASSES,
  checked:
    'bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_2px_8px_rgba(245,158,11,0.45)]',
  unchecked: 'bg-transparent border border-amber-500/40',
};

export function PermissionCheckbox({ state, onToggle, disabled, variant = 'default' }: PermissionCheckboxProps) {
  const showCheck = state === 'checked' || state === 'dirty-added';
  const classes = variant === 'privilege' ? PRIVILEGE_STATE_CLASSES : STATE_CLASSES;

  return (
    <motion.div
      role="checkbox"
      aria-checked={state === 'checked' || state === 'dirty-added'}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`${BASE} ${classes[state]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onToggle}
      whileTap={disabled ? undefined : { scale: 0.82 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {showCheck && (
        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
          <path
            d="M1 3.5L4 6.5L10 1"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </motion.div>
  );
}
