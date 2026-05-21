import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player, Game, Session, Group } from '../types';

const KEYS = {
  players: '@gatherround/players',
  games: '@gatherround/games',
  sessions: '@gatherround/sessions',
  groups: '@gatherround/groups',
} as const;

async function load<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function save<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export const getPlayers = () => load<Player>(KEYS.players);
export const savePlayers = (data: Player[]) => save(KEYS.players, data);

export const getGames = () => load<Game>(KEYS.games);
export const saveGames = (data: Game[]) => save(KEYS.games, data);

export const getSessions = () => load<Session>(KEYS.sessions);
export const saveSessions = (data: Session[]) => save(KEYS.sessions, data);

export const getGroups = () => load<Group>(KEYS.groups);
export const saveGroups = (data: Group[]) => save(KEYS.groups, data);
