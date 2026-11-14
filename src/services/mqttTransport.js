import mqtt from 'mqtt';
import { TOPICS } from '../constants/tank.js';
import {
  sanitizeSchedulePayload,
  sanitizeTelemetryPayload,
} from '../utils/tankLogic.js';

const DEFAULT_MQTT_URL = 'wss://g12d8801.ala.asia-southeast1.emqxsl.com:8084/mqtt';
const DEFAULT_MQTT_USER = 'aquatrio_web';
const DEFAULT_DEVICE_ID = 'tank01';

const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;

/**
 * Reads MQTT connection config from Vite environment variables with non-secret fallbacks.
 * @returns {{ url: string, username: string, password: string, deviceId: string }}
 */
export function getMqttConfig() {
  const hasEnv = typeof import.meta !== 'undefined' && Boolean(import.meta.env);
  const rawUrl = hasEnv ? import.meta.env.VITE_MQTT_URL : undefined;
  const rawUser = hasEnv ? import.meta.env.VITE_MQTT_USER : undefined;
  const rawPass = hasEnv ? import.meta.env.VITE_MQTT_PASS : undefined;
  const rawDeviceId = hasEnv ? import.meta.env.VITE_DEVICE_ID : undefined;

  return {
    url: (rawUrl && String(rawUrl).trim()) || DEFAULT_MQTT_URL,
    username: (rawUser && String(rawUser).trim()) || DEFAULT_MQTT_USER,
    password: rawPass ? String(rawPass) : '',
    deviceId: (rawDeviceId && String(rawDeviceId).trim()) || DEFAULT_DEVICE_ID,
  };
}

/**
 * Generates a unique per-tab MQTT clientId.
 * @returns {string}
 */
export function generateClientId() {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `aquatrio-web-${rand}`;
}

/**
 * Creates a real MQTT-over-WSS device transport matching the mock transport interface.
 * @param {{
 *   connectFn?: typeof mqtt.connect,
 *   config?: { url: string, username: string, password: string, deviceId: string },
 *   doc?: Document | null,
 *   randomClientIdFn?: () => string
 * }} [options]
 */
export function createMqttTransport(options = {}) {
  const connectFn = options.connectFn ?? mqtt.connect;
  const doc =
    options.doc !== undefined
      ? options.doc
      : typeof document !== 'undefined'
      ? document
      : null;
  const randomClientIdFn = options.randomClientIdFn ?? generateClientId;

  const listeners = new Set();
  let client = null;
  let disposed = false;
  let hasConnectedOnce = false;
  let brokerConnected = false;
  let deviceOnline = false;
  let isConnecting = false;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let lastTelemetry = null;
  let activePrefix = `aquatrio/${DEFAULT_DEVICE_ID}/`;

  function emit(topic, payload) {
    listeners.forEach((cb) => {
      try {
        cb({ topic, payload });
      } catch (err) {
        console.error('Device subscriber error:', err);
      }
    });
  }

  function emitConnectionState() {
    if (!hasConnectedOnce) {
      emit(TOPICS.STATUS_ONLINE, 'connecting');
      return;
    }
    const isOnline = brokerConnected && deviceOnline;
    emit(TOPICS.STATUS_ONLINE, isOnline ? 'online' : 'offline');
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function cleanupClient() {
    if (!client) return;
    try {
      client.removeAllListeners?.();
      client.end?.(true);
    } catch {
      // Ignore teardown errors
    }
    client = null;
  }

  function triggerReconnect() {
    if (disposed || !client || brokerConnected || isConnecting) return;
    isConnecting = true;
    try {
      client.reconnect();
    } catch {
      isConnecting = false;
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (disposed || reconnectTimer || brokerConnected || isConnecting) return;
    const delayMs = Math.min(
      BACKOFF_MAX_MS,
      BACKOFF_BASE_MS * Math.pow(2, reconnectAttempt)
    );
    reconnectAttempt = Math.min(reconnectAttempt + 1, 10);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      triggerReconnect();
    }, delayMs);
  }

  function handleVisibilityChange() {
    if (doc?.visibilityState === 'visible' && !disposed && client && !brokerConnected) {
      clearReconnectTimer();
      triggerReconnect();
    }
  }

  function topicFor(subtopic) {
    return `${activePrefix}${subtopic}`;
  }

  function handleIncomingMessage(fullTopic, rawMessage) {
    if (!fullTopic.startsWith(activePrefix)) return;
    const subtopic = fullTopic.slice(activePrefix.length);
    const rawText =
      typeof rawMessage === 'string'
        ? rawMessage
        : rawMessage?.toString?.('utf8') ?? '';

    if (subtopic === TOPICS.STATUS_ONLINE) {
      deviceOnline = rawText.trim().toLowerCase() === 'online';
      emitConnectionState();
      return;
    }

    if (subtopic === TOPICS.STATUS_TELEMETRY) {
      const sanitized = sanitizeTelemetryPayload(rawText, lastTelemetry);
      if (sanitized) {
        lastTelemetry = sanitized;
        emit(TOPICS.STATUS_TELEMETRY, sanitized);
      }
      return;
    }

    if (subtopic === TOPICS.CMD_SCHEDULE) {
      const sanitizedSchedule = sanitizeSchedulePayload(rawText);
      if (sanitizedSchedule) {
        emit(TOPICS.CMD_SCHEDULE, sanitizedSchedule);
      }
    }
  }

  function connect() {
    const config = options.config ?? getMqttConfig();
    activePrefix = `aquatrio/${config.deviceId}/`;

    clearReconnectTimer();
    cleanupClient();
    doc?.removeEventListener?.('visibilitychange', handleVisibilityChange);

    disposed = false;
    hasConnectedOnce = false;
    brokerConnected = false;
    deviceOnline = false;
    isConnecting = false;
    reconnectAttempt = 0;

    if (!config.password) {
      emit(TOPICS.STATUS_ONLINE, 'offline');
      emit('status/error', 'MQTT password not configured');
      return Promise.resolve();
    }

    emit(TOPICS.STATUS_ONLINE, 'connecting');
    doc?.addEventListener?.('visibilitychange', handleVisibilityChange);
    isConnecting = true;

    const clientId = randomClientIdFn();
    client = connectFn(config.url, {
      clientId,
      username: config.username,
      password: config.password,
      clean: true,
      reconnectPeriod: 0,
      connectTimeout: 10000,
      keepalive: 30,
      resubscribe: false,
    });

    client.on('connect', () => {
      if (disposed) return;
      clearReconnectTimer();
      isConnecting = false;
      hasConnectedOnce = true;
      brokerConnected = true;
      reconnectAttempt = 0;

      const subscribeTopics = [
        topicFor(TOPICS.STATUS_TELEMETRY),
        topicFor(TOPICS.STATUS_ONLINE),
        topicFor(TOPICS.CMD_SCHEDULE),
      ];
      client.subscribe(subscribeTopics, { qos: 1 }, (err) => {
        if (err) {
          console.error('MQTT subscribe error:', err);
        }
      });

      emitConnectionState();
    });

    client.on('message', handleIncomingMessage);

    const handleDisconnect = () => {
      isConnecting = false;
      brokerConnected = false;
      if (!disposed) {
        emitConnectionState();
        scheduleReconnect();
      }
    };

    client.on('close', handleDisconnect);
    client.on('offline', handleDisconnect);
    client.on('end', () => {
      isConnecting = false;
      brokerConnected = false;
    });

    client.on('error', (err) => {
      isConnecting = false;
      console.warn('MQTT client error:', err?.message || err);
      const msg = String(err?.message || '');
      if (
        err?.code === 4 ||
        err?.code === 5 ||
        /not authorized|bad username|bad user name|unauthorized/i.test(msg)
      ) {
        hasConnectedOnce = true;
        brokerConnected = false;
        emitConnectionState();
        emit('status/error', 'MQTT authentication failed');
      }
      if (!disposed && !brokerConnected) {
        scheduleReconnect();
      }
    });

    return Promise.resolve();
  }

  function disconnect() {
    disposed = true;
    brokerConnected = false;
    isConnecting = false;
    clearReconnectTimer();
    doc?.removeEventListener?.('visibilitychange', handleVisibilityChange);
    cleanupClient();
  }

  function subscribe(callback) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }

  function sendCommand(name, payload) {
    if (!client || !brokerConnected) {
      return Promise.reject(new Error('Device offline'));
    }

    const fullTopic = topicFor(name);
    const retain = name === TOPICS.CMD_SCHEDULE;
    const message = JSON.stringify(payload ?? {});

    return new Promise((resolve, reject) => {
      client.publish(fullTopic, message, { qos: 1, retain }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ ok: true });
        }
      });
    });
  }

  return {
    connect,
    disconnect,
    subscribe,
    sendCommand,
  };
}
