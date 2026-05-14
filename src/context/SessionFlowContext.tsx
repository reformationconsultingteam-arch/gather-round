import React, { createContext, useContext, useState, useCallback } from 'react';

interface SessionFlowState {
  gameId: string | null;
  playerIds: string[];
  /** scores[playerId][fieldName] = value */
  scores: Record<string, Record<string, number>>;
  /** For scoreType === 'winner': the manually selected winner */
  selectedWinner: string | null;
  /** Set after addSession succeeds — used by result screen */
  savedSessionId: string | null;
}

interface SessionFlowContextValue extends SessionFlowState {
  setGameId: (id: string) => void;
  setPlayerIds: (ids: string[]) => void;
  setFieldScore: (playerId: string, field: string, value: number) => void;
  setSelectedWinner: (playerId: string | null) => void;
  setSavedSessionId: (id: string) => void;
  reset: () => void;
}

const INITIAL: SessionFlowState = {
  gameId: null,
  playerIds: [],
  scores: {},
  selectedWinner: null,
  savedSessionId: null,
};

const SessionFlowContext = createContext<SessionFlowContextValue | null>(null);

export function SessionFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionFlowState>(INITIAL);

  const setGameId = useCallback((id: string) => {
    setState(s => ({ ...s, gameId: id }));
  }, []);

  const setPlayerIds = useCallback((ids: string[]) => {
    // Reset scores when players change
    const scores: Record<string, Record<string, number>> = {};
    for (const id of ids) scores[id] = {};
    setState(s => ({ ...s, playerIds: ids, scores, selectedWinner: null }));
  }, []);

  const setFieldScore = useCallback((playerId: string, field: string, value: number) => {
    setState(s => ({
      ...s,
      scores: {
        ...s.scores,
        [playerId]: {
          ...s.scores[playerId],
          [field]: value,
        },
      },
    }));
  }, []);

  const setSelectedWinner = useCallback((playerId: string | null) => {
    setState(s => ({ ...s, selectedWinner: playerId }));
  }, []);

  const setSavedSessionId = useCallback((id: string) => {
    setState(s => ({ ...s, savedSessionId: id }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL);
  }, []);

  return (
    <SessionFlowContext.Provider value={{
      ...state,
      setGameId,
      setPlayerIds,
      setFieldScore,
      setSelectedWinner,
      setSavedSessionId,
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
