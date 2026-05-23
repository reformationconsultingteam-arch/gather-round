import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player, Game, Session, Group } from '../types';

const CONFIG_KEY = '@gatherround/sync';
const DEFAULT_PATH = 'data.json';
const DEFAULT_BRANCH = 'main';
const DEBOUNCE_MS = 1500;

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  isConnected: boolean;
  owner: string | null;
  repo: string | null;
}

export interface RemoteData {
  version: number;
  updatedAt: string;
  players: Player[];
  groups: Group[];
  games: Game[];
  sessions: Session[];
}

export type LocalData = Omit<RemoteData, 'version' | 'updatedAt'>;

type Listener = (state: SyncState) => void;

let config: SyncConfig | null = null;
let sha: string | null = null;
let status: SyncStatus = 'idle';
let lastSyncedAt: number | null = null;
let lastError: string | null = null;
let configLoaded = false;
const listeners = new Set<Listener>();

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: LocalData | null = null;
let isPushing = false;

function getState(): SyncState {
  return {
    status,
    lastSyncedAt,
    error: lastError,
    isConnected: !!config?.token,
    owner: config?.owner ?? null,
    repo: config?.repo ?? null,
  };
}

function emit() {
  const state = getState();
  for (const l of listeners) l(state);
}

function setStatus(next: SyncStatus, errMsg: string | null = null) {
  status = next;
  lastError = errMsg;
  if (next === 'synced') lastSyncedAt = Date.now();
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(getState());
  return () => {
    listeners.delete(listener);
  };
}

export function snapshot(): SyncState {
  return getState();
}

export function configLoadedFlag(): boolean {
  return configLoaded;
}

export async function loadConfig(): Promise<SyncConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) {
      configLoaded = true;
      emit();
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<SyncConfig> & { sha?: string | null };
    if (!parsed.token || !parsed.owner || !parsed.repo) {
      configLoaded = true;
      emit();
      return null;
    }
    config = {
      token: parsed.token,
      owner: parsed.owner,
      repo: parsed.repo,
      branch: parsed.branch || DEFAULT_BRANCH,
      path: parsed.path || DEFAULT_PATH,
    };
    sha = parsed.sha ?? null;
    configLoaded = true;
    emit();
    return config;
  } catch {
    configLoaded = true;
    emit();
    return null;
  }
}

async function persistConfig() {
  if (!config) {
    await AsyncStorage.removeItem(CONFIG_KEY);
    return;
  }
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify({ ...config, sha }));
}

function authHeaders(token = config?.token): Record<string, string> {
  if (!token) throw new Error('Sync not configured');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export async function validateConnection(
  token: string,
  owner: string,
  repo: string,
): Promise<ValidationResult> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: authHeaders(token),
    });
    if (res.status === 200) return { ok: true };
    if (res.status === 401) return { ok: false, reason: 'Token is invalid or has expired. Generate a new one and try again.' };
    if (res.status === 403) return { ok: false, reason: 'Token does not have permission. Make sure it has Contents = Read and Write on this repo.' };
    if (res.status === 404) return { ok: false, reason: 'Repo not found. Check the owner and repo name, and confirm the token has access to it.' };
    return { ok: false, reason: `GitHub returned an unexpected response (HTTP ${res.status}).` };
  } catch {
    return { ok: false, reason: 'Network error contacting GitHub. Check your internet connection.' };
  }
}

export async function connect(
  token: string,
  owner: string,
  repo: string,
  branch: string = DEFAULT_BRANCH,
  path: string = DEFAULT_PATH,
): Promise<ValidationResult> {
  const v = await validateConnection(token, owner, repo);
  if (!v.ok) return v;
  config = { token, owner, repo, branch, path };
  sha = null;
  lastError = null;
  await persistConfig();
  setStatus('idle');
  return { ok: true };
}

export async function disconnect(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  pendingData = null;
  config = null;
  sha = null;
  await AsyncStorage.removeItem(CONFIG_KEY);
  setStatus('idle');
}

export function isConnected(): boolean {
  return !!config?.token;
}

export function getConfig(): SyncConfig | null {
  return config ? { ...config } : null;
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToUtf8(b64: string): string {
  const cleaned = b64.replace(/\s+/g, '');
  const bin = atob(cleaned);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export async function pull(): Promise<RemoteData | null> {
  if (!config) return null;
  setStatus('syncing');
  try {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(config.path)}?ref=${encodeURIComponent(config.branch)}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (res.status === 404) {
      sha = null;
      await persistConfig();
      setStatus('synced');
      return null;
    }
    if (res.status === 401) {
      setStatus('error', 'Token rejected by GitHub. Re-connect from Settings.');
      return null;
    }
    if (!res.ok) {
      setStatus('error', `Pull failed (HTTP ${res.status}).`);
      return null;
    }
    const json = (await res.json()) as { content?: string; sha: string; encoding?: string };
    sha = json.sha;
    await persistConfig();
    if (!json.content) {
      setStatus('synced');
      return null;
    }
    const decoded = base64ToUtf8(json.content);
    let data: RemoteData;
    try {
      data = JSON.parse(decoded) as RemoteData;
    } catch {
      setStatus('error', 'Remote data.json is malformed.');
      return null;
    }
    setStatus('synced');
    return data;
  } catch (e) {
    setStatus('error', e instanceof Error ? e.message : 'Pull failed');
    return null;
  }
}

export function schedulePush(data: LocalData): void {
  if (!config) return;
  pendingData = data;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    flushPush().catch(() => { /* state holds the error */ });
  }, DEBOUNCE_MS);
}

async function flushPush(): Promise<void> {
  if (!config || !pendingData || isPushing) return;
  isPushing = true;
  const data = pendingData;
  pendingData = null;
  setStatus('syncing');
  try {
    const remoteData: RemoteData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      ...data,
    };
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(config.path)}`;
    const body: Record<string, unknown> = {
      message: `Update data (${remoteData.updatedAt})`,
      content: utf8ToBase64(JSON.stringify(remoteData, null, 2) + '\n'),
      branch: config.branch,
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 409 || (res.status === 422 && body.sha === undefined)) {
      // SHA conflict or missing-sha-on-existing-file. Refresh sha by pulling, then retry once with current local data.
      isPushing = false;
      await pull();
      pendingData = data;
      schedulePush(data);
      return;
    }

    if (res.status === 401) {
      setStatus('error', 'Token rejected by GitHub. Re-connect from Settings.');
      return;
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      setStatus('error', `Push failed (HTTP ${res.status})${txt ? `: ${txt.slice(0, 160)}` : ''}.`);
      return;
    }

    const json = (await res.json()) as { content: { sha: string } };
    sha = json.content.sha;
    await persistConfig();
    setStatus('synced');
  } catch (e) {
    setStatus('error', e instanceof Error ? e.message : 'Push failed');
  } finally {
    isPushing = false;
    if (pendingData) {
      schedulePush(pendingData);
    }
  }
}

export async function flushPushNow(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  await flushPush();
}

export async function refresh(): Promise<RemoteData | null> {
  return await pull();
}
