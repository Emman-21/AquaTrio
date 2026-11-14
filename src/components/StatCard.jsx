import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Status metric card with optional progress bar, out-of-range warning badge, and offline dimming.
 * @param {{
 *   label: string,
 *   value: string,
 *   icon: React.ReactNode,
 *   badgeBgClass: string,
 *   progressPercent?: number,
 *   warningLabel?: string | null,
 *   centeredMobile?: boolean,
 *   valueClassName?: string,
 *   dimmed?: boolean
 * }} props
 */
export function StatCard({
  label,
  value,
  icon,
  badgeBgClass,
  progressPercent,
  warningLabel,
  centeredMobile = false,
  valueClassName = 'text-[#0B2545]',
  dimmed = false,
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-[0_2px_10px_rgba(11,37,69,0.04)] px-4 py-3.5 md:px-5 md:py-4 flex items-center gap-3.5 transition-all ${
        warningLabel ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'
      } ${centeredMobile ? 'justify-center md:justify-start' : 'justify-start'}`}
    >
      <div
        className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 transition-opacity ${badgeBgClass} ${
          dimmed ? 'opacity-55' : ''
        }`}
      >
        {icon}
      </div>

      <div
        className={`min-w-0 ${centeredMobile ? 'md:flex-1' : 'flex-1'} max-w-full transition-opacity ${
          dimmed ? 'opacity-55' : ''
        }`}
      >
        <p className="text-xs font-medium text-slate-500">{label}</p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
          <p
            className={`text-lg md:text-[21px] font-bold leading-snug tabular-nums ${valueClassName}`}
          >
            {value}
          </p>
          {warningLabel && (
            <span
              role="status"
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-semibold text-amber-800 shrink-0"
            >
              <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
              {warningLabel}
            </span>
          )}
        </div>

        {typeof progressPercent === 'number' && (
          <div
            className="mt-1.5 h-2 w-full rounded-full bg-[#E1ECEE] overflow-hidden"
            role="progressbar"
            aria-label={`${label} ${progressPercent}%`}
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[#0E9AA7] transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
