export type Skill = "L" | "R" | "W" | "S";
export type AnySkill = Skill | "G" | "V" | "P";
export const SKILLS: Skill[] = ["L", "R", "W", "S"];
export const SKILL_NAME: Record<AnySkill, string> = {
  L: "Listening", R: "Reading", W: "Writing", S: "Speaking", G: "Grammar", V: "Vocabulary", P: "Paraphrasing",
};

export interface Rec { id: string; updatedAt: number; }

export interface Profile {
  name: string;
  exam: "academic" | "gt";
  target: number;
  skillTargets: Record<Skill, number>;
  examDate: string; // YYYY-MM-DD
  hoursWeek: number;
  minutesDay: number;
  selfLevel: Partial<Record<Skill, number>>;
  difficulties: string[];
  priors?: Partial<Record<"W" | "G" | "L" | "R" | "S", number>>; // initial importance (0-1) per area; see engine.ts (project estimates)
  prefer: string;
  onboarded: boolean;
  createdAt: number;
}

export interface Settings {
  accent: "any" | "gb" | "us" | "au";
  ttsRate: number;
  theme: "system" | "light" | "dark";
  explainLang: "en" | "pt";
  backupReminderDays: number;
  autoDownload: boolean;
  examMode: boolean;
}

/* ---- content ---- */
export interface Item {
  q: string;
  a: string | string[];
  opts?: string[];
  ev?: string;
  ex?: string;
  tag?: string;
  strat?: string;
}
export interface Group {
  qtype: string;
  instr: string;
  options?: string[];
  optKey?: "roman" | "letter";
  limit?: number;
  table?: { head: string[]; rows: string[][] };
  diagram?: string;
  map?: string;
  flow?: boolean;
  items: Item[];
}
export interface QSet {
  id: string;
  title: string;
  category: string;
  level: string;
  band?: number;
  mock: string | null;
  part?: number;
  mins?: number;
  paras?: [string, string][];
  lines?: [string, string][];
  voices?: Record<string, string>;
  diagram?: string;
  map?: string;
  groups: Group[];
  skill: "L" | "R";
  packId: string;
  generated?: boolean;
}
export interface FlatQ {
  qid: string; setId: string; skill: "L" | "R"; n: number; group: Group; item: Item;
}

/* ---- user data ---- */
export interface Attempt extends Rec {
  ts: number;
  skill: AnySkill;
  kind: "practice" | "diagnostic" | "mock" | "mistakes" | "drill" | "section";
  ref: string;
  title: string;
  correct: number;
  total: number;
  band: number | null;
  secs: number;
  limitSecs?: number;
  byType: Record<string, [number, number]>;
  tags: Record<string, number>;
  level?: string;
  category?: string;
  mockId?: string;
}

export interface ItemStat extends Rec { c: number; w: number; last: number; lastOk: boolean; }

export interface Mistake extends Rec {
  ts: number;
  cat?: string;      // taxonomy category (see taxonomy.ts); set automatically, may be refined by the user
  cause?: string;    // Listening: why the answer was missed (a taxonomy id); user-chosen or inferred from the tag
  due?: string;      // YYYY-MM-DD: next spaced re-check (project estimate schedule, see errorbank.ts)
  src?: string;      // origin: quiz, production, ai-writing, ai-speaking, local-writing
  concept?: string;  // specific grammar concept (lesson id), when known; the general category stays in `cat`
  skill: AnySkill;
  ref: string;       // set id / grammar topic / vocab word id
  qid: string;
  qtype: string;     // question type or category
  tag: string;       // error type
  difficulty: string;
  prompt: string;
  your: string;
  correct: string;
  explanation: string;
  resolved: boolean;
  reviewOk: number;
  reviewCount: number;
}

/** One SRS axis. VocabState keeps its legacy top-level fields as the RECOGNITION axis (no migration needed); `prod` is the PRODUCTION axis. */
export interface AxisState {
  reps: number; interval: number; ease: number; due: string; lapses: number;
  seen: number; ok: number; bad: number; lastTs: number;
  streak: number;   // consecutive correct answers on this axis
  emaMs: number;    // exponential moving average of response time in ms (0 = no timing yet)
}
export interface VocabState extends Rec {
  reps: number; interval: number; ease: number; due: string; lapses: number;
  seen: number; ok: number; bad: number; lastTs: number; first?: number;
  streak?: number; emaMs?: number;   // recognition-axis extras (optional: old records lack them)
  prod?: AxisState;                  // production axis (optional: created on first production answer)
}

/** Grammar structure tracked on two axes, plus evidence of use in Writing. id = "g:<topicId>". */
export interface SkillItem extends Rec {
  kind: "grammar"; cat: string; label: string;
  rec: AxisState; prod: AxisState;
  writing: { uses: number; errors: number; last: number };   // reserved for the Writing Lab (P1); filled from imported feedback when available
}

/** One review event (append-only log). Lets intervals and engine weights be recomputed later. */
export interface Review extends Rec {
  ts: number; item: string; kind: "vocab" | "skill" | "mistake"; axis: "rec" | "prod";
  task: string; ok: boolean; grade: number; ms: number; cat?: string;
}

/** Aggregated Error Bank record, one per category. id = category id. */
export interface ErrorStat extends Rec {
  cat: string; area: string; first: number; last: number; total: number;
  events: number[]; eventAreas: string[];        // parallel arrays, newest last, capped
  streak: number; relapses: number; lastStatus: "weak" | "developing" | "consolidated";
  src: Record<string, number>;
  ex: { a: string; b: string }[];               // recent examples (wrong, correct)
  /** Specific concepts inside the category (grammar lesson ids, e.g. "past-simple-vs-present-perfect"). Optional: old records lack it. `w` = events that came from Writing. */
  concepts?: Record<string, { n: number; last: number; ev: number[]; w: number[]; streak: number }>;
}

export interface Criteria { [k: string]: number | null; }
export interface AiFeedback {
  importedAt: number;
  raw: string;
  overall: number | null;
  criteria: Criteria;
  errors: { original: string; problem: string; category: string; correction: string; explanation?: string }[];
  vocabulary: string[];
  grammar: string[];
  improvements: string[];
  improved?: string;
  band7?: string;
  band8?: string;
  pronunciation?: string;
  summary?: string;
}
export interface Writing extends Rec {
  createdAt: number;
  task: 1 | 2;
  variant: "academic" | "gt";
  promptId: string;
  promptType: string;
  promptText: string;
  text: string;
  secs: number;
  status: "draft" | "submitted";
  submittedAt?: number;
  mockId?: string;
  self?: Criteria;
  ai?: AiFeedback;
  versions?: { text: string; ts: number; secs: number; note?: string }[]; // reserved for the Writing Lab rewrite/compare cycle (P1)
}

export interface Recording extends Rec {
  createdAt: number;
  part: 1 | 2 | 3 | 0; // 0 = shadowing
  topic: string;
  question: string;
  durSecs: number;
  mime: string;
  blob?: Blob;
  size: number;
  transcript: string;
  mockId?: string;
  self?: Criteria;
  ai?: AiFeedback;
}

export interface Session extends Rec { minutes: number; items: number; } // id = YYYY-MM-DD

export interface MockResult extends Rec {
  ts: number;
  mockId: string;
  title: string;
  L: number | null; R: number | null; W: number | null; S: number | null;
  overall: number | null;
  detail: {
    lCorrect?: number; rCorrect?: number;
    timeUsed: Record<string, number>; timeLimit: Record<string, number>;
    byType: Record<string, [number, number]>;
    writingIds: string[]; recordingIds: string[];
  };
  examMode: boolean;
}

export interface ExternalResult extends Rec {
  name: string; date: string;
  L: number | null; R: number | null; W: number | null; S: number | null; overall: number | null;
  /* Cambridge Book Tracker (optional) */
  source?: string; book?: number; test?: number; lRaw?: number | null; rRaw?: number | null; notes?: string;
}

export interface CustomPack extends Rec {
  title: string; kind: string; importedAt: number; data: any; label: string;
}

export interface KV extends Rec { value: any; }
