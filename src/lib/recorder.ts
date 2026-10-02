/* Local audio recording (MediaRecorder) - works offline. Optional free browser transcription (online only in most browsers). */
export const recordingSupported = (): boolean =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof (window as any).MediaRecorder !== "undefined";

function pickMime(): string {
  const MR = (window as any).MediaRecorder;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) if (MR.isTypeSupported?.(m)) return m;
  return "";
}

export class Recorder {
  private mr: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private stream: MediaStream | null = null;
  private started = 0;
  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = pickMime();
    this.mr = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.chunks = [];
    this.mr.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
    this.mr.start(1000);
    this.started = Date.now();
  }
  stop(): Promise<{ blob: Blob; durSecs: number; mime: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mr) { reject(new Error("Not recording")); return; }
      const mr = this.mr;
      mr.onstop = () => {
        const mime = mr.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type: mime });
        this.stream?.getTracks().forEach((t) => t.stop());
        this.mr = null;
        resolve({ blob, durSecs: (Date.now() - this.started) / 1000, mime });
      };
      mr.stop();
    });
  }
  cancel() { try { this.mr?.stop(); } catch { /* ignore */ } this.stream?.getTracks().forEach((t) => t.stop()); this.mr = null; }
  get active() { return !!this.mr; }
}

/* Optional transcription with the browser's built-in recognizer (free; in Chrome it needs internet). */
export const sttSupported = (): boolean => typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export function startDictation(onText: (finalText: string, interim: string) => void, onEnd: (err?: string) => void): () => void {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) { onEnd("Speech recognition is not available in this browser."); return () => undefined; }
  const r = new SR();
  r.lang = "en-GB"; r.continuous = true; r.interimResults = true;
  let finalText = "";
  r.onresult = (e: any) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += (finalText ? " " : "") + t.trim(); else interim += t;
    }
    onText(finalText, interim);
  };
  r.onerror = (e: any) => onEnd(e.error === "network" ? "Transcription needs an internet connection in this browser. Type your transcript instead." : e.error === "not-allowed" ? "Microphone permission denied." : "Transcription stopped: " + e.error);
  r.onend = () => onEnd();
  r.start();
  return () => { try { r.stop(); } catch { /* ignore */ } };
}

/* Local transcript analysis (no AI): fillers, repetition, length, speaking rate. */
const FILLERS = ["um", "uh", "er", "erm", "ah", "like", "you know", "i mean", "actually", "basically", "so yeah", "kind of", "sort of"];
export function analyseTranscript(text: string, durSecs: number, part: number) {
  const t = " " + text.toLowerCase().replace(/[^a-z' ]/g, " ").replace(/\s+/g, " ") + " ";
  const words = t.trim() ? t.trim().split(" ") : [];
  const fillers: Record<string, number> = {};
  for (const f of FILLERS) { const n = t.split(" " + f + " ").length - 1; if (n) fillers[f] = n; }
  const freq: Record<string, number> = {};
  const STOP = new Set("the a an and or but to of in on at for is are was were be been it this that i you he she we they my your with as so not do does did have has had very really there their them then than".split(" "));
  for (const w of words) if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
  const repeated = Object.entries(freq).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const wpm = durSecs > 5 ? Math.round(words.length / (durSecs / 60)) : 0;
  const issues: string[] = [];
  const minWords = part === 2 ? 180 : part === 3 ? 60 : 25;
  if (words.length && words.length < minWords) issues.push(`Short answer (${words.length} words). Aim for at least ${minWords} words in Part ${part}: answer, reason, example.`);
  const fillerTotal = Object.values(fillers).reduce((a, b) => a + b, 0);
  if (fillerTotal >= 4) issues.push(`${fillerTotal} fillers. Replace them with planned phrases ("That's a good question…", "Let me think…").`);
  if (repeated.length) issues.push(`Repeated words: ${repeated.map(([w, n]) => `${w} ×${n}`).join(", ")}. Use synonyms.`);
  if (wpm && wpm < 90) issues.push(`Speaking rate ${wpm} words/min - quite slow; long pauses affect Fluency.`);
  if (part >= 2 && !/\b(because|since|as a result|for example|for instance|although|whereas|which)\b/.test(t)) issues.push("No linking or complex structures detected (because, although, for example, which…).");
  return { words: words.length, wpm, fillers, repeated, issues };
}
