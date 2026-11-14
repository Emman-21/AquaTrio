/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Waves, Droplet, Thermometer, AlertCircle, X } from 'lucide-react';
import { Header } from './components/Header.jsx';
import { StatCard } from './components/StatCard.jsx';
import { FeedingCard } from './components/FeedingCard.jsx';
import { FilterCard } from './components/FilterCard.jsx';
import { RefillCard } from './components/RefillCard.jsx';
import { PowerCard } from './components/PowerCard.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { PelletsIcon } from './components/Icons.jsx';
import { ScheduleView } from './components/ScheduleView.jsx';
import { SettingsView } from './components/SettingsView.jsx';
import { NAV_TABS } from './constants/tank.js';
import { useDevice } from './hooks/useDevice.js';
import {
  formatUnixTime12Hour,
  formatWaterClarity,
  formatWaterLevel,
  getTemperatureStatus,
} from './utils/tankLogic.js';

export default function App() {
  const [activeTab, setActiveTab] = useState(NAV_TABS.DASHBOARD);
  const [tankName, setTankName] = useState('My Fish Tank');
  const [selectedPortion, setSelectedPortion] = useState(1);

  const {
    state,
    connection,
    pending,
    error,
    clearError,
    dismissRefillFault,
    isMockMode,
    feed,
    setFilter,
    setFilterAuto,
    refill,
    setRefillAuto,
    setSchedule,
  } = useDevice();

  const isDisconnected = connection !== 'online';
  const isOffline = connection === 'offline';

  const waterLevelText = state ? formatWaterLevel(state.waterLevel) : '--';
  const waterClarityText = state ? formatWaterClarity(state.waterClarity) : '--';
  const feedPercent = state ? state.feedPercent : 0;
  const feedPercentText = state ? `${state.feedPercent}%` : '--';
  const tempStatus = getTemperatureStatus(state ? state.temperature : null);
  const lastFedText = state ? formatUnixTime12Hour(state.lastFed) : '--';
  const nextFeedingText = state
    ? state.nextFeed === null
      ? 'None'
      : formatUnixTime12Hour(state.nextFeed)
    : '--';

  const filterRunning = state ? state.filter.running : false;
  const filterAuto = state ? state.filter.auto : false;
  const refillActive = state ? state.refill.active : false;
  const refillAuto = state ? state.refill.auto : false;
  const hasRefillFault = Boolean(state?.refill?.fault);
  const refillFault = state ? state.visibleRefillFault : null;
  const refillStatusText = hasRefillFault
    ? 'Fault detected'
    : state
    ? state.waterLevel === 'low'
      ? 'Level low'
      : 'Level normal'
    : '--';

  return (
    <div className="min-h-screen bg-[#F3F7F7] text-[#0B2545] flex flex-col">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        connection={connection}
        userName="Sam"
        isMockMode={isMockMode}
      />

      {error && (
        <div
          role="alert"
          className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-auto md:min-w-80 md:max-w-md z-50 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span className="font-medium leading-snug">{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            aria-label="Dismiss notification"
            className="p-1 rounded text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 pt-5 md:pt-7 pb-24 md:pb-10">
        {activeTab === NAV_TABS.DASHBOARD && (
          <div className="space-y-4 md:space-y-5">
            <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight text-[#0B2545] text-center md:text-left leading-tight">
              {tankName || 'My Fish Tank'}
            </h1>

            {/* Desktop Row 1: 4 equal status cards */}
            <section
              aria-label="Tank water and feed status"
              className="hidden md:grid md:grid-cols-4 gap-5"
            >
              <StatCard
                label="Water level"
                value={waterLevelText}
                badgeBgClass="bg-[#EBF7FA]"
                icon={<Waves className="w-5 h-5 text-[#0E9AA7]" aria-hidden="true" />}
                dimmed={isOffline}
              />
              <StatCard
                label="Water clarity"
                value={waterClarityText}
                badgeBgClass="bg-[#ECF5FE]"
                icon={<Droplet className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />}
                dimmed={isOffline}
              />
              <StatCard
                label="Feed left"
                value={feedPercentText}
                badgeBgClass="bg-[#F7EFE6]"
                icon={<PelletsIcon className="w-6 h-6" />}
                progressPercent={state ? feedPercent : 0}
                dimmed={isOffline}
              />
              <StatCard
                label="Water temperature"
                value={tempStatus.formattedValue}
                badgeBgClass={tempStatus.isWarning ? 'bg-amber-100' : 'bg-[#EBF7FA]'}
                icon={
                  <Thermometer
                    className={`w-5 h-5 ${
                      tempStatus.isWarning ? 'text-amber-600' : 'text-[#0E9AA7]'
                    }`}
                    aria-hidden="true"
                  />
                }
                warningLabel={tempStatus.warningLabel}
                dimmed={isOffline}
              />
            </section>

            {/* Mobile Row 1-3: Water level (full row), Water clarity + Feed left (2 cols), Temperature (full row) */}
            <section
              aria-label="Tank water and feed status"
              className="grid grid-cols-2 gap-3 md:hidden"
            >
              <div className="col-span-2">
                <StatCard
                  label="Water level"
                  value={waterLevelText}
                  badgeBgClass="bg-[#EBF7FA]"
                  icon={<Waves className="w-5 h-5 text-[#0E9AA7]" aria-hidden="true" />}
                  centeredMobile
                  valueClassName="text-[#0E9AA7]"
                  dimmed={isOffline}
                />
              </div>

              <StatCard
                label="Water clarity"
                value={waterClarityText}
                badgeBgClass="bg-[#ECF5FE]"
                icon={<Droplet className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />}
                valueClassName="text-[#0E9AA7]"
                dimmed={isOffline}
              />

              <StatCard
                label="Feed left"
                value={feedPercentText}
                badgeBgClass="bg-[#F7EFE6]"
                icon={<PelletsIcon className="w-6 h-6" />}
                progressPercent={state ? feedPercent : 0}
                dimmed={isOffline}
              />

              <div className="col-span-2">
                <StatCard
                  label="Water temperature"
                  value={tempStatus.formattedValue}
                  badgeBgClass={tempStatus.isWarning ? 'bg-amber-100' : 'bg-[#EBF7FA]'}
                  icon={
                    <Thermometer
                      className={`w-5 h-5 ${
                        tempStatus.isWarning ? 'text-amber-600' : 'text-[#0E9AA7]'
                      }`}
                      aria-hidden="true"
                    />
                  }
                  warningLabel={tempStatus.warningLabel}
                  dimmed={isOffline}
                />
              </div>
            </section>

            {/* Desktop Row 2: Feeding / Water Filter / Water Refill as equal cards */}
            <div className="hidden md:grid md:grid-cols-3 gap-5 items-stretch">
              <FeedingCard
                lastFed={lastFedText}
                lastFedSource={state?.lastFedSource}
                nextFeeding={nextFeedingText}
                selectedPortion={selectedPortion}
                feedLeftPercent={feedPercent}
                pending={pending.feed}
                disabled={isDisconnected}
                dimmed={isOffline}
                onChangePortion={setSelectedPortion}
                onFeedNow={() => feed(selectedPortion)}
              />

              <FilterCard
                variant="card"
                isRunning={filterRunning}
                isAutomatic={filterAuto}
                pendingFilter={pending.filter}
                pendingAuto={pending.filterAuto}
                disabled={isDisconnected}
                dimmed={isOffline}
                onToggleAutomatic={(enabled) => setFilterAuto(enabled)}
                onToggleFilter={() =>
                  setFilter(filterRunning ? 'stop' : 'start')
                }
              />

              <RefillCard
                variant="card"
                statusText={refillStatusText}
                autoRefill={refillAuto}
                isRefilling={refillActive}
                fault={refillFault}
                hasFault={hasRefillFault}
                pendingRefill={pending.refill}
                pendingAuto={pending.refillAuto}
                disabled={isDisconnected}
                dimmed={isOffline}
                onToggleAutoRefill={(enabled) => setRefillAuto(enabled)}
                onRefillNow={() => refill(refillActive ? 'stop' : 'start')}
                onDismissFault={dismissRefillFault}
              />
            </div>

            {/* Mobile Controls: Feeding card, then one combined card holding Filter and Refill rows */}
            <div className="flex flex-col gap-3.5 md:hidden">
              <FeedingCard
                lastFed={lastFedText}
                lastFedSource={state?.lastFedSource}
                nextFeeding={nextFeedingText}
                selectedPortion={selectedPortion}
                feedLeftPercent={feedPercent}
                pending={pending.feed}
                disabled={isDisconnected}
                dimmed={isOffline}
                onChangePortion={setSelectedPortion}
                onFeedNow={() => feed(selectedPortion)}
              />

              <section
                aria-label="Filter and refill controls"
                className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(11,37,69,0.04)] px-3.5 py-2.5 divide-y divide-slate-100"
              >
                <FilterCard
                  variant="row"
                  isRunning={filterRunning}
                  isAutomatic={filterAuto}
                  pendingFilter={pending.filter}
                  pendingAuto={pending.filterAuto}
                  disabled={isDisconnected}
                  dimmed={isOffline}
                  onToggleAutomatic={(enabled) => setFilterAuto(enabled)}
                  onToggleFilter={() =>
                    setFilter(filterRunning ? 'stop' : 'start')
                  }
                />
                <RefillCard
                  variant="row"
                  statusText={refillStatusText}
                  autoRefill={refillAuto}
                  isRefilling={refillActive}
                  fault={refillFault}
                  hasFault={hasRefillFault}
                  pendingRefill={pending.refill}
                  pendingAuto={pending.refillAuto}
                  disabled={isDisconnected}
                  dimmed={isOffline}
                  onToggleAutoRefill={(enabled) => setRefillAuto(enabled)}
                  onRefillNow={() => refill(refillActive ? 'stop' : 'start')}
                  onDismissFault={dismissRefillFault}
                />
              </section>
            </div>

            {/* Row 3: Power */}
            <PowerCard
              batteryPercent={state ? state.battery : null}
              batteryVolts={state ? state.batteryVolts : null}
              solarCharging={state ? state.solarCharging : false}
              dimmed={isOffline}
            />

            {/* Mobile footer caption */}
            {isMockMode && (
              <p className="md:hidden text-center text-xs text-slate-400 pt-1">
                Sample readings for UI preview
              </p>
            )}
          </div>
        )}

        {activeTab === NAV_TABS.SCHEDULE && (
          <ScheduleView
            feedTimes={state?.schedule?.feedTimes ?? []}
            pending={pending.schedule}
            disabled={isDisconnected}
            dimmed={isOffline}
            onUpdateSchedule={setSchedule}
          />
        )}

        {activeTab === NAV_TABS.SETTINGS && (
          <SettingsView
            tankName={tankName}
            connection={connection}
            isMockMode={isMockMode}
            temperature={state ? state.temperature : null}
            batteryVolts={state ? state.batteryVolts : null}
            onUpdateTankName={setTankName}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}
