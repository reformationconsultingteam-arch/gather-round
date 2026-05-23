import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as sync from '../lib/githubSync';

interface SyncContextValue {
  status: sync.SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  isConnected: boolean;
  configLoaded: boolean;
  owner: string | null;
  repo: string | null;
  connect: (token: string, owner: string, repo: string) => Promise<sync.ValidationResult>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<sync.RemoteData | null>;
  schedulePush: (data: sync.LocalData) => void;
  flushPushNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<sync.SyncState>(() => sync.snapshot());
  const [configLoaded, setConfigLoaded] = useState<boolean>(sync.configLoadedFlag());

  useEffect(() => {
    const unsub = sync.subscribe(setState);
    sync.loadConfig().then(() => setConfigLoaded(true));
    return () => {
      unsub();
    };
  }, []);

  const connect = useCallback(
    (token: string, owner: string, repo: string) => sync.connect(token.trim(), owner.trim(), repo.trim()),
    [],
  );

  const disconnect = useCallback(() => sync.disconnect(), []);
  const refresh = useCallback(() => sync.refresh(), []);
  const schedulePush = useCallback((data: sync.LocalData) => sync.schedulePush(data), []);
  const flushPushNow = useCallback(() => sync.flushPushNow(), []);

  const value = useMemo<SyncContextValue>(() => ({
    status: state.status,
    lastSyncedAt: state.lastSyncedAt,
    error: state.error,
    isConnected: state.isConnected,
    configLoaded,
    owner: state.owner,
    repo: state.repo,
    connect,
    disconnect,
    refresh,
    schedulePush,
    flushPushNow,
  }), [state, configLoaded, connect, disconnect, refresh, schedulePush, flushPushNow]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
