import React from 'react';
import { Settings } from 'lucide-react';
import { AquaTrioLogo } from './Icons.jsx';
import { NAV_TABS } from '../constants/tank.js';

const NAV_ITEMS = [
  { id: NAV_TABS.DASHBOARD, label: 'Dashboard' },
  { id: NAV_TABS.SCHEDULE, label: 'Schedule' },
  { id: NAV_TABS.SETTINGS, label: 'Settings' },
];

/**
 * Returns status dot color and label for a connection state.
 * @param {'connecting' | 'online' | 'offline'} connection
 */
function getConnectionBadge(connection) {
  if (connection === 'connecting') {
    return {
      dotClass: 'bg-amber-400 animate-pulse',
      textClass: 'text-amber-700',
      desktopTextClass: 'text-amber-700',
      label: 'Connecting…',
    };
  }
  if (connection === 'offline') {
    return {
      dotClass: 'bg-[#EF4444]',
      textClass: 'text-rose-600',
      desktopTextClass: 'text-rose-600',
      label: 'Device offline',
    };
  }
  return {
    dotClass: 'bg-[#22C55E]',
    textClass: 'text-[#16A34A]',
    desktopTextClass: 'text-[#0B2545]',
    label: 'Device online',
  };
}

/**
 * Responsive top navigation header for desktop and mobile viewports.
 * @param {{
 *   activeTab: string,
 *   onSelectTab: (tab: string) => void,
 *   connection: 'connecting' | 'online' | 'offline',
 *   userName: string,
 *   isMockMode: boolean
 * }} props
 */
export function Header({
  activeTab,
  onSelectTab,
  connection,
  userName,
  isMockMode,
}) {
  const status = getConnectionBadge(connection);

  return (
    <header className="bg-white border-b border-slate-200/80">
      {/* Desktop Header */}
      <div className="hidden md:flex max-w-6xl mx-auto px-6 h-[74px] items-center justify-between gap-6">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onSelectTab(NAV_TABS.DASHBOARD)}
          className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7] rounded-lg py-1 pr-2 cursor-pointer"
        >
          <AquaTrioLogo className="w-12 h-10 shrink-0" />
          <div>
            <span className="block text-xl font-bold tracking-tight text-[#0B2545] leading-tight">
              AquaTrio
            </span>
            <span className="block text-xs text-slate-500 font-normal leading-tight mt-0.5">
              Fish Tank Remote Control
            </span>
          </div>
        </button>

        {/* Center Nav */}
        <nav aria-label="Main navigation" className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7] rounded-sm ${
                  isActive
                    ? 'text-[#0E9AA7] font-semibold'
                    : 'text-slate-500 hover:text-[#0B2545]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#0E9AA7]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side Status & User Pill */}
        <div className="flex items-center gap-4 shrink-0">
          <div className={`flex items-center gap-2 text-sm font-medium whitespace-nowrap ${status.desktopTextClass}`}>
            <span
              className={`w-2.5 h-2.5 rounded-full ${status.dotClass}`}
              aria-hidden="true"
            />
            <span>{status.label}</span>
          </div>
          <span className="inline-flex items-center justify-center rounded-full bg-[#F1F5F6] border border-slate-200/70 px-4 py-1.5 text-sm font-medium text-slate-600 whitespace-nowrap">
            {userName}
          </span>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex md:hidden items-start justify-between px-4 pt-3 pb-2.5">
        <div className="flex items-start gap-2.5">
          <AquaTrioLogo className="w-11 h-9 shrink-0 mt-0.5" />
          <div>
            <span className="block text-[20px] font-bold tracking-tight text-[#0B2545] leading-tight">
              AquaTrio
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${status.dotClass}`}
                aria-hidden="true"
              />
              <span className={`text-xs font-medium ${status.textClass}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={() => onSelectTab(NAV_TABS.SETTINGS)}
            aria-label="Open settings"
            className="p-1.5 -mr-1.5 rounded-lg text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E9AA7]"
          >
            <Settings className="w-6 h-6 stroke-[1.8]" />
          </button>
          {isMockMode && (
            <span className="inline-block rounded-full bg-[#E3F2FA] px-2.5 py-0.5 text-[11px] font-medium text-[#0E7490] whitespace-nowrap">
              Sample data
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
