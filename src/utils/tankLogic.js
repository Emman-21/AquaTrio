import { TEMP_MIN_SAFE_C, TEMP_MAX_SAFE_C } from '../constants/tank.js';

export { TEMP_MIN_SAFE_C, TEMP_MAX_SAFE_C };

/**
 * Formats a water temperature reading and evaluates whether it is outside the safe 24–29 °C range.
 * @param {number | null} tempCelsius
 * @returns {{ formattedValue: string, isWarning: boolean, warningLabel: string | null }}
 */
export function getTemperatureStatus(tempCelsius) {
  if (tempCelsius === null || tempCelsius === undefined || Number.isNaN(tempCelsius)) {
    return {
      formattedValue: '--',
      isWarning: false,
      warningLabel: null,
    };
  }

  const formattedValue = `${tempCelsius.toFixed(1)} °C`;
  if (tempCelsius < TEMP_MIN_SAFE_C) {
    return {
      formattedValue,
      isWarning: true,
      warningLabel: 'Low temp',
    };
  }
  if (tempCelsius > TEMP_MAX_SAFE_C) {
    return {
      formattedValue,
      isWarning: true,
      warningLabel: 'High temp',
    };
  }

  return {
    formattedValue,
    isWarning: false,
    warningLabel: null,
  };
}

/**
 * Calculates remaining feed percentage after dispensing the given portions, clamped to [0, 100].
 * @param {number} currentPercent
 * @param {number} portions
 * @returns {number}
 */
export function calculateFeedAfterDispense(currentPercent, portions) {
  const decrement = portions * 2;
  return Math.max(0, Math.min(100, currentPercent - decrement));
}

/**
 * Formats a Date into a 12-hour clock string (e.g. "8:00 AM", "12:00 PM").
 * @param {Date} date
 * @returns {string}
 */
export function formatTime12Hour(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${paddedMinutes} ${period}`;
}

/**
 * Formats a Unix timestamp in seconds into a 12-hour clock string (e.g. "8:00 AM"), or "--" if null.
 * @param {number | null | undefined} unixSeconds
 * @returns {string}
 */
export function formatUnixTime12Hour(unixSeconds) {
  if (unixSeconds === null || unixSeconds === undefined || Number.isNaN(unixSeconds)) {
    return '--';
  }
  return formatTime12Hour(new Date(unixSeconds * 1000));
}

/**
 * Formats a 24-hour "HH:mm" schedule time string into a 12-hour display label.
 * @param {string} time24
 * @returns {string}
 */
export function formatScheduleTime24To12(time24) {
  const [hoursStr, minutesStr] = String(time24).split(':');
  const hour24 = Number(hoursStr);
  const minute = Number(minutesStr);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return time24;
  }
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Formats contract waterLevel ("normal" | "low") for display.
 * @param {'normal' | 'low' | string | undefined} level
 * @returns {string}
 */
export function formatWaterLevel(level) {
  if (!level) return '--';
  if (level === 'low') return 'Low';
  if (level === 'normal') return 'Normal';
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Formats contract waterClarity ("clear" | "cloudy" | "dirty") for display.
 * @param {'clear' | 'cloudy' | 'dirty' | string | undefined} clarity
 * @returns {string}
 */
export function formatWaterClarity(clarity) {
  if (!clarity) return '--';
  return clarity.charAt(0).toUpperCase() + clarity.slice(1);
}

/**
 * Returns the next upcoming Unix timestamp (seconds) from a list of schedule feedTimes, or null.
 * @param {Array<{ time: string, days: number[] }>} feedTimes
 * @param {Date} [now]
 * @returns {number | null}
 */
export function computeNextFeedUnix(feedTimes, now = new Date()) {
  if (!Array.isArray(feedTimes) || feedTimes.length === 0) {
    return null;
  }
  let earliestMs = null;

  for (let offsetDays = 0; offsetDays <= 7; offsetDays++) {
    const candidateBase = new Date(now.getTime() + offsetDays * 86400000);
    const jsDay = candidateBase.getDay(); // 0=Sun..6=Sat
    const contractDay = jsDay === 0 ? 7 : jsDay; // 1=Mon..7=Sun

    for (const entry of feedTimes) {
      if (!entry.days || !entry.days.includes(contractDay)) continue;
      const [h, m] = String(entry.time).split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) continue;

      const candidate = new Date(
        candidateBase.getFullYear(),
        candidateBase.getMonth(),
        candidateBase.getDate(),
        h,
        m,
        0,
        0
      );
      if (candidate.getTime() > now.getTime()) {
        if (earliestMs === null || candidate.getTime() < earliestMs) {
          earliestMs = candidate.getTime();
        }
      }
    }
    if (earliestMs !== null) break;
  }

  return earliestMs !== null ? Math.floor(earliestMs / 1000) : null;
}

/**
 * Formats an array of contract weekday integers (1=Mon..7=Sun) as "Daily" or "Mon, Wed, Fri".
 * @param {number[]} days
 * @returns {string}
 */
export function formatScheduleDays(days) {
  if (!Array.isArray(days) || days.length === 0) {
    return 'No days';
  }
  const uniqueSorted = [...new Set(days.map(Number).filter((d) => d >= 1 && d <= 7))].sort(
    (a, b) => a - b
  );
  if (uniqueSorted.length === 7) {
    return 'Daily';
  }
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return uniqueSorted.map((d) => names[d - 1]).join(', ');
}

/**
 * Normalizes schedule entries to match the device contract:
 * time as 24-hour "HH:MM", days as sorted unique integers 1-7, portions as integer 1-5.
 * @param {Array<{ time: string, days: number[], portions: number }>} feedTimes
 * @returns {Array<{ time: string, days: number[], portions: number }>}
 */
export function normalizeScheduleFeedTimes(feedTimes) {
  if (!Array.isArray(feedTimes)) return [];
  return feedTimes.map((entry) => {
    const [rawH = '0', rawM = '0'] = String(entry?.time ?? '08:00').split(':');
    const hour = Math.max(0, Math.min(23, Math.trunc(Number(rawH) || 0)));
    const minute = Math.max(0, Math.min(59, Math.trunc(Number(rawM) || 0)));
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    const rawDays = Array.isArray(entry?.days) ? entry.days : [1, 2, 3, 4, 5, 6, 7];
    const days = [
      ...new Set(
        rawDays
          .map((d) => Math.trunc(Number(d)))
          .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7)
      ),
    ].sort((a, b) => a - b);

    const portions = Math.max(
      1,
      Math.min(5, Math.trunc(Number(entry?.portions) || 1))
    );

    return {
      time,
      days: days.length > 0 ? days : [1, 2, 3, 4, 5, 6, 7],
      portions,
    };
  });
}

/**
 * Returns a human-readable portion label.
 * @param {number} portions
 * @returns {string}
 */
export function getPortionLabel(portions) {
  return portions === 1 ? '1 portion' : `${portions} portions`;
}

/**
 * Returns the semantic hex fill color for a battery percentage.
 * @param {number} percent
 * @returns {string}
 */
export function getBatteryFillColor(percent) {
  if (percent >= 50) return '#22C55E';
  if (percent >= 20) return '#F59E0B';
  return '#EF4444';
}

const VALID_WATER_LEVELS = new Set(['normal', 'low']);
const VALID_WATER_CLARITIES = new Set(['clear', 'cloudy', 'dirty']);
const VALID_LAST_FED_SOURCES = new Set(['app', 'button', 'schedule']);
const VALID_REFILL_FAULTS = new Set([null, 'no_flow', 'timeout']);

const BASE_TELEMETRY = {
  waterLevel: 'normal',
  waterClarity: 'clear',
  temperature: null,
  feedPercent: 0,
  lastFed: null,
  lastFedSource: 'schedule',
  nextFeed: null,
  filter: { running: false, auto: false },
  refill: { active: false, auto: false, fault: null },
  battery: 0,
  batteryVolts: 0,
  solarCharging: false,
};

/**
 * Parses a raw JSON string or object into a plain object, returning null if malformed or non-object.
 * @param {unknown} rawInput
 * @returns {Record<string, unknown> | null}
 */
function parsePlainObject(rawInput) {
  let parsed = rawInput;
  if (typeof rawInput === 'string') {
    try {
      parsed = JSON.parse(rawInput);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * Validates and sanitizes an incoming MQTT telemetry payload against Device Contract v2.
 * Returns null for malformed JSON or non-object payloads; otherwise merges valid fields onto previous telemetry.
 * @param {unknown} rawInput
 * @param {import('../constants/tank.js').DeviceTelemetry | null} [prevTelemetry]
 * @returns {import('../constants/tank.js').DeviceTelemetry | null}
 */
export function sanitizeTelemetryPayload(rawInput, prevTelemetry = null) {
  const parsed = parsePlainObject(rawInput);
  if (!parsed) return null;

  const prev = prevTelemetry ?? BASE_TELEMETRY;
  const prevFilter = prev.filter ?? BASE_TELEMETRY.filter;
  const prevRefill = prev.refill ?? BASE_TELEMETRY.refill;

  const waterLevel = VALID_WATER_LEVELS.has(parsed.waterLevel)
    ? parsed.waterLevel
    : prev.waterLevel;

  const waterClarity = VALID_WATER_CLARITIES.has(parsed.waterClarity)
    ? parsed.waterClarity
    : prev.waterClarity;

  let temperature = prev.temperature;
  if ('temperature' in parsed) {
    temperature =
      typeof parsed.temperature === 'number' && Number.isFinite(parsed.temperature)
        ? parsed.temperature
        : null;
  }

  const feedPercent =
    typeof parsed.feedPercent === 'number' && Number.isFinite(parsed.feedPercent)
      ? Math.max(0, Math.min(100, parsed.feedPercent))
      : prev.feedPercent;

  let lastFed = prev.lastFed;
  if ('lastFed' in parsed) {
    if (parsed.lastFed === null) {
      lastFed = null;
    } else if (
      typeof parsed.lastFed === 'number' &&
      Number.isFinite(parsed.lastFed) &&
      parsed.lastFed >= 0
    ) {
      lastFed = parsed.lastFed;
    }
  }

  const lastFedSource = VALID_LAST_FED_SOURCES.has(parsed.lastFedSource)
    ? parsed.lastFedSource
    : prev.lastFedSource;

  let nextFeed = prev.nextFeed;
  if ('nextFeed' in parsed) {
    if (parsed.nextFeed === null) {
      nextFeed = null;
    } else if (
      typeof parsed.nextFeed === 'number' &&
      Number.isFinite(parsed.nextFeed) &&
      parsed.nextFeed >= 0
    ) {
      nextFeed = parsed.nextFeed;
    }
  }

  const rawFilter =
    parsed.filter && typeof parsed.filter === 'object' && !Array.isArray(parsed.filter)
      ? parsed.filter
      : {};
  const filter = {
    running:
      typeof rawFilter.running === 'boolean' ? rawFilter.running : prevFilter.running,
    auto: typeof rawFilter.auto === 'boolean' ? rawFilter.auto : prevFilter.auto,
  };

  const rawRefill =
    parsed.refill && typeof parsed.refill === 'object' && !Array.isArray(parsed.refill)
      ? parsed.refill
      : {};
  const refill = {
    active:
      typeof rawRefill.active === 'boolean' ? rawRefill.active : prevRefill.active,
    auto: typeof rawRefill.auto === 'boolean' ? rawRefill.auto : prevRefill.auto,
    fault: VALID_REFILL_FAULTS.has(rawRefill.fault)
      ? rawRefill.fault
      : prevRefill.fault,
  };

  const battery =
    typeof parsed.battery === 'number' && Number.isFinite(parsed.battery)
      ? Math.max(0, Math.min(100, parsed.battery))
      : prev.battery;

  const batteryVolts =
    typeof parsed.batteryVolts === 'number' &&
    Number.isFinite(parsed.batteryVolts) &&
    parsed.batteryVolts >= 0
      ? parsed.batteryVolts
      : prev.batteryVolts;

  const solarCharging =
    typeof parsed.solarCharging === 'boolean'
      ? parsed.solarCharging
      : prev.solarCharging;

  return {
    waterLevel,
    waterClarity,
    temperature,
    feedPercent,
    lastFed,
    lastFedSource,
    nextFeed,
    filter,
    refill,
    battery,
    batteryVolts,
    solarCharging,
  };
}

/**
 * Validates and sanitizes an incoming MQTT retained schedule payload.
 * Returns null for malformed JSON or payloads without a feedTimes array.
 * @param {unknown} rawInput
 * @returns {import('../constants/tank.js').DeviceSchedule | null}
 */
export function sanitizeSchedulePayload(rawInput) {
  const parsed = parsePlainObject(rawInput);
  if (!parsed || !Array.isArray(parsed.feedTimes)) {
    return null;
  }

  const validItems = parsed.feedTimes.filter(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      !Array.isArray(entry) &&
      typeof entry.time === 'string' &&
      /^\d{1,2}:\d{1,2}$/.test(entry.time.trim())
  );

  return {
    feedTimes: normalizeScheduleFeedTimes(validItems),
  };
}

