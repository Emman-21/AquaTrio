import React from 'react';
import { Zap, Sun } from 'lucide-react';
import { BatteryGraphic } from './Icons.jsx';
import { getBatteryFillColor } from '../utils/tankLogic.js';

/**
 * Displays battery percentage, voltage, and solar charging status across desktop and mobile layouts.
 * @param {{
 *   batteryPercent: number | null,
 *   batteryVolts?: number | null,
 *   solarCharging: boolean,
 *   dimmed?: boolean
 * }} props
 */
export function PowerCard({
  batteryPercent,
  batteryVolts = null,
  solarCharging,
  dimmed = false,
}) {
  const safePercent = typeof batteryPercent === 'number' ? batteryPercent : 0;
  const fillColor = getBatteryFillColor(safePercent);
  const percentText = typeof batteryPercent === 'number' ? `${batteryPercent}%` : '--';
  const voltsText =
    typeof batteryVolts === 'number' ? `${batteryVolts.toFixed(1)} V` : null;

  return (
    <>
      {/* Desktop Full-Width Power Card */}
      <section
        aria-label="Power status"
        className="hidden md:flex bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] px-6 py-5 items-center justify-between gap-6"
      >
        <div className={`flex items-center gap-6 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#E8F8EE] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-[#22C55E] fill-[#22C55E]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0B2545] leading-tight">Power</h2>
              <div className="mt-1">
                <BatteryGraphic percent={safePercent} fillColor={fillColor} />
              </div>
            </div>
          </div>

          <div className="pl-2">
            <p className="text-sm text-slate-500 font-medium">Battery</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-[#0B2545] tabular-nums leading-tight">
                {percentText}
              </p>
              {voltsText && (
                <span className="text-xs font-medium text-slate-400 tabular-nums">
                  {voltsText}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-3 pr-8 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
          <Sun
            className={`w-7 h-7 shrink-0 ${
              solarCharging ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-slate-400'
            }`}
            aria-hidden="true"
          />
          <span className="text-lg font-medium text-slate-600">
            {solarCharging ? 'Solar charging' : 'Solar standby'}
          </span>
        </div>
      </section>

      {/* Mobile Side-by-Side Battery + Solar Cards */}
      <section aria-label="Power status" className="grid grid-cols-2 gap-3 md:hidden">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] px-4 py-4 flex flex-col items-center justify-center text-center">
          <div className={`flex flex-col items-center transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
            <div className="w-16 h-10 rounded-full bg-[#F1F6FA] flex items-center justify-center mb-1.5">
              <BatteryGraphic percent={safePercent} fillColor={fillColor} compact />
            </div>
            <p className="text-xs font-medium text-slate-500">Battery</p>
            <p className="text-xl font-bold text-[#0B2545] tabular-nums leading-tight mt-0.5">
              {percentText}
            </p>
            {voltsText && (
              <p className="text-[11px] font-medium text-slate-400 tabular-nums">
                {voltsText}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] px-4 py-4 flex flex-col items-center justify-center text-center">
          <div className={`flex flex-col items-center transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
            <div className="w-11 h-11 rounded-full bg-[#FEF9EC] flex items-center justify-center mb-2">
              <Sun
                className={`w-6 h-6 ${
                  solarCharging ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-slate-400'
                }`}
                aria-hidden="true"
              />
            </div>
            <p className="text-sm font-semibold text-[#0B2545]">
              {solarCharging ? 'Solar charging' : 'Solar standby'}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
