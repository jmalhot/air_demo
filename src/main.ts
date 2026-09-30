import './styles.css';
import { DEMO_PASSWORD, DEMO_USERNAME } from '../shared/credentials';
import {
  AVATARS,
  DEFAULT_LANGUAGE,
  DEFAULT_MINUTES,
  DEFAULT_VOICE,
  LANGUAGES,
  MINUTES,
  VOICES,
} from '../shared/options';
import { LiveInterview, type SessionPayload } from './liveSession';

const AUTH_KEY = 'air-demo:auth';

const loginEl = document.querySelector('#login') as HTMLElement;
const setupEl = document.querySelector('#setup') as HTMLElement;
const liveEl = document.querySelector('#live') as HTMLElement;
const thanksEl = document.querySelector('#thanks') as HTMLElement;
const loginForm = document.querySelector('#login-form') as HTMLFormElement;
const usernameEl = document.querySelector('#username') as HTMLInputElement;
const loginPasswordEl = document.querySelector('#login-password') as HTMLInputElement;
const loginError = document.querySelector('#login-error') as HTMLElement;
const setupForm = document.querySelector('#setup-form') as HTMLFormElement;
const jdEl = document.querySelector('#jd') as HTMLTextAreaElement;
const voiceEl = document.querySelector('#voice') as HTMLSelectElement;
const languageEl = document.querySelector('#language') as HTMLSelectElement;
const minutesEl = document.querySelector('#minutes') as HTMLSelectElement;
const avatarEl = document.querySelector('#avatar') as HTMLSelectElement;
const setupError = document.querySelector('#setup-error') as HTMLElement;
const startBtn = document.querySelector('#start') as HTMLButtonElement;
const selfVideoEl = document.querySelector('#self-video') as HTMLVideoElement;
const voiceStageEl = document.querySelector('#voice-stage') as HTMLElement;
const statusEl = document.querySelector('#status') as HTMLElement;
const transcriptEl = document.querySelector('#transcript') as HTMLElement;
const thanksTranscript = document.querySelector('#thanks-transcript') as HTMLElement;
const timerEl = document.querySelector('#timer') as HTMLElement;
const endBtn = document.querySelector('#end') as HTMLButtonElement;
const againBtn = document.querySelector('#again') as HTMLButtonElement;
const thanksReason = document.querySelector('#thanks-reason') as HTMLElement;

let live: LiveInterview | null = null;
let timerHandle = 0;

type Auth = { username: string; password: string };

function readAuth(): Auth | null {
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Auth;
    if (parsed.username === DEMO_USERNAME && parsed.password === DEMO_PASSWORD) return parsed;
    return null;
  } catch {
    return null;
  }
}

function pathOf(): string {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function go(path: string): void {
  if (pathOf() !== path) {
    window.history.pushState({}, '', path);
  }
  render();
}

function show(which: 'login' | 'setup' | 'live' | 'thanks'): void {
  loginEl.classList.toggle('hidden', which !== 'login');
  setupEl.classList.toggle('hidden', which !== 'setup');
  liveEl.classList.toggle('hidden', which !== 'live');
  thanksEl.classList.toggle('hidden', which !== 'thanks');
  const light = which === 'login' || which === 'setup';
  document.body.classList.toggle('page-light', light);
  document.body.classList.toggle('page-login', which === 'login');
  document.body.classList.toggle('page-setup', which === 'setup');
  const header = document.querySelector('#site-header') as HTMLElement | null;
  const logoutBtn = document.querySelector('#logout') as HTMLElement | null;
  header?.classList.toggle('hidden', !light);
  logoutBtn?.classList.toggle('hidden', which !== 'setup');
}

function render(): void {
  const auth = readAuth();
  const path = pathOf();
  if (path === '/setup') {
    if (!auth) {
      go('/');
      return;
    }
    if (!liveEl.classList.contains('hidden') || !thanksEl.classList.contains('hidden')) return;
    show('setup');
    return;
  }
  if (auth) {
    go('/setup');
    return;
  }
  show('login');
}

function fillSelects(): void {
  for (const v of VOICES) {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = v.displayName;
    if (v.name === DEFAULT_VOICE) opt.selected = true;
    voiceEl.append(opt);
  }
  for (const lang of LANGUAGES) {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.name;
    if (lang.code === DEFAULT_LANGUAGE) opt.selected = true;
    languageEl.append(opt);
  }
  for (const m of MINUTES) {
    const opt = document.createElement('option');
    opt.value = String(m);
    opt.textContent = `${m} minutes`;
    if (m === DEFAULT_MINUTES) opt.selected = true;
    minutesEl.append(opt);
  }
  for (const a of AVATARS) {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.label;
    avatarEl.append(opt);
  }
}

function finish(reason: string): void {
  window.clearInterval(timerHandle);
  const snapshot = live?.transcriptHtml() ?? '';
  live?.stop();
  live = null;
  if (pathOf() !== '/setup') window.history.pushState({}, '', '/setup');
  const failed = /invalid|unknown name|not supported|failed/i.test(reason);
  if (failed) {
    setupError.textContent = reason;
    show('setup');
    return;
  }
  thanksReason.textContent = reason;
  thanksTranscript.innerHTML = snapshot;
  show('thanks');
}

fillSelects();
window.addEventListener('popstate', render);
render();

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loginError.textContent = '';
  const username = usernameEl.value.trim();
  const password = loginPasswordEl.value;
  if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    loginError.textContent = 'Incorrect username or password';
    return;
  }
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({ username, password }));
  go('/setup');
});

setupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setupError.textContent = '';
  const auth = readAuth();
  if (!auth) {
    go('/');
    return;
  }
  startBtn.disabled = true;
  try {
    const body = {
      username: auth.username,
      password: auth.password,
      jobDescription: jdEl.value,
      voiceName: voiceEl.value,
      language: languageEl.value,
      minutes: Number(minutesEl.value),
      avatarName: avatarEl.value,
    };
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as SessionPayload & { error?: string };
    if (!response.ok) {
      setupError.textContent = data.error || 'Could not start';
      return;
    }
    live = new LiveInterview(selfVideoEl, voiceStageEl, statusEl, transcriptEl, finish);
    show('live');
    await live.start(data);
    timerEl.textContent = live.remainingLabel();
    timerHandle = window.setInterval(() => {
      if (!live) return;
      timerEl.textContent = live.remainingLabel();
      live.cueWrapUpIfDue();
      if (live.isExpired()) finish('Time is up');
    }, 250);
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError' || name === 'NotFoundError') {
      setupError.textContent = 'Please allow microphone access to start. Camera is optional.';
    } else {
      setupError.textContent = 'Demo not available';
    }
    show('setup');
    live?.stop();
    live = null;
  } finally {
    startBtn.disabled = false;
  }
});

endBtn.addEventListener('click', () => finish('Interview complete'));
againBtn.addEventListener('click', () => {
  show('setup');
});

function logout(): void {
  window.clearInterval(timerHandle);
  live?.stop();
  live = null;
  sessionStorage.removeItem(AUTH_KEY);
  usernameEl.value = '';
  loginPasswordEl.value = '';
  go('/');
}

document.querySelector('#logout')?.addEventListener('click', logout);
document.querySelector('#logout-live')?.addEventListener('click', logout);
