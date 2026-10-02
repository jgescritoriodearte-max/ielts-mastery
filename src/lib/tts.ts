/* Device voice (Web Speech API). Used only when a pre-produced audio file is not available,
   and for extra drills. Offline voices (localService) are preferred. */
export const ttsSupported = (): boolean => typeof window !== "undefined" && "speechSynthesis" in window;

let cache: SpeechSynthesisVoice[] = [];
export function voices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const v = speechSynthesis.getVoices();
  if (v.length) cache = v;
  return cache;
}
if (ttsSupported()) speechSynthesis.onvoiceschanged = () => { cache = speechSynthesis.getVoices(); };

const ACCENT_LANG: Record<string, string[]> = { gb: ["en-GB"], us: ["en-US"], au: ["en-AU", "en-NZ"], any: ["en-GB", "en-US", "en-AU", "en-IE", "en-CA", "en-IN"] };

export function englishVoices(accent: string): SpeechSynthesisVoice[] {
  const all = voices().filter((v) => /^en[-_]/i.test(v.lang));
  const langs = ACCENT_LANG[accent] || ACCENT_LANG.any;
  const norm = (l: string) => l.replace("_", "-");
  let list = all.filter((v) => langs.includes(norm(v.lang)));
  if (!list.length) list = all;
  return list.sort((a, b) => Number(b.localService) - Number(a.localService));
}

export function offlineVoiceCount(): number { return voices().filter((v) => /^en/i.test(v.lang) && v.localService).length; }

function voiceFor(speaker: string, accent: string, speakers: string[]): SpeechSynthesisVoice | undefined {
  const list = englishVoices(accent);
  if (!list.length) return undefined;
  const idx = Math.max(0, speakers.indexOf(speaker));
  return list[idx % list.length];
}

export interface PlayOpts { accent: string; rate: number; onLine?: (i: number) => void; onEnd?: () => void; }

export class LinePlayer {
  private lines: [string, string][];
  private i = 0;
  private stopped = true;
  private opts: PlayOpts;
  private speakers: string[];
  constructor(lines: [string, string][], opts: PlayOpts) {
    this.lines = lines; this.opts = opts;
    this.speakers = [...new Set(lines.map((l) => l[0]))];
  }
  get index() { return this.i; }
  get playing() { return !this.stopped; }
  play(from = this.i) {
    if (!ttsSupported()) return;
    speechSynthesis.cancel();
    this.i = from; this.stopped = false;
    this.next();
  }
  private next() {
    if (this.stopped) return;
    if (this.i >= this.lines.length) { this.stopped = true; this.opts.onEnd?.(); return; }
    const [sp, text] = this.lines[this.i];
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(sp, this.opts.accent, this.speakers);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
    u.rate = this.opts.rate;
    u.pitch = this.speakers.length > 1 && this.speakers.indexOf(sp) % 2 === 1 ? 1.12 : 0.95;
    this.opts.onLine?.(this.i);
    u.onend = () => { if (this.stopped) return; this.i++; setTimeout(() => this.next(), 350); };
    u.onerror = () => { if (this.stopped) return; this.i++; this.next(); };
    speechSynthesis.speak(u);
  }
  pause() { this.stopped = true; if (ttsSupported()) speechSynthesis.cancel(); }
  stop() { this.pause(); this.i = 0; }
  setRate(r: number) { this.opts.rate = r; }
}

export function speak(text: string, accent = "gb", rate = 1, onEnd?: () => void): void {
  if (!ttsSupported()) { onEnd?.(); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = englishVoices(accent)[0];
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
  u.rate = rate;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
}
export const stopSpeaking = () => { if (ttsSupported()) speechSynthesis.cancel(); };
