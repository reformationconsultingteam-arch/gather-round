import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Player, Game, Session } from '../types';
import {
  getPlayers, savePlayers,
  getGames, saveGames,
  getSessions, saveSessions,
} from '../storage';
import { PRESET_GAMES } from '../data/presetGames';
import { colorForIndex } from '../data/colors';
import uuid from 'react-native-uuid';

interface DataContextValue {
  // State
  players: Player[];
  games: Game[];
  sessions: Session[];
  loading: boolean;

  // Player actions
  addPlayer: (name: string) => Player;
  renamePlayer: (id: string, name: string) => void;
  deletePlayer: (id: string) => void;

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
  const [loading, setLoading] = useState(true);

  // Load all data on mount; seed preset games on first launch
  useEffect(() => {
    async function bootstrap() {
      const [storedPlayers, storedGames, storedSessions] = await Promise.all([
        getPlayers(),
        getGames(),
        getSessions(),
      ]);

      let resolvedGames = storedGames;
      if (storedGames.length === 0) {
        resolvedGames = PRESET_GAMES;
        await saveGames(PRESET_GAMES);
      }

      setPlayers(storedPlayers);
      setGames(resolvedGames);
      setSessions(storedSessions);
      setLoading(false);
    }
    bootstrap();
  }, []);

  // --- Player actions ---

  const addPlayer = useCallback((name: string): Player => {
    const player: Player = {
      id: uuid.v4() as string,
      name: name.trim(),
      color: colorForIndex(players.length),
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
      players, games, sessions, loading,
      addPlayer, renamePlayer, deletePlayer,
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
