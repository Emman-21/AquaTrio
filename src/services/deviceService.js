import {
  TELEMETRY_INTERVAL_MS,
  TOPICS,
} from '../constants/tank.js';
import {
  calculateFeedAfterDispense,
  computeNextFeedUnix,
} from '../utils/tankLogic.js';
import { createMqttTransport } from './mqttTransport.js';

const rawUseMock =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_USE_MOCK
    : undefined;

export const isMockMode = String(rawUseMock ?? 'false').toLowerCase() === 'true';

/**
 * Creates a Unix timestamp (seconds) for today at a given local hour and minute.
 * @param {number} hour24
 * @param {number} minute
 * @returns {number}
 */
function getTodayUnixAt(hour24, minute) {
  const now = new Date();
  return Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, minute, 0, 0).getTime() /
      1000
  );
}

/**
 * Simulated AquaTrio hardware transport for local development and UI testing.
 */
function createMockTransport() {
  const listeners = new Set();
  let connectTimer = null;
  let telemetryTimer = null;
  let refillFinishTimer = null;
  let connected = false;
  let online = false;
  let failRate = 0.1;
  let fixedDelayMs = null;
  let pinnedTempC = undefined;

  let schedule = {
    feedTimes: [
      { time: '08:00', days: [1, 2, 3, 4, 5, 6, 7], portions: 1 },
      { time: '12:00', days: [1, 2, 3, 4, 5, 6, 7], portions: 1 },
    ],
  };

  /** @type {import('../constants/tank.js').DeviceTelemetry} */
  let telemetry = {
    waterLevel: 'normal',
    waterClarity: 'clear',
    temperature: 26.5,
    feedPercent: 65,
    lastFed: getTodayUnixAt(8, 0),
    lastFedSource: 'schedule',
    nextFeed: getTodayUnixAt(12, 0),
    filter: { running: true, auto: true },
    refill: { active: false, auto: true, fault: null },
    battery: 82,
    batteryVolts: 12.1,
    solarCharging: true,
  };

  function cloneTelemetry() {
    return {
      ...telemetry,
      filter: { ...telemetry.filter },
      refill: { ...telemetry.refill },
    };
  }

  function cloneSchedule() {
    return {
      feedTimes: schedule.feedTimes.map((item) => ({
        ...item,
        days: [...item.days],
      })),
    };
  }

  function emit(topic, payload) {
    listeners.forEach((cb) => {
      try {
        cb({ topic, payload });
      } catch (err) {
        console.error('Device subscriber error:', err);
      }
    });
  }

  function stepTelemetrySimulation() {
    if (!connected || !online) return;

    // Temperature drifts within 25.0–28.0 °C, occasionally null (~8% chance)
    if (pinnedTempC !== undefined) {
      telemetry.temperature = pinnedTempC;
    } else if (Math.random() < 0.08) {
      telemetry.temperature = null;
    } else {
      const base = telemetry.temperature === null ? 26.5 : telemetry.temperature;
      const delta = (Math.random() - 0.5) * 0.6;
      const nextTemp = Math.max(25.0, Math.min(28.0, base + delta));
      telemetry.temperature = Number(nextTemp.toFixed(1));
    }

    // Battery volts gently track battery level
    const voltsBase = 11.6 + (telemetry.battery / 100) * 0.6;
    const voltsJitter = (Math.random() - 0.5) * 0.1;
    telemetry.batteryVolts = Number(Math.max(11.4, Math.min(12.8, voltsBase + voltsJitter)).toFixed(1));

    // Solar charging occasionally toggles
    if (Math.random() < 0.15) {
      telemetry.solarCharging = !telemetry.solarCharging;
    }

    // Occasional refill fault "no_flow" simulation (~4% when idle & no fault)
    if (telemetry.refill.fault === null && !telemetry.refill.active && Math.random() < 0.04) {
      telemetry.refill.fault = 'no_flow';
    }

    emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
  }

  function setOnline(nextOnline) {
    online = Boolean(nextOnline);
    emit(TOPICS.STATUS_ONLINE, online ? 'online' : 'offline');
    if (online && connected) {
      emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
      emit(TOPICS.CMD_SCHEDULE, cloneSchedule());
    }
  }

  function connect() {
    if (connectTimer) clearTimeout(connectTimer);
    if (telemetryTimer) clearInterval(telemetryTimer);

    connected = true;
    online = false;

    return new Promise((resolve) => {
      connectTimer = setTimeout(() => {
        if (!connected) {
          resolve();
          return;
        }
        online = true;
        emit(TOPICS.STATUS_ONLINE, 'online');
        emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
        emit(TOPICS.CMD_SCHEDULE, cloneSchedule());

        telemetryTimer = setInterval(stepTelemetrySimulation, TELEMETRY_INTERVAL_MS);
        resolve();
      }, 450);
    });
  }

  function disconnect() {
    connected = false;
    online = false;
    if (connectTimer) clearTimeout(connectTimer);
    if (telemetryTimer) clearInterval(telemetryTimer);
    if (refillFinishTimer) clearTimeout(refillFinishTimer);
    connectTimer = null;
    telemetryTimer = null;
    refillFinishTimer = null;
  }

  function subscribe(callback) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }

  function sendCommand(name, payload) {
    if (!connected || !online) {
      return Promise.reject(new Error('Device offline'));
    }

    const delayMs =
      fixedDelayMs !== null ? fixedDelayMs : 1000 + Math.floor(Math.random() * 1000);

    // Simulate occasional (~10%) dropped command so caller's 5s timeout fires
    if (Math.random() < failRate) {
      return new Promise(() => {});
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        if (!connected || !online) return;

        switch (name) {
          case TOPICS.CMD_FEED: {
            const portions = Number(payload?.portions) || 1;
            telemetry.feedPercent = calculateFeedAfterDispense(
              telemetry.feedPercent,
              portions
            );
            telemetry.lastFed = Math.floor(Date.now() / 1000);
            telemetry.lastFedSource = 'app';
            emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
            break;
          }

          case TOPICS.CMD_FILTER: {
            const action = payload?.action === 'stop' ? 'stop' : 'start';
            telemetry.filter.running = action === 'start';
            emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
            break;
          }

          case TOPICS.CMD_FILTER_AUTO: {
            telemetry.filter.auto = Boolean(payload?.enabled);
            emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
            break;
          }

          case TOPICS.CMD_REFILL: {
            const action = payload?.action === 'stop' ? 'stop' : 'start';
            if (refillFinishTimer) clearTimeout(refillFinishTimer);

            if (action === 'start') {
              // Occasional "no_flow" fault (~15% chance)
              if (Math.random() < 0.15) {
                telemetry.refill.active = false;
                telemetry.refill.fault = 'no_flow';
                emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
              } else {
                telemetry.refill.active = true;
                telemetry.refill.fault = null;
                telemetry.waterLevel = 'normal';
                emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());

                refillFinishTimer = setTimeout(() => {
                  if (!connected || !online) return;
                  telemetry.refill.active = false;
                  telemetry.waterLevel = 'normal';
                  emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
                }, 2200);
              }
            } else {
              telemetry.refill.active = false;
              emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
            }
            break;
          }

          case TOPICS.CMD_REFILL_AUTO: {
            telemetry.refill.auto = Boolean(payload?.enabled);
            emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
            break;
          }

          case TOPICS.CMD_SCHEDULE: {
            const feedTimes = Array.isArray(payload?.feedTimes)
              ? payload.feedTimes
              : [];
            schedule = {
              feedTimes: feedTimes.map((item) => ({
                time: String(item.time),
                days: Array.isArray(item.days) ? [...item.days] : [1, 2, 3, 4, 5, 6, 7],
                portions: Number(item.portions) || 1,
              })),
            };
            telemetry.nextFeed = computeNextFeedUnix(schedule.feedTimes);
            emit(TOPICS.CMD_SCHEDULE, cloneSchedule());
            emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
            break;
          }

          default:
            break;
        }

        resolve({ ok: true });
      }, delayMs);
    });
  }

  // Expose console & test helpers when running in browser mock mode
  if (typeof window !== 'undefined') {
    window.aquatrioMock = {
      setOnline,
      toggleOnline: () => setOnline(!online),
      isOnline: () => online,
      setFailRate: (rate) => {
        failRate = Math.max(0, Math.min(1, Number(rate)));
      },
      setCommandDelay: (ms) => {
        fixedDelayMs = ms === null ? null : Math.max(0, Number(ms));
      },
      triggerRefillFault: (fault = 'no_flow') => {
        telemetry.refill.fault = fault;
        telemetry.refill.active = false;
        emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
      },
      clearRefillFault: () => {
        telemetry.refill.fault = null;
        emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
      },
      setTemperature: (tempC) => {
        pinnedTempC = tempC === undefined ? undefined : tempC;
        telemetry.temperature = tempC === undefined ? 26.5 : tempC;
        emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
      },
      setWaterLevel: (level) => {
        telemetry.waterLevel = level === 'low' ? 'low' : 'normal';
        emit(TOPICS.STATUS_TELEMETRY, cloneTelemetry());
      },
      getTelemetry: cloneTelemetry,
    };
  }

  return {
    connect,
    disconnect,
    subscribe,
    sendCommand,
  };
}

export const deviceService = isMockMode
  ? createMockTransport()
  : createMqttTransport();
