import { useState, useEffect, useRef, useCallback } from 'react';
import { COMMAND_TIMEOUT_MS, TOPICS } from '../constants/tank.js';
import { deviceService, isMockMode } from '../services/deviceService.js';
import { normalizeScheduleFeedTimes } from '../utils/tankLogic.js';

const INITIAL_PENDING = {
  feed: false,
  filter: false,
  filterAuto: false,
  refill: false,
  refillAuto: false,
  schedule: false,
};

/**
 * React hook wrapping deviceService for UI components.
 * Enforces telemetry-confirmed updates (no optimistic writes) and 5s command timeouts.
 */
export function useDevice() {
  const [telemetry, setTelemetry] = useState(null);
  const [schedule, setScheduleState] = useState({ feedTimes: [] });
  const [connection, setConnection] = useState('connecting');
  const [pending, setPending] = useState(INITIAL_PENDING);
  const [error, setError] = useState(null);
  const [dismissedFaultKey, setDismissedFaultKey] = useState(null);

  const telemetryRef = useRef(null);
  const timersRef = useRef({});
  const errorTimerRef = useRef(null);
  const pendingExpectationsRef = useRef({});

  const clearCommandPending = useCallback((key) => {
    if (timersRef.current[key]) {
      clearTimeout(timersRef.current[key]);
      delete timersRef.current[key];
    }
    delete pendingExpectationsRef.current[key];
    setPending((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
  }, []);

  const showTimeoutError = useCallback(() => {
    setError("Device didn't respond");
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setError(null);
    }, 4500);
  }, []);

  const clearError = useCallback(() => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(null);
  }, []);

  useEffect(() => {
    setConnection('connecting');

    const unsubscribe = deviceService.subscribe(({ topic, payload }) => {
      if (topic === 'status/error' && payload) {
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        setError(String(payload));
        return;
      }

      if (topic === TOPICS.STATUS_ONLINE) {
        const nextStatus =
          payload === 'connecting'
            ? 'connecting'
            : payload === 'online'
            ? 'online'
            : 'offline';
        setConnection(nextStatus);
        if (nextStatus !== 'online') {
          Object.keys(timersRef.current).forEach((key) => clearCommandPending(key));
        }
        return;
      }

      if (topic === TOPICS.STATUS_TELEMETRY && payload) {
        const prevTelemetry = telemetryRef.current;
        telemetryRef.current = payload;
        setTelemetry(payload);

        // Reset fault dismissal if fault clears or changes
        if (!payload.refill?.fault) {
          setDismissedFaultKey(null);
        } else if (
          prevTelemetry?.refill?.fault !== payload.refill.fault
        ) {
          setDismissedFaultKey(null);
        }

        // Check if any in-flight command is confirmed by this telemetry frame
        Object.entries(pendingExpectationsRef.current).forEach(([key, matcher]) => {
          if (matcher(payload, prevTelemetry)) {
            clearCommandPending(key);
          }
        });
        return;
      }

      if (topic === TOPICS.CMD_SCHEDULE && payload) {
        setScheduleState(payload);
        if (pendingExpectationsRef.current.schedule) {
          clearCommandPending('schedule');
        }
      }
    });

    deviceService.connect();

    return () => {
      unsubscribe();
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      deviceService.disconnect();
    };
  }, [clearCommandPending]);

  const dispatchCommand = useCallback(
    (key, topic, payload, confirmMatcher) => {
      if (connection !== 'online') return Promise.resolve();

      clearCommandPending(key);
      setPending((prev) => ({ ...prev, [key]: true }));
      pendingExpectationsRef.current[key] = confirmMatcher;

      timersRef.current[key] = setTimeout(() => {
        clearCommandPending(key);
        showTimeoutError();
      }, COMMAND_TIMEOUT_MS);

      return deviceService.sendCommand(topic, payload).catch(() => {
        clearCommandPending(key);
        showTimeoutError();
      });
    },
    [connection, clearCommandPending, showTimeoutError]
  );

  const feed = useCallback(
    (portions) => {
      const sentAtLastFed = telemetryRef.current?.lastFed ?? 0;
      const sentFeedPercent = telemetryRef.current?.feedPercent ?? 100;
      return dispatchCommand(
        'feed',
        TOPICS.CMD_FEED,
        { portions },
        (next) =>
          next.lastFed > sentAtLastFed || next.feedPercent < sentFeedPercent
      );
    },
    [dispatchCommand]
  );

  const setFilter = useCallback(
    (action) => {
      const expectedRunning = action === 'start';
      return dispatchCommand(
        'filter',
        TOPICS.CMD_FILTER,
        { action },
        (next) => next.filter?.running === expectedRunning
      );
    },
    [dispatchCommand]
  );

  const setFilterAuto = useCallback(
    (enabled) => {
      return dispatchCommand(
        'filterAuto',
        TOPICS.CMD_FILTER_AUTO,
        { enabled },
        (next) => next.filter?.auto === Boolean(enabled)
      );
    },
    [dispatchCommand]
  );

  const refill = useCallback(
    (action) => {
      const targetAction =
        action || (telemetryRef.current?.refill?.active ? 'stop' : 'start');
      const expectedActive = targetAction === 'start';
      setDismissedFaultKey(null);
      return dispatchCommand(
        'refill',
        TOPICS.CMD_REFILL,
        { action: targetAction },
        (next) =>
          next.refill?.active === expectedActive || Boolean(next.refill?.fault)
      );
    },
    [dispatchCommand]
  );

  const setRefillAuto = useCallback(
    (enabled) => {
      return dispatchCommand(
        'refillAuto',
        TOPICS.CMD_REFILL_AUTO,
        { enabled },
        (next) => next.refill?.auto === Boolean(enabled)
      );
    },
    [dispatchCommand]
  );

  const setSchedule = useCallback(
    (feedTimes) => {
      const normalizedFeedTimes = normalizeScheduleFeedTimes(feedTimes);
      return dispatchCommand(
        'schedule',
        TOPICS.CMD_SCHEDULE,
        { feedTimes: normalizedFeedTimes },
        () => true
      );
    },
    [dispatchCommand]
  );

  const activeFault = telemetry?.refill?.fault ?? null;
  const visibleRefillFault =
    activeFault && dismissedFaultKey !== activeFault ? activeFault : null;

  const dismissRefillFault = useCallback(() => {
    if (telemetryRef.current?.refill?.fault) {
      setDismissedFaultKey(telemetryRef.current.refill.fault);
    }
  }, []);

  const state = telemetry
    ? {
        ...telemetry,
        schedule,
        visibleRefillFault,
      }
    : null;

  return {
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
  };
}
