import React from 'react';
import { Home, Calendar, Settings } from 'lucide-react';
import { NAV_TABS } from '../constants/tank.js';

const TABS = [
  { id: NAV_TABS.DASHBOARD, label: 'Dashboard', Icon: Home },
  { id: NAV_TABS.SCHEDULE, label: 'Schedule', Icon: Calendar },
  { id: NAV_TABS.SETTINGS, label: 'Settings', Icon: Settings },
];

/**
 * Fixed bottom tab bar displayed on mobile viewports.
 * @param {{ activeTab: string, onSelectTab: (tab: string) => void }} props
 */
export function BottomNav({ activeTab, onSelectTab }) {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(11,37,69,0.04)]"
    >
      <div className="grid grid-cols-3 h-[60px]">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0E9AA7] ${
                isActive ? 'text-[#0E9AA7]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2]" />
              <span className="text-[11px] font-medium leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
