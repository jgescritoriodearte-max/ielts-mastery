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

export interface VocabState extends Rec {
  reps: number; interval: number; ease: number; due: string; lapses: number;
  seen: number; ok: number; bad: number; lastTs: number; first?: number;
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
