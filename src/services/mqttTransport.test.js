import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createMqttTransport } from './mqttTransport.js';
import { TOPICS } from '../constants/tank.js';

function createFakeDoc() {
  const listeners = new Map();
  return {
    visibilityState: 'visible',
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type) {
      listeners.get(type)?.forEach((fn) => fn());
    },
    listenerCount(type) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

function createFakeClient() {
  const emitter = new EventEmitter();
  emitter.subscriptions = [];
  emitter.published = [];
  emitter.reconnectCount = 0;
  emitter.ended = false;

  emitter.subscribe = (topics, opts, cb) => {
    emitter.subscriptions.push({ topics, opts });
    cb?.(null);
  };
  emitter.publish = (topic, message, opts, cb) => {
    emitter.published.push({ topic, message, opts });
    cb?.(null);
  };
  emitter.reconnect = () => {
    emitter.reconnectCount += 1;
  };
  emitter.end = () => {
    emitter.ended = true;
  };
  return emitter;
}

test('mqttTransport emits offline + clear error when VITE_MQTT_PASS is missing', async () => {
  let connectCalled = false;
  const events = [];
  const transport = createMqttTransport({
    connectFn: () => {
      connectCalled = true;
      return createFakeClient();
    },
    config: {
      url: 'wss://example.com:8084/mqtt',
      username: 'aquatrio_web',
      password: '',
      deviceId: 'tank01',
    },
    doc: createFakeDoc(),
  });

  transport.subscribe((evt) => events.push(evt));
  await transport.connect();

  assert.equal(connectCalled, false);
  assert.deepEqual(events, [
    { topic: TOPICS.STATUS_ONLINE, payload: 'offline' },
    { topic: 'status/error', payload: 'MQTT password not configured' },
  ]);
});

test('mqttTransport subscribes QoS 1, tracks online state, publishes retain flags correctly, and cleans up', async () => {
  const fakeClient = createFakeClient();
  const fakeDoc = createFakeDoc();
  let capturedUrl = null;
  let capturedOpts = null;
  const events = [];

  const transport = createMqttTransport({
    connectFn: (url, opts) => {
      capturedUrl = url;
      capturedOpts = opts;
      return fakeClient;
    },
    config: {
      url: 'wss://broker.test:8084/mqtt',
      username: 'aquatrio_web',
      password: 'secret-value',
      deviceId: 'tank01',
    },
    doc: fakeDoc,
    randomClientIdFn: () => 'aquatrio-web-abc123',
  });

  transport.subscribe((evt) => events.push(evt));
  await transport.connect();

  assert.equal(capturedUrl, 'wss://broker.test:8084/mqtt');
  assert.equal(capturedOpts.clientId, 'aquatrio-web-abc123');
  assert.equal(capturedOpts.username, 'aquatrio_web');
  assert.equal(capturedOpts.password, 'secret-value');
  assert.equal(events.at(-1).payload, 'connecting');

  // Connect event -> subscribes QoS 1 and emits offline until status/online arrives
  fakeClient.emit('connect');
  assert.deepEqual(fakeClient.subscriptions[0], {
    topics: [
      'aquatrio/tank01/status/telemetry',
      'aquatrio/tank01/status/online',
      'aquatrio/tank01/cmd/schedule',
    ],
    opts: { qos: 1 },
  });
  assert.equal(events.at(-1).payload, 'offline');

  // Retained status/online = "online" -> becomes online
  fakeClient.emit('message', 'aquatrio/tank01/status/online', Buffer.from('online'));
  assert.equal(events.at(-1).payload, 'online');

  // Publish feed (not retained) vs schedule (retained)
  await transport.sendCommand(TOPICS.CMD_FEED, { portions: 2 });
  await transport.sendCommand(TOPICS.CMD_SCHEDULE, {
    feedTimes: [{ time: '18:00', days: [1, 3, 5], portions: 2 }],
  });

  assert.deepEqual(fakeClient.published[0], {
    topic: 'aquatrio/tank01/cmd/feed',
    message: '{"portions":2}',
    opts: { qos: 1, retain: false },
  });
  assert.deepEqual(fakeClient.published[1], {
    topic: 'aquatrio/tank01/cmd/schedule',
    message: '{"feedTimes":[{"time":"18:00","days":[1,3,5],"portions":2}]}',
    opts: { qos: 1, retain: true },
  });

  // Broker closes -> offline, then tab visibility triggers immediate reconnect
  fakeClient.emit('close');
  assert.equal(events.at(-1).payload, 'offline');
  fakeDoc.visibilityState = 'visible';
  fakeDoc.dispatch('visibilitychange');
  assert.equal(fakeClient.reconnectCount, 1);

  // Disconnect cleans up client and visibility listener
  transport.disconnect();
  assert.equal(fakeClient.ended, true);
  assert.equal(fakeDoc.listenerCount('visibilitychange'), 0);
});
