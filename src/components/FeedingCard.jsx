import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { FeedingBowlIcon } from './Icons.jsx';
import { PORTION_OPTIONS } from '../constants/tank.js';
import { getPortionLabel } from '../utils/tankLogic.js';

/**
 * Feeding control card with portion selector, pending spinner state, and offline disablement.
 * @param {{
 *   lastFed: string,
 *   lastFedSource?: string,
 *   nextFeeding: string,
 *   selectedPortion: number,
 *   feedLeftPercent: number,
 *   pending: boolean,
 *   disabled: boolean,
 *   dimmed?: boolean,
 *   onChangePortion: (portion: number) => void,
 *   onFeedNow: () => void
 * }} props
 */
export function FeedingCard({
  lastFed,
  lastFedSource,
  nextFeeding,
  selectedPortion,
  feedLeftPercent,
  pending,
  disabled,
  dimmed = false,
  onChangePortion,
  onFeedNow,
}) {
  return (
    <section
      aria-labelledby="feeding-card-title"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] p-5 flex flex-col justify-between h-full"
    >
      <div className={`transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#EBF7FA] flex items-center justify-center shrink-0">
            <FeedingBowlIcon className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h2
              id="feeding-card-title"
              className="text-base md:text-lg font-bold text-[#0B2545] leading-snug"
            >
              Feeding
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Last fed:{' '}
              <span className="font-medium text-slate-700">{lastFed}</span>
              {lastFedSource && lastFed !== '--' && (
                <span className="text-slate-400"> ({lastFedSource})</span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Next feeding:{' '}
              <span className="font-medium text-slate-700">{nextFeeding}</span>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="portion-select"
            className="block text-xs font-medium text-slate-500 mb-1.5"
          >
            Portion
          </label>
          <div className="relative">
            <select
              id="portion-select"
              value={selectedPortion}
              disabled={disabled || pending}
              onChange={(e) => onChangePortion(Number(e.target.value))}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-[#0B2545] focus:border-[#0E9AA7] focus:outline-none focus:ring-2 focus:ring-[#0E9AA7]/25 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {PORTION_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {getPortionLabel(count)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onFeedNow}
          disabled={disabled || pending || feedLeftPercent <= 0}
          className="w-full rounded-lg bg-[#0E9AA7] hover:bg-[#0B8490] active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 px-4 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7] focus-visible:ring-offset-2"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Feeding…</span>
            </>
          ) : (
            <span>Feed Now</span>
          )}
        </button>
        <p className="text-[11px] text-slate-500 text-center md:text-left mt-2">
          {!disabled && feedLeftPercent <= 0
            ? 'Feeder empty — refill pellets to dispense'
            : 'Dispenses one selected portion'}
        </p>
      </div>
    </section>
  );
}
