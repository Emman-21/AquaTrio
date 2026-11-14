/**
 * @typedef {'normal' | 'low'} WaterLevel
 * @typedef {'clear' | 'cloudy' | 'dirty'} WaterClarity
 * @typedef {'app' | 'button' | 'schedule'} LastFedSource
 * @typedef {'no_flow' | 'timeout' | null} RefillFault
 * @typedef {'connecting' | 'online' | 'offline'} ConnectionStatus
 *
 * @typedef {Object} FilterTelemetry
 * @property {boolean} running
 * @property {boolean} auto
 *
 * @typedef {Object} RefillTelemetry
 * @property {boolean} active
 * @property {boolean} auto
 * @property {RefillFault} fault
 *
 * @typedef {Object} DeviceTelemetry
 * @property {WaterLevel} waterLevel
 * @property {WaterClarity} waterClarity
 * @property {number | null} temperature - Water temperature in °C, or null on sensor fault.
 * @property {number} feedPercent - Remaining feed percentage (0–100).
 * @property {number} lastFed - Unix timestamp in seconds (UTC) of last feeding.
 * @property {LastFedSource} lastFedSource - Origin of the last feeding event.
 * @property {number | null} nextFeed - Unix timestamp in seconds (UTC) of next scheduled feeding, or null.
 * @property {FilterTelemetry} filter
 * @property {RefillTelemetry} refill
 * @property {number} battery - Battery charge percentage (0–100).
 * @property {number} batteryVolts - Battery voltage in volts.
 * @property {boolean} solarCharging
 *
 * @typedef {Object} ScheduleFeedTime
 * @property {string} time - 24-hour local time ("HH:mm", UTC+8).
 * @property {number[]} days - Active weekdays, 1=Mon ... 7=Sun.
 * @property {number} portions - Portions to dispense (1, 2, or 3).
 *
 * @typedef {Object} DeviceSchedule
 * @property {ScheduleFeedTime[]} feedTimes
 *
 * @typedef {Object} PendingCommands
 * @property {boolean} feed
 * @property {boolean} filter
 * @property {boolean} filterAuto
 * @property {boolean} refill
 * @property {boolean} refillAuto
 * @property {boolean} schedule
 */

/**
 * Top-level navigation tab identifiers.
 */
export const NAV_TABS = {
  DASHBOARD: 'dashboard',
  SCHEDULE: 'schedule',
  SETTINGS: 'settings',
};

/**
 * Available feeding portion counts for quick feed and schedules.
 */
export const PORTION_OPTIONS = [1, 2, 3];
export const SCHEDULE_PORTION_OPTIONS = [1, 2, 3, 4, 5];

/**
 * Contract weekdays ordered 1=Mon through 7=Sun.
 */
export const WEEKDAYS = [
  { value: 1, short: 'Mon', full: 'Monday' },
  { value: 2, short: 'Tue', full: 'Tuesday' },
  { value: 3, short: 'Wed', full: 'Wednesday' },
  { value: 4, short: 'Thu', full: 'Thursday' },
  { value: 5, short: 'Fri', full: 'Friday' },
  { value: 6, short: 'Sat', full: 'Saturday' },
  { value: 7, short: 'Sun', full: 'Sunday' },
];

/**
 * Safe water temperature bounds in degrees Celsius.
 */
export const TEMP_MIN_SAFE_C = 24;
export const TEMP_MAX_SAFE_C = 29;

/**
 * Device communication contract constants.
 */
export const DEVICE_TOPIC_PREFIX = 'aquatrio/{deviceId}/';
export const COMMAND_TIMEOUT_MS = 5000;
export const TELEMETRY_INTERVAL_MS = 5000;

/**
 * Contract topic names.
 */
export const TOPICS = {
  STATUS_TELEMETRY: 'status/telemetry',
  STATUS_ONLINE: 'status/online',
  CMD_FEED: 'cmd/feed',
  CMD_FILTER: 'cmd/filter',
  CMD_FILTER_AUTO: 'cmd/filter/auto',
  CMD_REFILL: 'cmd/refill',
  CMD_REFILL_AUTO: 'cmd/refill/auto',
  CMD_SCHEDULE: 'cmd/schedule',
};
