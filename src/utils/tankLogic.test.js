import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTemperatureStatus,
  calculateFeedAfterDispense,
  formatTime12Hour,
  formatUnixTime12Hour,
  formatScheduleTime24To12,
  formatWaterLevel,
  formatWaterClarity,
  computeNextFeedUnix,
  formatScheduleDays,
  normalizeScheduleFeedTimes,
  getPortionLabel,
  getBatteryFillColor,
  sanitizeTelemetryPayload,
  sanitizeSchedulePayload,
} from './tankLogic.js';

test('getTemperatureStatus formats normal temperature without warning', () => {
  const status = getTemperatureStatus(26.5);
  assert.equal(status.formattedValue, '26.5 °C');
  assert.equal(status.isWarning, false);
  assert.equal(status.warningLabel, null);
});

test('getTemperatureStatus triggers warning below 24 C and above 29 C', () => {
  const low = getTemperatureStatus(23.9);
  assert.equal(low.formattedValue, '23.9 °C');
  assert.equal(low.isWarning, true);
  assert.equal(low.warningLabel, 'Low temp');

  const high = getTemperatureStatus(29.1);
  assert.equal(high.formattedValue, '29.1 °C');
  assert.equal(high.isWarning, true);
  assert.equal(high.warningLabel, 'High temp');

  assert.equal(getTemperatureStatus(24).isWarning, false);
  assert.equal(getTemperatureStatus(29).isWarning, false);
});

test('getTemperatureStatus returns -- when null', () => {
  const status = getTemperatureStatus(null);
  assert.equal(status.formattedValue, '--');
  assert.equal(status.isWarning, false);
  assert.equal(status.warningLabel, null);
});

test('calculateFeedAfterDispense reduces feed percentage and clamps at 0', () => {
  assert.equal(calculateFeedAfterDispense(65, 1), 63);
  assert.equal(calculateFeedAfterDispense(65, 3), 59);
  assert.equal(calculateFeedAfterDispense(3, 3), 0);
});

test('formatTime12Hour and formatUnixTime12Hour format times cleanly', () => {
  assert.equal(formatTime12Hour(new Date(2026, 0, 1, 8, 0)), '8:00 AM');
  assert.equal(formatTime12Hour(new Date(2026, 0, 1, 12, 0)), '12:00 PM');
  assert.equal(formatTime12Hour(new Date(2026, 0, 1, 0, 5)), '12:05 AM');
  assert.equal(formatTime12Hour(new Date(2026, 0, 1, 17, 30)), '5:30 PM');
  assert.equal(formatUnixTime12Hour(null), '--');
  assert.equal(formatScheduleTime24To12('08:00'), '8:00 AM');
  assert.equal(formatScheduleTime24To12('12:00'), '12:00 PM');
  assert.equal(formatScheduleTime24To12('18:30'), '6:30 PM');
});

test('formatWaterLevel, formatWaterClarity, and computeNextFeedUnix behave per contract', () => {
  assert.equal(formatWaterLevel('normal'), 'Normal');
  assert.equal(formatWaterLevel('low'), 'Low');
  assert.equal(formatWaterClarity('clear'), 'Clear');
  assert.equal(formatWaterClarity('cloudy'), 'Cloudy');
  assert.equal(formatWaterClarity('dirty'), 'Dirty');

  const now = new Date(2026, 10, 13, 9, 0, 0); // 9:00 AM
  const next = computeNextFeedUnix(
    [
      { time: '08:00', days: [1, 2, 3, 4, 5, 6, 7], portions: 1 },
      { time: '12:00', days: [1, 2, 3, 4, 5, 6, 7], portions: 1 },
    ],
    now
  );
  assert.equal(formatUnixTime12Hour(next), '12:00 PM');
  assert.equal(computeNextFeedUnix([], now), null);
});

test('formatScheduleDays and normalizeScheduleFeedTimes enforce contract shape', () => {
  assert.equal(formatScheduleDays([1, 2, 3, 4, 5, 6, 7]), 'Daily');
  assert.equal(formatScheduleDays([1, 3, 5]), 'Mon, Wed, Fri');
  assert.equal(formatScheduleDays([7, 2]), 'Tue, Sun');

  const normalized = normalizeScheduleFeedTimes([
    { time: '8:5', days: [5, 1, 3, 1, 9], portions: 7 },
    { time: '18:00', days: [1, 2, 3, 4, 5, 6, 7], portions: 4 },
  ]);
  assert.deepEqual(normalized, [
    { time: '08:05', days: [1, 3, 5], portions: 5 },
    { time: '18:00', days: [1, 2, 3, 4, 5, 6, 7], portions: 4 },
  ]);
});

test('getPortionLabel and getBatteryFillColor return expected labels and semantic colors', () => {
  assert.equal(getPortionLabel(1), '1 portion');
  assert.equal(getPortionLabel(2), '2 portions');
  assert.equal(getBatteryFillColor(82), '#22C55E');
  assert.equal(getBatteryFillColor(35), '#F59E0B');
  assert.equal(getBatteryFillColor(10), '#EF4444');
});

test('sanitizeTelemetryPayload ignores malformed payloads, validates types/enums, clamps percents, and falls back cleanly', () => {
  assert.equal(sanitizeTelemetryPayload('{bad json'), null);
  assert.equal(sanitizeTelemetryPayload('null'), null);
  assert.equal(sanitizeTelemetryPayload('[1,2,3]'), null);

  const initial = sanitizeTelemetryPayload(
    JSON.stringify({
      waterLevel: 'normal',
      waterClarity: 'clear',
      temperature: 26.5,
      feedPercent: 120,
      lastFed: 1731571200,
      lastFedSource: 'schedule',
      nextFeed: 1731600000,
      filter: { running: true, auto: true },
      refill: { active: false, auto: true, fault: null },
      battery: -10,
      batteryVolts: 12.1,
      solarCharging: true,
    })
  );

  assert.equal(initial.feedPercent, 100);
  assert.equal(initial.battery, 0);
  assert.equal(initial.temperature, 26.5);

  const partialBad = sanitizeTelemetryPayload(
    JSON.stringify({
      waterLevel: 'flooded',
      waterClarity: 'neon',
      temperature: '27.2',
      lastFedSource: 'voice',
      filter: 'invalid',
      refill: { active: true, fault: 'unknown_fault' },
    }),
    initial
  );

  assert.equal(partialBad.waterLevel, 'normal');
  assert.equal(partialBad.waterClarity, 'clear');
  assert.equal(partialBad.temperature, null);
  assert.equal(partialBad.lastFedSource, 'schedule');
  assert.deepEqual(partialBad.filter, { running: true, auto: true });
  assert.deepEqual(partialBad.refill, { active: true, auto: true, fault: null });
  assert.equal(partialBad.batteryVolts, 12.1);
});

test('sanitizeSchedulePayload ignores invalid JSON and normalizes retained feedTimes', () => {
  assert.equal(sanitizeSchedulePayload('{invalid'), null);
  assert.equal(sanitizeSchedulePayload(JSON.stringify({ feedTimes: 'nope' })), null);

  const parsed = sanitizeSchedulePayload(
    JSON.stringify({
      feedTimes: [
        { time: '8:0', days: [1, 3, 5], portions: 2 },
        { bad: true },
      ],
    })
  );
  assert.deepEqual(parsed, {
    feedTimes: [{ time: '08:00', days: [1, 3, 5], portions: 2 }],
  });
});

