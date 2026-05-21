import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data on mount; seed preset games on first launch
  useEffect(() => {
    async function bootstrap() {
      const [storedPlayers, storedGames, storedSessions, storedGroups] = await Promise.all([
        getPlayers(),
        getGames(),
        getSessions(),
        getGroups(),
      ]);

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

      setPlayers(storedPlayers);
      setGames(resolvedGames);
      setSessions(storedSessions);
      setGroups(storedGroups);
      setLoading(false);
    }
    bootstrap();
  }, []);

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
    return player;
  }, [players]);

  const renamePlayer = useCallback((id: string, name: string) => {
    const next = players.map(p => p.id === id ? { ...p, name: name.trim() } : p);
    setPlayers(next);
    savePlayers(next);
  }, [players]);

  const deletePlayer = useCallback((id: string) => {
    // Remove from player list only; sessions retain the id (name resolved at render time from sessions)
    const next = players.filter(p => p.id !== id);
    setPlayers(next);
    savePlayers(next);
  }, [players]);

  const setPlayerGroups = useCallback((id: string, groupIds: string[]) => {
    const next = players.map(p => p.id === id ? { ...p, groupIds: [...groupIds] } : p);
    setPlayers(next);
    savePlayers(next);
  }, [players]);

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
    return group;
  }, [groups]);

  const renameGroup = useCallback((id: string, name: string) => {
    const next = groups.map(g => g.id === id ? { ...g, name: name.trim() } : g);
    setGroups(next);
    saveGroups(next);
  }, [groups]);

  const recolorGroup = useCallback((id: string, color: string) => {
    const next = groups.map(g => g.id === id ? { ...g, color } : g);
    setGroups(next);
    saveGroups(next);
  }, [groups]);

  const deleteGroup = useCallback((id: string) => {
    // Remove the group itself, then scrub the id from every player's groupIds.
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
  }, [groups, players]);

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
    return newGame;
  }, [games]);

  const deleteCustomGame = useCallback((id: string) => {
    const next = games.filter(g => g.id !== id || !g.custom);
    setGames(next);
    saveGames(next);
  }, [games]);

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
    return newSession;
  }, [sessions, players]);

  const deleteSession = useCallback((id: string) => {
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    saveSessions(next);
  }, [sessions]);

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
