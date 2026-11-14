import React from 'react';

/**
 * Accessible switch toggle control.
 * @param {{
 *   id: string,
 *   label: string,
 *   checked: boolean,
 *   onChange: (checked: boolean) => void,
 *   compact?: boolean,
 *   disabled?: boolean
 * }} props
 */
export function Toggle({
  id,
  label,
  checked,
  onChange,
  compact = false,
  disabled = false,
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7] focus-visible:ring-offset-2 ${
        compact ? 'h-6 w-11' : 'h-7 w-12'
      } ${
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
      } ${checked ? 'bg-[#0E9AA7]' : 'bg-slate-300'}`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ${
          compact ? 'h-4.5 w-4.5' : 'h-5 w-5'
        } ${
          checked
            ? compact
              ? 'translate-x-5.5'
              : 'translate-x-6'
            : 'translate-x-1'
        }`}
      />
    </button>
  );
}
