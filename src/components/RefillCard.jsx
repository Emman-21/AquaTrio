import React from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { RefillWaterIcon } from './Icons.jsx';
import { Toggle } from './Toggle.jsx';

/**
 * Dismissible red alert banner displayed when refill.fault is active.
 */
function RefillFaultBanner({ onDismiss }) {
  return (
    <div
      role="alert"
      className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-start justify-between gap-2"
    >
      <div className="flex items-start gap-2 min-w-0">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="font-medium leading-snug">
          Pump isn&apos;t moving water. Check the reservoir.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss refill alert"
        className="p-0.5 rounded text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Water Refill card supporting standalone desktop card, compact mobile row, and dismissible fault banner.
 * @param {{
 *   statusText: string,
 *   autoRefill: boolean,
 *   isRefilling: boolean,
 *   fault?: string | null,
 *   hasFault?: boolean,
 *   pendingRefill?: boolean,
 *   pendingAuto?: boolean,
 *   disabled?: boolean,
 *   dimmed?: boolean,
 *   onToggleAutoRefill: (auto: boolean) => void,
 *   onRefillNow: () => void,
 *   onDismissFault?: () => void,
 *   variant?: 'card' | 'row'
 * }} props
 */
export function RefillCard({
  statusText,
  autoRefill,
  isRefilling,
  fault = null,
  hasFault = Boolean(fault),
  pendingRefill = false,
  pendingAuto = false,
  disabled = false,
  dimmed = false,
  onToggleAutoRefill,
  onRefillNow,
  onDismissFault,
  variant = 'card',
}) {
  if (variant === 'row') {
    return (
      <div className="py-3.5 first:pt-1.5 last:pb-1.5">
        <div className={`flex items-center gap-2.5 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-[#EBF7FA] flex items-center justify-center shrink-0">
            <RefillWaterIcon className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-[#0B2545] leading-tight whitespace-nowrap">
              Water Refill
            </h2>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  hasFault
                    ? 'bg-rose-500'
                    : isRefilling
                    ? 'bg-[#0E9AA7]'
                    : 'bg-[#22C55E]'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  hasFault ? 'text-rose-600' : 'text-[#0E9AA7]'
                }`}
              >
                {isRefilling ? 'Refilling…' : statusText}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className={`flex items-center gap-2.5 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
            <label
              htmlFor="refill-auto-mobile"
              className="text-xs font-medium text-slate-600 leading-none cursor-pointer whitespace-nowrap"
            >
              Auto refill
            </label>
            <Toggle
              id="refill-auto-mobile"
              label="Auto refill"
              checked={autoRefill}
              disabled={disabled || pendingAuto}
              onChange={onToggleAutoRefill}
              compact
            />
          </div>

          <button
            type="button"
            onClick={onRefillNow}
            disabled={disabled || pendingRefill || hasFault}
            title={hasFault ? 'Resolve the fault to refill' : undefined}
            aria-describedby={hasFault ? 'refill-fault-hint-mobile' : undefined}
            className="rounded-lg border border-[#0E9AA7] bg-white hover:bg-[#F0FAFB] disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-[#0E9AA7] font-semibold text-xs px-3.5 py-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7]"
          >
            {pendingRefill && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            <span>
              {pendingRefill
                ? 'Sending…'
                : isRefilling
                ? 'Stop Refill'
                : 'Refill Now'}
            </span>
          </button>
        </div>

        {hasFault && (
          <p
            id="refill-fault-hint-mobile"
            className="text-[11px] text-slate-500 text-right mt-1.5"
          >
            Resolve the fault to refill
          </p>
        )}

        {fault && onDismissFault && <RefillFaultBanner onDismiss={onDismissFault} />}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="refill-card-title"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] p-5 flex flex-col justify-between h-full"
    >
      <div>
        <div className={`flex items-start gap-3.5 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
          <div className="w-12 h-12 rounded-full bg-[#EBF7FA] flex items-center justify-center shrink-0">
            <RefillWaterIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2
              id="refill-card-title"
              className="text-base md:text-lg font-bold text-[#0B2545] leading-snug"
            >
              Water Refill
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  hasFault
                    ? 'bg-rose-500'
                    : isRefilling
                    ? 'bg-[#0E9AA7]'
                    : 'bg-[#22C55E]'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-xs font-medium ${
                  hasFault ? 'text-rose-600' : 'text-[#0E9AA7]'
                }`}
              >
                {isRefilling ? 'Refilling…' : statusText}
              </span>
            </div>
          </div>
        </div>

        {fault && onDismissFault && <RefillFaultBanner onDismiss={onDismissFault} />}
      </div>

      <div className={`mt-6 flex items-center justify-between gap-4 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
        <label
          htmlFor="refill-auto-desktop"
          className="text-sm font-medium text-[#0B2545] cursor-pointer"
        >
          Auto refill
        </label>
        <Toggle
          id="refill-auto-desktop"
          label="Auto water refill"
          checked={autoRefill}
          disabled={disabled || pendingAuto}
          onChange={onToggleAutoRefill}
        />
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={onRefillNow}
          disabled={disabled || pendingRefill || hasFault}
          title={hasFault ? 'Resolve the fault to refill' : undefined}
          aria-describedby={hasFault ? 'refill-fault-hint-desktop' : undefined}
          className="w-full rounded-lg border border-[#0E9AA7] bg-white hover:bg-[#F0FAFB] active:scale-[0.99] disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-[#0E9AA7] font-semibold text-sm py-2.5 px-4 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7] focus-visible:ring-offset-2"
        >
          {pendingRefill && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          <span>
            {pendingRefill
              ? 'Sending…'
              : isRefilling
              ? 'Stop Refill'
              : 'Refill Now'}
          </span>
        </button>
        {hasFault && (
          <p
            id="refill-fault-hint-desktop"
            className="text-[11px] text-slate-500 text-center md:text-left mt-2"
          >
            Resolve the fault to refill
          </p>
        )}
      </div>
    </section>
  );
}
