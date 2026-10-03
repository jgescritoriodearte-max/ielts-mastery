# IELTS Mastery — content specification (for writers of new content files)

All content is ORIGINAL practice material written for this app. Never copy or closely paraphrase
Cambridge, British Council, IDP, IELTS.org or any commercial book. Reproduce the FORMAT of IELTS
Academic tasks, not their texts or questions. Invent names, places, institutions and data.

Every file is an ES module (`.mjs`) that only exports plain data (no imports, no functions).
After writing a file, run the validator and fix EVERY error before you finish:

    node scripts/validate_source.mjs <kind> <path-to-your-file>

kinds: reading | listening | mock | grammar | vocab | paraphrase | prompts

Pedagogical quality rules (they matter more than quantity):
- Every question must test the skill it claims to test. No trivia, no questions answerable without the text.
- Use paraphrase between question and text (as IELTS does). Copying the sentence word-for-word into the question is only acceptable at band 5.5.
- Distractors must be plausible: mentioned in the text but wrong for this question.
- Explanations (`ex`) teach: say WHY the answer is right and, where useful, why the tempting option is wrong.
- Vary topics; avoid repeating the same scenario in one file.
- British spelling by default (colour, organise, centre).

---------------------------------------------------------------------
## 1. Reading set (kind: reading; also used inside mocks)

```js
export const SETS = [
{
 id:"R65-01",                 // practice: R55-, R60-, R65-, R70-, R75- + two digits. Mocks: M02R1..M02R3
 title:"The Return of the Night Train",
 category:"Transport",        // one of: Science, History, Archaeology, Technology, Environment, Psychology, Education,
                              // Culture, Economics, Society, Heritage, Urban planning, Art, Health, Climate, Business, Biology, Geography
 band:6.5,                    // 5.5 | 6 | 6.5 | 7 | 7.5   (difficulty of text + questions)
 mock:null,                   // practice sets: null. Mock sets: "02".."10"
 part:2,                      // mocks only: passage number 1-3 (optional for practice)
 mins:20,                     // suggested time: 15 (5.5-6), 20 (6.5-7.5)
 paras:[ ["A","paragraph text..."], ["B","..."] ],   // labelled A, B, C ... in order
 groups:[ /* question groups, see below */ ]
}
];
```

Passage length (all paragraphs together):
band 5.5: 450-600 words · 6: 550-700 · 6.5: 650-800 · 7: 750-900 · 7.5: 850-1000 · mock passages: 750-950.
Practice sets: 10-14 questions in 2-4 groups. Mock: 13 or 14 questions per passage, 40 in total (13+13+14).

Question group:
```js
{qtype:"True/False/Not Given", instr:"Do the following statements agree with the information in the passage? Choose TRUE, FALSE or NOT GIVEN.",
 options:["TRUE","FALSE","NOT GIVEN"], items:[
  {q:"statement", a:"FALSE", ev:"exact words copied from the passage that prove the answer", ex:"teaching explanation"}
]}
```
Item fields: `q` question, `a` answer, `ev` EVIDENCE = an exact substring of ONE paragraph (or transcript line) — copy it
character for character, `ex` explanation. Optional `strat` = one-line strategy tip.

Allowed Reading qtypes and how to encode them:
- "True/False/Not Given": options ["TRUE","FALSE","NOT GIVEN"]; use all three values in a group of 4+.
- "Yes/No/Not Given": options ["YES","NO","NOT GIVEN"] (writer's opinions; text must contain opinions).
- "Multiple Choice": each item has `opts:["...","...","...","..."]` (4 options) and `a:"A".."D"`.
- "Matching Headings": group `options:["i  heading","ii  heading",...]`, `optKey:"roman"`; more headings than items (2-3 extra);
  each item `q:"Paragraph B"`, `a:"iv"`. Do not test paragraph A if its heading is given as an example.
- "Matching Information": `options:["A","B","C",...]` (paragraph letters); `q` describes a type of information; `a:"C"`.
- "Matching Features": `options:["A  Dr Lena Ortiz","B  ..."]`, `optKey:"letter"`; `a:"B"`.
- "Sentence Completion" | "Summary Completion" | "Note Completion" | "Flow-chart Completion" | "Short Answer":
  gap answers. Group has `limit` (max words: 1, 2 or 3) and instr like "Write NO MORE THAN TWO WORDS from the passage for each answer."
  `q` contains `___` for the gap (Short Answer: a question, no gap). `a` is an ARRAY of accepted answers, e.g. ["solar panels"].
  The first accepted answer must appear in the passage exactly (case-insensitive) and respect the word limit
  (numbers do not count as words). Add alternatives only when genuinely acceptable (e.g. ["1990s","the 1990s"]).
  Flow-chart: add `flow:true` to the group.
- "Table Completion": group has `limit` and `table:{head:[...], rows:[["cell","[1]","cell"],...]}` where [1],[2]... mark the gaps
  in order; items are the gaps in the same order (`q` = short label of the gap, e.g. "Cost in 1990: ___").

## 2. Listening set (kind: listening; also used inside mocks)

```js
export const SETS = [
{
 id:"LP2-03",            // practice: LP1-, LP2-, LP3-, LP4- + two digits (LP = part). Mocks: M02L1..M02L4
 title:"Volunteering at the Coastal Park", category:"Leisure", band:6, mock:null,
 part:2,                 // 1: everyday conversation (2 speakers) · 2: everyday monologue · 3: academic discussion (2-4 speakers) · 4: academic lecture
 voices:{N:"gb_f"},      // speaker letter -> voice. Allowed voices: gb_m, gb_f, gb_m2 (northern English male), sc_f (Scottish female), us_f, us_m
 lines:[ ["N","Good morning everyone..."], ... ],   // one turn per line, natural spoken English
 groups:[ ... ]          // 10 questions per section (exactly 10 in mocks)
}
];
export const MAPS = { "map-LP2-03": { w:360, h:300, title:"Coastal Park", rooms:[{x:10,y:10,w:110,h:80,label:"A"}, {x:125,y:10,w:110,h:80,label:"Car park",fixed:true}, ...], entrance:{x:180,y:285,label:"Main gate"} } };
```
Script length: Part 1 500-750 words, Part 2 550-800, Part 3 600-850, Part 4 650-900.
Write numbers the way they are SPOKEN when the way of saying them matters ("oh one six one", "nineteen ninety-eight",
"a quarter past nine") and spell names letter by letter ("That's K-O-W..." written as "K, O, W, A, L, S, K, I").
Use IELTS features: speakers correct themselves (distractors), give spellings, paraphrase the question wording,
signpost ("moving on to..."). Questions follow the order of the recording.

Listening item fields: `q`, `a`, `ev` (exact substring of ONE line's text), `ex`, and `tag` = the sub-skill the item trains:
one of "numbers", "names", "spelling", "distractors", "paraphrasing", "fast speech", "accents", "detail", "prediction".

Allowed Listening qtypes: "Form Completion", "Note Completion", "Table Completion", "Flow-chart Completion",
"Sentence Completion", "Summary Completion", "Short Answer", "Multiple Choice" (item `opts` with 3 options A-C, `a:"B"`),
"Matching" (group `options:["A  ...","B  ..."]`, `optKey:"letter"`, items are the things to match),
"Map Labelling" (group `map:"map-LP2-03"`, `options` = the room letters used as answers e.g. ["A","B","C","D","E","F","G"],
items `q:"Café"`, `a:"D"`; the MAPS entry must exist in the same file; rooms with letters are unlabelled answer spaces,
fixed rooms carry real names and help orientation; the script must describe positions clearly).
Gap answers: `a` array, word `limit` on the group ("Write ONE WORD AND/OR A NUMBER for each answer." -> limit:1).
The first accepted answer (or its spoken form) must be heard in the script. For numbers give digit forms first:
a:["7.30","7:30"], a:["1998"], a:["£45","45"].

## 3. Mock test (kind: mock) — file content/mocks/mock-NN.mjs

```js
export const MOCK = {
 id:"mock-02", title:"Mock Test 02",
 listening:[ /* 4 listening sets (parts 1-4), ids M02L1..M02L4, mock:"02", 10 questions each, bands rising 5.5 -> 7.5 */ ],
 reading:[ /* 3 reading sets, ids M02R1..M02R3, mock:"02", part 1-3, 13+13+14 questions, bands 6 -> 7.5 */ ],
 writing:{
  t1Academic:{id:"M02-T1A", type:"Line graph", title:"...", prompt:"The graph below shows ...\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
              chart:{ /* see section 7 */ }},
  t1GT:{id:"M02-T1G", type:"Formal letter", title:"...", prompt:"...Write at least 150 words. Begin your letter: Dear Sir or Madam,"},
  t2:{id:"M02-T2", type:"Opinion essay", prompt:"..."}
 },
 speaking:{
  p1:{topic:"...", questions:["...","...","...","..."]},
  p2:{id:"M02-C", topic:"Describe ...", points:["...","...","...","and explain ..."]},
  p3:["...","...","...","..."]
 }
};
export const MAPS = { /* only if a listening section uses Map Labelling; ids "map-M02L2" */ };
```
Mix question types across the 40 Reading questions (at least 6 different types) and the 40 Listening questions.

## 4. Grammar (kind: grammar)

```js
export const GRAMMAR_EXTRA = {           // extra exercises for EXISTING topics (ids listed in the task)
 "articles":[ {lvl:2, cefr:"B2", q:"___ unemployment rate rose in 2020.", opts:["The","A","—"], a:0,
               why:"why the right option is right and the others wrong", natural:"The unemployment rate rose in 2020."} ]
};
export const NEW_TOPICS = [              // new topics: same shape as existing topics
 { id:"punctuation", title:"Punctuation", summary:"...", rules:["...","..."], examples:["...","..."], ex:[ /* exercises */ ] }
];
```
Exercise: `q` contains `___` (or is a question), `opts` 3-4 options, `a` = index of correct option, `lvl` 1-3,
`cefr` "A2"|"B1"|"B2"|"C1" (focus on B2/C1), `why`, `natural` (a natural Band 7+ sentence). Use IELTS contexts
(Task 1 data language, Task 2 arguments, academic topics). No two exercises test the same sentence.

## 5. Vocabulary (kind: vocab)

```js
export const VOCAB_EXTRA = {
 "Academic verbs":[
  ["undermine","v","to make something weaker or less effective, often gradually","Frequent changes of policy can undermine public trust.",
   "weaken","strengthen","undermine confidence","undermined (adj); undermining (n)","minar, enfraquecer","B2"]
 ]
};
```
10 fields: word, part of speech (n, v, adj, adv, phr, conj, prep), definition (original), example containing the word or
an inflected form, synonym, antonym ("" if none), collocation, word family "form (pos); form (pos)" ("" if none),
Portuguese translation, level ("B1"|"B2"|"C1"|"C2"). No word may repeat an existing word (list given in the task).

## 6. Paraphrasing (kind: paraphrase)

```js
export const PARAPHRASE = [
 {id:"PP-001", type:"synonym", band:6, original:"The number of visitors increased sharply.",
  task:"choose", q:"Which sentence has the SAME meaning?", opts:["...","...","...","..."], a:1,
  model:"Visitor numbers rose dramatically.", why:"explanation of the techniques and why the distractors change the meaning"},
 {id:"PP-002", type:"active-passive", band:6.5, original:"Engineers completed the bridge in 1932.",
  task:"complete", q:"The bridge ___ by engineers in 1932.", a:["was completed"], model:"The bridge was completed by engineers in 1932.", why:"..."}
];
```
types: synonym, grammar, active-passive, noun-verb, structure, reporting, academic. task "choose" (4 opts, `a` index) or
"complete" (`q` with ONE `___`, `a` array of accepted answers, max 4 words).

## 7. Writing & Speaking prompts (kind: prompts)

```js
export const WRITING_T1_EXTRA = [
 {id:"T1-x01", type:"Line graph", title:"...", prompt:"The graph below shows ...\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  chart:{kind:"line", unit:"%", xLabels:["2000","2005","2010"], series:[{name:"A",values:[1,2,3]}]}}
];
```
chart kinds: line {unit,xLabels,series[{name,values}]} · bar {unit,categories,series} · pie {pies:[{title,slices:[{label,value}]}]} (values sum to 100)
· table {head,rows (strings)} · process {steps:[...]} · map {maps:[{title,features:[{x,y,w,h,label,road?}]}]} in a 260x200 box
· multi {charts:[chart, chart]}. types: "Line graph","Bar chart","Pie chart","Table","Process","Map","Mixed charts".
```js
export const WRITING_T2_EXTRA = [ {id:"T2-x01", type:"Opinion essay", prompt:"..."} ];
// types: "Opinion essay","Discussion essay","Advantages/Disadvantages","Problem/Solution","Two-part question","Positive/Negative development"
export const SPEAKING_P1_EXTRA = { "Topic name":["q1","q2","q3","q4"] };
export const SPEAKING_P2_EXTRA = [ {id:"C-x01", topic:"Describe ...", points:["...","...","...","and explain ..."], p3:["q","q","q","q"]} ];
```
Part 3 questions move from concrete to abstract (personal -> society -> future/evaluation).
