import React from 'react';

export function AquaTrioLogo({ className = 'w-11 h-9' }) {
  return (
    <svg
      viewBox="0 0 64 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Bubbles */}
      <circle cx="14" cy="11" r="2.2" fill="#38BDF8" />
      <circle cx="9" cy="18" r="1.5" fill="#0E9AA7" />
      <circle cx="19" cy="7" r="1.3" fill="#7DD3FC" />
      {/* Fish body */}
      <path
        d="M47 22C42 14.5 31 12 22 16.5C19 18 16.5 20.2 15 22C16.5 24 19 26.2 22 27.5C31 31.8 42 29.5 47 22Z"
        fill="#E0F4F8"
        stroke="#0B5E78"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Fish tail */}
      <path
        d="M46.5 22L56 15.5C57 18.5 57 25.5 56 28.5L46.5 22Z"
        fill="#38BDF8"
        stroke="#0B5E78"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Top fin */}
      <path
        d="M29 14.5C31 10.5 36 10 38.5 14"
        stroke="#0B5E78"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Eye */}
      <circle cx="24" cy="21" r="2" fill="#0B2545" />
      {/* Waves */}
      <path
        d="M6 34.5C12 31.5 18 37.5 24 34.5C30 31.5 36 37.5 42 34.5C48 31.5 54 37.5 58 34.5"
        stroke="#0E9AA7"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M10 40.5C16 38 21 43 27 40.5C33 38 38 43 44 40.5C49 38 53 41.5 56 40.5"
        stroke="#38BDF8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PelletsIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11.5" cy="7.5" r="2.1" fill="#A06D43" />
      <circle cx="16.5" cy="11.5" r="1.9" fill="#8C5B34" />
      <circle cx="9" cy="13.5" r="2.2" fill="#9A673D" />
      <circle cx="13.5" cy="17.2" r="2.1" fill="#A06D43" />
    </svg>
  );
}

export function FeedingBowlIcon({ className = 'w-7 h-7' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Food mound */}
      <circle cx="12.5" cy="13.5" r="2.2" fill="#9A673D" />
      <circle cx="16" cy="11.5" r="2.3" fill="#85542E" />
      <circle cx="19.5" cy="13.5" r="2.2" fill="#9A673D" />
      <circle cx="14.2" cy="15.2" r="2.2" fill="#B07A4E" />
      <circle cx="17.8" cy="15.2" r="2.2" fill="#8C5B34" />
      {/* Bowl */}
      <path
        d="M6.5 16.5H25.5L23.5 23.5C23.2 24.4 22.4 25 21.5 25H10.5C9.6 25 8.8 24.4 8.5 23.5L6.5 16.5Z"
        fill="#0E9AA7"
      />
      <rect x="5.5" y="15" width="21" height="3" rx="1.5" fill="#17B2C0" />
    </svg>
  );
}

export function FilterCartridgeIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M11 4.5H17M14 4.5V8M9 8H19C19.8 8 20.5 8.7 20.5 9.5V11.5H7.5V9.5C7.5 8.7 8.2 8 9 8Z"
        stroke="#0B3B60"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="8.5"
        y="11.5"
        width="11"
        height="9"
        rx="1.5"
        fill="#D6ECFA"
        stroke="#0B3B60"
        strokeWidth="2"
      />
      <path
        d="M11.5 20.5V23.5H16.5V20.5"
        stroke="#0B3B60"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.5 14.5H16.5M11.5 17.5H16.5" stroke="#0E9AA7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function RefillWaterIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 4.5C14 4.5 8.5 11.1 8.5 15C8.5 18.04 10.96 20.5 14 20.5C17.04 20.5 19.5 18.04 19.5 15C19.5 11.1 14 4.5 14 4.5Z"
        fill="#BAE6FD"
        stroke="#0284C7"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 23.2C8.8 21.8 11.2 24.4 13.8 23.2C16.4 22 18.8 24.4 21.5 23.2"
        stroke="#0E9AA7"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Battery level indicator graphic with attached positive terminal cap.
 * @param {{ percent: number, fillColor: string, compact?: boolean }} props
 */
export function BatteryGraphic({ percent, fillColor, compact = false }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="inline-flex items-center" aria-hidden="true">
      <div
        className={`relative rounded-md border-2 border-[#1E293B] bg-white p-0.5 flex items-center ${
          compact ? 'w-14 h-7' : 'w-20 h-9'
        }`}
      >
        <div
          className="h-full rounded-[3px] transition-all duration-300"
          style={{
            width: `${clamped}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
      <div
        className={`rounded-r-sm bg-[#1E293B] ${compact ? 'w-1 h-3' : 'w-1.5 h-4'}`}
      />
    </div>
  );
}
