import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import { SCHEDULE_PORTION_OPTIONS, WEEKDAYS } from '../constants/tank.js';
import {
  formatScheduleDays,
  formatScheduleTime24To12,
  getPortionLabel,
} from '../utils/tankLogic.js';

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

/**
 * Feeding schedule management view wired to the retained cmd/schedule contract payload.
 * @param {{
 *   feedTimes: Array<{ time: string, days: number[], portions: number }>,
 *   pending: boolean,
 *   disabled: boolean,
 *   dimmed?: boolean,
 *   onUpdateSchedule: (nextFeedTimes: Array<{ time: string, days: number[], portions: number }>) => void
 * }} props
 */
export function ScheduleView({
  feedTimes,
  pending,
  disabled,
  dimmed = false,
  onUpdateSchedule,
}) {
  const [timeInput, setTimeInput] = useState('18:00');
  const [portionInput, setPortionInput] = useState(1);
  const [selectedDays, setSelectedDays] = useState(ALL_DAYS);

  const toggleDay = (dayValue) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((d) => d !== dayValue);
      }
      return [...prev, dayValue].sort((a, b) => a - b);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || pending || selectedDays.length === 0) return;
    const [rawH = '0', rawM = '0'] = String(timeInput).split(':');
    const normalizedTime = `${String(Number(rawH) || 0).padStart(2, '0')}:${String(
      Number(rawM) || 0
    ).padStart(2, '0')}`;
    const normalizedDays = [...selectedDays].sort((a, b) => a - b);
    const normalizedPortions = Math.max(1, Math.min(5, Math.trunc(Number(portionInput) || 1)));

    const next = [
      ...feedTimes,
      {
        time: normalizedTime,
        days: normalizedDays,
        portions: normalizedPortions,
      },
    ].sort((a, b) => a.time.localeCompare(b.time));
    onUpdateSchedule(next);
  };

  const handleRemove = (index) => {
    if (disabled || pending) return;
    const next = feedTimes.filter((_, idx) => idx !== index);
    onUpdateSchedule(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0B2545] text-center md:text-left w-full md:w-auto">
          Feeding Schedule
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <section
          aria-labelledby="schedule-list-heading"
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] p-5"
        >
          <div className={`flex items-center gap-3 mb-4 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-[#EBF7FA] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#0E9AA7]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="schedule-list-heading" className="text-base font-bold text-[#0B2545]">
                Daily Routines
              </h2>
              <p className="text-xs text-slate-500">
                Retained on device (UTC+8 local time)
              </p>
            </div>
          </div>

          {feedTimes.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No feeding schedules configured yet. Add one to automate feedings.
            </p>
          ) : (
            <ul className={`divide-y divide-slate-100 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
              {feedTimes.map((item, idx) => {
                const displayTime = formatScheduleTime24To12(item.time);
                const displayDays = formatScheduleDays(item.days);
                return (
                  <li
                    key={`${item.time}-${idx}`}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-[#0E9AA7]" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0B2545] tabular-nums">
                          {displayTime}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {displayDays} · {getPortionLabel(item.portions)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={disabled || pending}
                      onClick={() => handleRemove(idx)}
                      aria-label={`Remove feeding at ${displayTime}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="add-schedule-heading"
          className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] p-5"
        >
          <h2 id="add-schedule-heading" className="text-base font-bold text-[#0B2545] mb-3">
            Add Feeding Time
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="schedule-time"
                  className="block text-xs font-medium text-slate-500 mb-1"
                >
                  Time
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  value={timeInput}
                  disabled={disabled || pending}
                  onChange={(e) => setTimeInput(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0B2545] tabular-nums focus:border-[#0E9AA7] focus:outline-none focus:ring-2 focus:ring-[#0E9AA7]/25 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="schedule-portion"
                  className="block text-xs font-medium text-slate-500 mb-1"
                >
                  Portion
                </label>
                <select
                  id="schedule-portion"
                  value={portionInput}
                  disabled={disabled || pending}
                  onChange={(e) => setPortionInput(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0B2545] focus:border-[#0E9AA7] focus:outline-none focus:ring-2 focus:ring-[#0E9AA7]/25 disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  {SCHEDULE_PORTION_OPTIONS.map((count) => (
                    <option key={count} value={count}>
                      {getPortionLabel(count)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1.5">
                Days
              </span>
              <div
                role="group"
                aria-label="Schedule days"
                className="grid grid-cols-7 gap-1"
              >
                {WEEKDAYS.map((day) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      disabled={disabled || pending}
                      aria-pressed={isSelected}
                      aria-label={day.full}
                      onClick={() => toggleDay(day.value)}
                      className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7] ${
                        isSelected
                          ? 'bg-[#0E9AA7] border-[#0E9AA7] text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
              {selectedDays.length === 0 && (
                <p className="text-[11px] text-rose-600 mt-1">
                  Select at least one day
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={disabled || pending || selectedDays.length === 0}
              className="w-full rounded-lg bg-[#0E9AA7] hover:bg-[#0B8490] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 px-4 transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7] focus-visible:ring-offset-2"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Add Schedule</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
