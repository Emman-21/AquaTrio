import React from 'react';
import { Thermometer, Sliders, Radio } from 'lucide-react';
import { TEMP_MIN_SAFE_C, TEMP_MAX_SAFE_C } from '../constants/tank.js';
import { getTemperatureStatus } from '../utils/tankLogic.js';

/**
 * Tank settings view consuming state passed from useDevice() via App.
 * Does not interact with any device transport directly.
 * @param {{
 *   tankName: string,
 *   connection: 'connecting' | 'online' | 'offline',
 *   isMockMode: boolean,
 *   temperature: number | null,
 *   batteryVolts: number | null,
 *   onUpdateTankName: (name: string) => void
 * }} props
 */
export function SettingsView({
  tankName,
  connection,
  isMockMode,
  temperature,
  batteryVolts,
  onUpdateTankName,
}) {
  const tempStatus = getTemperatureStatus(temperature);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl md:text-3xl font-bold text-[#0B2545] text-center md:text-left">
        Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section
          aria-labelledby="tank-profile-heading"
          className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EBF7FA] flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5 text-[#0E9AA7]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="tank-profile-heading" className="text-base font-bold text-[#0B2545]">
                Tank Profile
              </h2>
              <p className="text-xs text-slate-500">Manage aquarium display settings</p>
            </div>
          </div>

          <div>
            <label
              htmlFor="settings-tank-name"
              className="block text-xs font-medium text-slate-500 mb-1"
            >
              Tank Name
            </label>
            <input
              id="settings-tank-name"
              type="text"
              value={tankName}
              onChange={(e) => onUpdateTankName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-[#0B2545] focus:border-[#0E9AA7] focus:outline-none focus:ring-2 focus:ring-[#0E9AA7]/25"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Radio className="w-4 h-4 text-[#0E9AA7]" aria-hidden="true" />
              <span>Connection mode</span>
            </div>
            <span className="font-semibold text-[#0B2545] capitalize">
              {connection} {isMockMode ? '(Sample)' : ''}
            </span>
          </div>
        </section>

        <section
          aria-labelledby="sensor-thresholds-heading"
          className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FEF4EC] flex items-center justify-center shrink-0">
              <Thermometer className="w-5 h-5 text-[#D97706]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="sensor-thresholds-heading" className="text-base font-bold text-[#0B2545]">
                Sensor Thresholds
              </h2>
              <p className="text-xs text-slate-500">
                Safe water temperature range: {TEMP_MIN_SAFE_C.toFixed(1)} °C – {TEMP_MAX_SAFE_C.toFixed(1)} °C
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Current temperature</span>
              <span className="font-bold text-[#0B2545] tabular-nums">
                {tempStatus.formattedValue}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Battery voltage</span>
              <span className="font-bold text-[#0B2545] tabular-nums">
                {typeof batteryVolts === 'number' ? `${batteryVolts.toFixed(1)} V` : '--'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
