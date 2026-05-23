import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Player, Game, Session, Group } from '../types';
import {
  getPlayers, savePlayers,
  getGames, saveGames,
  getSessions, saveSessions,
  getGroups, saveGroups,
} from '../storage';
import { PRESET_GAMES } from '../data/presetGames';
import { colorForIndex } from '../data/colors';
import uuid from 'react-native-uuid';
import { useSync } from './SyncContext';

interface DataContextValue {
  // State
  players: Player[];
  games: Game[];
  sessions: Session[];
  groups: Group[];
  loading: boolean;

  // Player actions
  addPlayer: (name: string, groupIds?: string[]) => Player;
  renamePlayer: (id: string, name: string) => void;
  deletePlayer: (id: string) => void;
  setPlayerGroups: (id: string, groupIds: string[]) => void;

  // Group actions
  addGroup: (name: string) => Group;
  renameGroup: (id: string, name: string) => void;
  recolorGroup: (id: string, color: string) => void;
  deleteGroup: (id: string) => void;

  // Game actions
  addCustomGame: (game: Omit<Game, 'id' | 'custom' | 'scorecardFields'>) => Game;
  deleteCustomGame: (id: string) => void;

  // Session actions
  addSession: (session: Omit<Session, 'id' | 'playerSnapshots'>) => Session;
  deleteSession: (id: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function mergeMissingPresets(games: Game[]): Game[] {
  const ids = new Set(games.map(g => g.id));
  const missing = PRESET_GAMES.filter(p => !ids.has(p.id));
  return missing.length > 0 ? [...games, ...missing] : games;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const sync = useSync();

  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Suppress remote pushes during hydration from remote pull (we'd be pushing back what we just pulled)
  const hydratingRef = useRef(false);

  // Track whether we've pulled for the current connection — so reconnecting re-pulls
  const prevConnectedRef = useRef(false);

  // Push helper that respects the hydration guard and the connection state
  const pushAll = useCallback((next: {
    players: Player[];
    games: Game[];
    sessions: Session[];
    groups: Group[];
  }) => {
    if (hydratingRef.current) return;
    if (!sync.isConnected) return;
    sync.schedulePush(next);
  }, [sync]);

  // Initial load from local storage (always runs, regardless of sync state)
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const [storedPlayers, storedGames, storedSessions, storedGroups] = await Promise.all([
        getPlayers(),
        getGames(),
        getSessions(),
        getGroups(),
      ]);
      if (cancelled) return;

      // Preset migration: ensure any new preset games added in later releases
      // are seeded into existing installs (without wiping custom games).
      let resolvedGames = storedGames;
      const storedIds = new Set(storedGames.map(g => g.id));
      const missingPresets = PRESET_GAMES.filter(p => !storedIds.has(p.id));
      if (storedGames.length === 0) {
        resolvedGames = PRESET_GAMES;
        await saveGames(PRESET_GAMES);
      } else if (missingPresets.length > 0) {
        resolvedGames = [...storedGames, ...missingPresets];
        await saveGames(resolvedGames);
      }

      hydratingRef.current = true;
      setPlayers(storedPlayers);
      setGames(resolvedGames);
      setSessions(storedSessions);
      setGroups(storedGroups);
      setLoading(false);
      // Release guard on next tick so any push triggered by setState commits is suppressed
      setTimeout(() => { hydratingRef.current = false; }, 0);
    }
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  // Pull from remote when (and only when) we transition into a connected state
  useEffect(() => {
    if (loading) return;
    if (!sync.configLoaded) return;

    if (sync.isConnected && !prevConnectedRef.current) {
      prevConnectedRef.current = true;
      let cancelled = false;
      (async () => {
        const remote = await sync.refresh();
        if (cancelled || !remote) return;
        const mergedGames = mergeMissingPresets(remote.games);
        hydratingRef.current = true;
        setPlayers(remote.players);
        setGames(mergedGames);
        setSessions(remote.sessions);
        setGroups(remote.groups);
        await Promise.all([
          savePlayers(remote.players),
          saveGames(mergedGames),
          saveSessions(remote.sessions),
          saveGroups(remote.groups),
        ]);
        setTimeout(() => { hydratingRef.current = false; }, 0);
        // If we added missing presets locally, push them up so remote stays in sync
        if (mergedGames.length !== remote.games.length) {
          sync.schedulePush({
            players: remote.players,
            games: mergedGames,
            sessions: remote.sessions,
            groups: remote.groups,
          });
        }
      })();
      return () => { cancelled = true; };
    } else if (!sync.isConnected) {
      prevConnectedRef.current = false;
    }
  }, [loading, sync.configLoaded, sync.isConnected, sync]);

  // Flush any pending push before the page unloads, so a fresh edit isn't lost
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      // Best-effort; sendBeacon-like flush would be needed for true reliability
      void sync.flushPushNow();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [sync]);

  // --- Player actions ---

  const addPlayer = useCallback((name: string, groupIds?: string[]): Player => {
    const player: Player = {
      id: uuid.v4() as string,
      name: name.trim(),
      color: colorForIndex(players.length),
      ...(groupIds && groupIds.length > 0 ? { groupIds } : {}),
    };
    const next = [...players, player];
    setPlayers(next);
    savePlayers(next);
    pushAll({ players: next, games, sessions, groups });
    return player;
  }, [players, games, sessions, groups, pushAll]);

  const renamePlayer = useCallback((id: string, name: string) => {
    const next = players.map(p => p.id === id ? { ...p, name: name.trim() } : p);
    setPlayers(next);
    savePlayers(next);
    pushAll({ players: next, games, sessions, groups });
  }, [players, games, sessions, groups, pushAll]);

  const deletePlayer = useCallback((id: string) => {
    const next = players.filter(p => p.id !== id);
    setPlayers(next);
    savePlayers(next);
    pushAll({ players: next, games, sessions, groups });
  }, [players, games, sessions, groups, pushAll]);

  const setPlayerGroups = useCallback((id: string, groupIds: string[]) => {
    const next = players.map(p => p.id === id ? { ...p, groupIds: [...groupIds] } : p);
    setPlayers(next);
    savePlayers(next);
    pushAll({ players: next, games, sessions, groups });
  }, [players, games, sessions, groups, pushAll]);

  // --- Group actions ---

  const addGroup = useCallback((name: string): Group => {
    const group: Group = {
      id: uuid.v4() as string,
      name: name.trim(),
      color: colorForIndex(groups.length),
    };
    const next = [...groups, group];
    setGroups(next);
    saveGroups(next);
    pushAll({ players, games, sessions, groups: next });
    return group;
  }, [players, games, sessions, groups, pushAll]);

  const renameGroup = useCallback((id: string, name: string) => {
    const next = groups.map(g => g.id === id ? { ...g, name: name.trim() } : g);
    setGroups(next);
    saveGroups(next);
    pushAll({ players, games, sessions, groups: next });
  }, [players, games, sessions, groups, pushAll]);

  const recolorGroup = useCallback((id: string, color: string) => {
    const next = groups.map(g => g.id === id ? { ...g, color } : g);
    setGroups(next);
    saveGroups(next);
    pushAll({ players, games, sessions, groups: next });
  }, [players, games, sessions, groups, pushAll]);

  const deleteGroup = useCallback((id: string) => {
    const nextGroups = groups.filter(g => g.id !== id);
    setGroups(nextGroups);
    saveGroups(nextGroups);

    const nextPlayers = players.map(p => {
      if (!p.groupIds || !p.groupIds.includes(id)) return p;
      const filtered = p.groupIds.filter(gid => gid !== id);
      return { ...p, groupIds: filtered };
    });
    setPlayers(nextPlayers);
    savePlayers(nextPlayers);

    pushAll({ players: nextPlayers, games, sessions, groups: nextGroups });
  }, [groups, players, games, sessions, pushAll]);

  // --- Game actions ---

  const addCustomGame = useCallback((
    game: Omit<Game, 'id' | 'custom' | 'scorecardFields'>
  ): Game => {
    const newGame: Game = {
      ...game,
      id: uuid.v4() as string,
      scorecardFields: [],
      custom: true,
    };
    const next = [...games, newGame];
    setGames(next);
    saveGames(next);
    pushAll({ players, games: next, sessions, groups });
    return newGame;
  }, [players, games, sessions, groups, pushAll]);

  const deleteCustomGame = useCallback((id: string) => {
    const next = games.filter(g => g.id !== id || !g.custom);
    setGames(next);
    saveGames(next);
    pushAll({ players, games: next, sessions, groups });
  }, [players, games, sessions, groups, pushAll]);

  // --- Session actions ---

  const addSession = useCallback((session: Omit<Session, 'id' | 'playerSnapshots'>): Session => {
    const snapshots: Record<string, { name: string; color: string }> = {};
    for (const pid of session.players) {
      const p = players.find(pl => pl.id === pid);
      if (p) snapshots[pid] = { name: p.name, color: p.color };
    }
    const newSession: Session = { ...session, id: uuid.v4() as string, playerSnapshots: snapshots };
    const next = [...sessions, newSession];
    setSessions(next);
    saveSessions(next);
    pushAll({ players, games, sessions: next, groups });
    return newSession;
  }, [players, games, sessions, groups, pushAll]);

  const deleteSession = useCallback((id: string) => {
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    saveSessions(next);
    pushAll({ players, games, sessions: next, groups });
  }, [players, games, sessions, groups, pushAll]);

  return (
    <DataContext.Provider value={{
      players, games, sessions, groups, loading,
      addPlayer, renamePlayer, deletePlayer, setPlayerGroups,
      addGroup, renameGroup, recolorGroup, deleteGroup,
      addCustomGame, deleteCustomGame,
      addSession, deleteSession,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
