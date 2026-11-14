import React from 'react';
import { Loader2 } from 'lucide-react';
import { FilterCartridgeIcon } from './Icons.jsx';
import { Toggle } from './Toggle.jsx';

/**
 * Water Filter card supporting standalone desktop card and compact mobile row variants.
 * @param {{
 *   isRunning: boolean,
 *   isAutomatic: boolean,
 *   pendingFilter?: boolean,
 *   pendingAuto?: boolean,
 *   disabled?: boolean,
 *   dimmed?: boolean,
 *   onToggleAutomatic: (automatic: boolean) => void,
 *   onToggleFilter: () => void,
 *   variant?: 'card' | 'row'
 * }} props
 */
export function FilterCard({
  isRunning,
  isAutomatic,
  pendingFilter = false,
  pendingAuto = false,
  disabled = false,
  dimmed = false,
  onToggleAutomatic,
  onToggleFilter,
  variant = 'card',
}) {
  if (variant === 'row') {
    return (
      <div className="py-3.5 first:pt-1.5 last:pb-1.5">
        <div className={`flex items-center gap-2.5 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-[#EBF7FA] flex items-center justify-center shrink-0">
            <FilterCartridgeIcon className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-[#0B2545] leading-tight whitespace-nowrap">
              Water Filter
            </h2>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isRunning ? 'bg-[#22C55E]' : 'bg-amber-500'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isRunning ? 'text-[#0E9AA7]' : 'text-amber-700'
                }`}
              >
                {isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className={`flex items-center gap-2.5 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
            <label
              htmlFor="filter-auto-mobile"
              className="text-xs font-medium text-slate-600 leading-none cursor-pointer whitespace-nowrap"
            >
              Automatic
            </label>
            <Toggle
              id="filter-auto-mobile"
              label="Water Filter Automatic"
              checked={isAutomatic}
              disabled={disabled || pendingAuto}
              onChange={onToggleAutomatic}
              compact
            />
          </div>

          <button
            type="button"
            disabled={disabled || pendingFilter}
            onClick={onToggleFilter}
            className="rounded-lg border border-[#0E9AA7] bg-white hover:bg-[#F0FAFB] disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-[#0E9AA7] font-semibold text-xs px-3.5 py-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7]"
          >
            {pendingFilter && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            <span>{pendingFilter ? 'Updating…' : isRunning ? 'Stop Filter' : 'Start Filter'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="filter-card-title"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] p-5 flex flex-col justify-between h-full"
    >
      <div className={`flex items-start gap-3.5 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
        <div className="w-12 h-12 rounded-full bg-[#EBF7FA] flex items-center justify-center shrink-0">
          <FilterCartridgeIcon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h2
            id="filter-card-title"
            className="text-base md:text-lg font-bold text-[#0B2545] leading-snug"
          >
            Water Filter
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isRunning ? 'bg-[#22C55E]' : 'bg-amber-500'
              }`}
              aria-hidden="true"
            />
            <span
              className={`text-xs font-medium ${
                isRunning ? 'text-[#0E9AA7]' : 'text-amber-700'
              }`}
            >
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
      </div>

      <div className={`mt-6 flex items-center justify-between gap-4 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
        <label
          htmlFor="filter-auto-desktop"
          className="text-sm font-medium text-[#0B2545] cursor-pointer"
        >
          Automatic
        </label>
        <Toggle
          id="filter-auto-desktop"
          label="Automatic water filter"
          checked={isAutomatic}
          disabled={disabled || pendingAuto}
          onChange={onToggleAutomatic}
        />
      </div>

      <div className="mt-5">
        <button
          type="button"
          disabled={disabled || pendingFilter}
          onClick={onToggleFilter}
          className="w-full rounded-lg border border-[#0E9AA7] bg-white hover:bg-[#F0FAFB] active:scale-[0.99] disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-[#0E9AA7] font-semibold text-sm py-2.5 px-4 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7] focus-visible:ring-offset-2"
        >
          {pendingFilter && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          <span>{pendingFilter ? 'Updating…' : isRunning ? 'Stop Filter' : 'Start Filter'}</span>
        </button>
      </div>
    </section>
  );
}
