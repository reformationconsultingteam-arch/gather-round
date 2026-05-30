import React, { createContext, useContext, useState, useCallback } from 'react';
import { SecretHitlerRole, SecretHitlerTeam, RookRound } from '../types';

interface SessionFlowState {
  gameId: string | null;
  /** Optional group this game-night belongs to (Family/Friends). null = untagged. */
  groupId: string | null;
  playerIds: string[];
  /** scores[playerId][fieldName] = value */
  scores: Record<string, Record<string, number>>;
  /** For scoreType === 'winner': the manually selected winner */
  selectedWinner: string | null;
  /** Set after addSession succeeds — used by result screen */
  savedSessionId: string | null;

  // ─── Secret Hitler ────────────────────────────────────────────────────────
  roles: Record<string, SecretHitlerRole>;
  winningTeam: SecretHitlerTeam | null;
  mvpPlayerId: string | null;
  bonusFascistPlayerId: string | null;

  // ─── Rook ─────────────────────────────────────────────────────────────────
  rookTeamA: string[];
  rookTeamB: string[];
  rookTargetScore: number;
  rookRounds: RookRound[];
  rookWinningTeam: 'A' | 'B' | null;
}

interface SessionFlowContextValue extends SessionFlowState {
  setGameId: (id: string) => void;
  setGroupId: (id: string | null) => void;
  setPlayerIds: (ids: string[]) => void;
  setFieldScore: (playerId: string, field: string, value: number) => void;
  setSelectedWinner: (playerId: string | null) => void;
  setSavedSessionId: (id: string) => void;

  setRole: (playerId: string, role: SecretHitlerRole) => void;
  setWinningTeam: (team: SecretHitlerTeam | null) => void;
  setMvpPlayerId: (id: string | null) => void;
  setBonusFascistPlayerId: (id: string | null) => void;

  setRookTeams: (a: string[], b: string[]) => void;
  setRookTargetScore: (n: number) => void;
  addRookRound: (round: RookRound) => void;
  updateRookRound: (index: number, round: RookRound) => void;
  removeRookRound: (index: number) => void;
  setRookWinningTeam: (team: 'A' | 'B' | null) => void;

  reset: () => void;
}

const INITIAL: SessionFlowState = {
  gameId: null,
  groupId: null,
  playerIds: [],
  scores: {},
  selectedWinner: null,
  savedSessionId: null,
  roles: {},
  winningTeam: null,
  mvpPlayerId: null,
  bonusFascistPlayerId: null,
  rookTeamA: [],
  rookTeamB: [],
  rookTargetScore: 500,
  rookRounds: [],
  rookWinningTeam: null,
};

const SessionFlowContext = createContext<SessionFlowContextValue | null>(null);

export function SessionFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionFlowState>(INITIAL);

  const setGameId = useCallback((id: string) => {
    setState(s => ({ ...s, gameId: id }));
  }, []);

  const setGroupId = useCallback((id: string | null) => {
    setState(s => ({ ...s, groupId: id }));
  }, []);

  const setPlayerIds = useCallback((ids: string[]) => {
    const scores: Record<string, Record<string, number>> = {};
    for (const id of ids) scores[id] = {};
    setState(s => ({
      ...s,
      playerIds: ids,
      scores,
      selectedWinner: null,
      roles: {},
      winningTeam: null,
      mvpPlayerId: null,
      bonusFascistPlayerId: null,
      rookTeamA: [],
      rookTeamB: [],
      rookRounds: [],
      rookWinningTeam: null,
    }));
  }, []);

  const setFieldScore = useCallback((playerId: string, field: string, value: number) => {
    setState(s => ({
      ...s,
      scores: {
        ...s.scores,
        [playerId]: { ...s.scores[playerId], [field]: value },
      },
    }));
  }, []);

  const setSelectedWinner = useCallback((playerId: string | null) => {
    setState(s => ({ ...s, selectedWinner: playerId }));
  }, []);

  const setSavedSessionId = useCallback((id: string) => {
    setState(s => ({ ...s, savedSessionId: id }));
  }, []);

  const setRole = useCallback((playerId: string, role: SecretHitlerRole) => {
    setState(s => ({ ...s, roles: { ...s.roles, [playerId]: role } }));
  }, []);

  const setWinningTeam = useCallback((team: SecretHitlerTeam | null) => {
    setState(s => ({ ...s, winningTeam: team }));
  }, []);

  const setMvpPlayerId = useCallback((id: string | null) => {
    setState(s => ({ ...s, mvpPlayerId: id }));
  }, []);

  const setBonusFascistPlayerId = useCallback((id: string | null) => {
    setState(s => ({ ...s, bonusFascistPlayerId: id }));
  }, []);

  const setRookTeams = useCallback((a: string[], b: string[]) => {
    setState(s => ({ ...s, rookTeamA: a, rookTeamB: b }));
  }, []);

  const setRookTargetScore = useCallback((n: number) => {
    setState(s => ({ ...s, rookTargetScore: n }));
  }, []);

  const addRookRound = useCallback((round: RookRound) => {
    setState(s => ({ ...s, rookRounds: [...s.rookRounds, round] }));
  }, []);

  const updateRookRound = useCallback((index: number, round: RookRound) => {
    setState(s => ({
      ...s,
      rookRounds: s.rookRounds.map((r, i) => (i === index ? round : r)),
    }));
  }, []);

  const removeRookRound = useCallback((index: number) => {
    setState(s => ({ ...s, rookRounds: s.rookRounds.filter((_, i) => i !== index) }));
  }, []);

  const setRookWinningTeam = useCallback((team: 'A' | 'B' | null) => {
    setState(s => ({ ...s, rookWinningTeam: team }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL);
  }, []);

  return (
    <SessionFlowContext.Provider value={{
      ...state,
      setGameId,
      setGroupId,
      setPlayerIds,
      setFieldScore,
      setSelectedWinner,
      setSavedSessionId,
      setRole,
      setWinningTeam,
      setMvpPlayerId,
      setBonusFascistPlayerId,
      setRookTeams,
      setRookTargetScore,
      addRookRound,
      updateRookRound,
      removeRookRound,
      setRookWinningTeam,
      reset,
    }}>
      {children}
    </SessionFlowContext.Provider>
  );
}

export function useSessionFlow(): SessionFlowContextValue {
  const ctx = useContext(SessionFlowContext);
  if (!ctx) throw new Error('useSessionFlow must be used within SessionFlowProvider');
  return ctx;
}
