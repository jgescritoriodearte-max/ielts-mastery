import React, { useEffect, useState } from "react";
import { useStore } from "./lib/store";
import { usePacksVersion } from "./lib/packs";
import { applyUpdate, useOnline, usePwa, useRoute, go } from "./lib/pwa";
import { Icon, Toasts } from "./ui/components";
import { Dashboard } from "./pages/Dashboard";
import { Onboarding } from "./pages/Onboarding";
import { PlanPage } from "./pages/Plan";
import { ListeningPage, ReadingPage } from "./pages/Practice";
import { WritingPage } from "./pages/Writing";
import { SpeakingPage } from "./pages/Speaking";
import { VocabularyPage } from "./pages/Vocabulary";
import { GrammarPage } from "./pages/Grammar";
import { MockPage } from "./pages/Mock";
import { BankPage, MistakesPage } from "./pages/Mistakes";
import { ProgressPage } from "./pages/Progress";
import { AiHubPage } from "./pages/AiHub";
import { LibraryPage } from "./pages/Library";
import { DataPage } from "./pages/Data";
import { SettingsPage } from "./pages/Settings";
import { CambridgePage, ParaphrasePage } from "./pages/Extras";
import { getIndex, isDownloaded } from "./lib/packs";

const NAV: { group: string; items: { to: string; label: string; icon: string; dot?: string }[] }[] = [
  { group: "Overview", items: [
    { to: "", label: "Dashboard", icon: "home" }, { to: "plan", label: "Study Plan", icon: "plan" }, { to: "progress", label: "Progress", icon: "progress" },
  ] },
  { group: "Skills", items: [
    { to: "listening", label: "Listening", icon: "listen", dot: "var(--L)" }, { to: "reading", label: "Reading", icon: "read", dot: "var(--R)" },
    { to: "writing", label: "Writing", icon: "write", dot: "var(--W)" }, { to: "speaking", label: "Speaking", icon: "speak", dot: "var(--S)" },
  ] },
  { group: "Language", items: [
    { to: "vocabulary", label: "Vocabulary", icon: "vocab" }, { to: "grammar", label: "Grammar", icon: "grammar" }, { to: "paraphrase", label: "Paraphrasing", icon: "para" },
  ] },
  { group: "Tests & review", items: [
    { to: "mock", label: "Mock Tests", icon: "mock" }, { to: "cambridge", label: "Cambridge Tracker", icon: "book" }, { to: "mistakes", label: "My Mistakes", icon: "mistakes" }, { to: "bank", label: "Question Bank", icon: "bank" },
  ] },
  { group: "Tools", items: [
    { to: "ai", label: "IELTS AI Tutor", icon: "ai" }, { to: "library", label: "Offline Library", icon: "library" },
    { to: "data", label: "Data & Backup", icon: "data" }, { to: "settings", label: "Settings", icon: "settings" },
  ] },
];

export function App() {
  const s = useStore();
  usePacksVersion();
  const online = useOnline();
  const pwa = usePwa();
  const route = useRoute();
  const [menu, setMenu] = useState(false);
  const [examMode, setExamMode] = useState(false);
  useEffect(() => setMenu(false), [route.path]);
  useEffect(() => {
    const h = (e: Event) => setExamMode(!!(e as CustomEvent).detail);
    window.addEventListener("exam-mode", h);
    return () => window.removeEventListener("exam-mode", h);
  }, []);
  useEffect(() => { document.body.classList.toggle("exam-mode", examMode); }, [examMode]);

  if (!s.ready) return null;
  const [p0, ...rest] = route.parts;
  if (!s.profile.onboarded && p0 !== "data") return <><Onboarding /><Toasts /></>;

  let page: React.ReactNode;
  switch (p0) {
    case undefined: page = <Dashboard />; break;
    case "plan": page = <PlanPage />; break;
    case "listening": page = <ListeningPage parts={rest} query={route.query} />; break;
    case "reading": page = <ReadingPage parts={rest} query={route.query} />; break;
    case "writing": page = <WritingPage parts={rest} />; break;
    case "speaking": page = <SpeakingPage parts={rest} />; break;
    case "vocabulary": page = <VocabularyPage parts={rest} />; break;
    case "grammar": page = <GrammarPage parts={rest} />; break;
    case "mock": page = <MockPage parts={rest} />; break;
    case "mistakes": page = <MistakesPage parts={rest} />; break;
    case "bank": page = <BankPage />; break;
    case "progress": page = <ProgressPage />; break;
    case "ai": page = <AiHubPage parts={rest} />; break;
    case "library": page = <LibraryPage />; break;
    case "data": page = <DataPage />; break;
    case "settings": page = <SettingsPage />; break;
    case "paraphrase": page = <ParaphrasePage parts={rest} />; break;
    case "cambridge": page = <CambridgePage />; break;
    case "onboarding": page = <Onboarding />; break;
    default: page = <Dashboard />;
  }

  const lastBackup = s.kv.lastBackup as number | undefined;
  const hasData = s.attempts.length + s.writings.length + s.recordings.length > 3;
  const backupDue = hasData && (!lastBackup || Date.now() - lastBackup > (s.settings.backupReminderDays || 7) * 864e5);
  const snoozed = (s.kv.backupSnooze || 0) > Date.now();

  return (
    <div className="shell">
      <aside className={"rail" + (menu ? " open" : "")} aria-label="Main navigation">
        <div className="brand"><div className="brand-mark">IM</div><div><b>IELTS Mastery</b><span>Study command centre</span></div></div>
        {NAV.map((g) => (
          <nav className="nav" key={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map((it) => (
              <a key={it.to} href={"#/" + it.to} className={(p0 || "") === it.to ? "on" : ""}>
                <Icon name={it.icon} />{it.label}{it.dot && <span className="dot" style={{ background: it.dot, marginLeft: "auto" }} />}
              </a>
            ))}
          </nav>
        ))}
      </aside>
      <div className={"scrim" + (menu ? " open" : "")} onClick={() => setMenu(false)} />
      <div className="main">
        <header className="topbar">
          <button className="btn ghost icon-btn menu-btn hide-exam" onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <span className="small muted hide-exam" style={{ fontWeight: 600 }}>{examMode ? "" : "IELTS Mastery"}</span>
          <div className="grow" />
          {pwa.updateReady && <button className="btn sm primary hide-exam" onClick={applyUpdate} title="Your progress and offline packs are kept">Update available · Reload</button>}
          {(() => { const ess = getIndex().filter((p) => p.essential); const missing = ess.filter((p) => !isDownloaded(p.id)).length; const ready = pwa.swActive && ess.length > 0 && missing === 0;
            return <a href="#/library" className={"chip hide-exam " + (ready ? "good" : "warn")} title={ready ? "App and all essential packs are stored on this device." : "Open the Offline Library while online and wait until every pack shows Downloaded."}>{ready ? "Offline ready ✓" : missing ? `Not offline yet · ${missing} pack${missing > 1 ? "s" : ""} missing` : "Not offline yet"}</a>; })()}
          <span className={"status " + (online ? "on" : "off")} title={online ? "Connected. Everything works offline too." : "No connection. All study features keep working."}><i />{online ? "ONLINE" : "OFFLINE"}</span>
        </header>
        <main className="content">
          {backupDue && !snoozed && !examMode && p0 !== "data" && (
            <div className="callout warn"><Icon name="data" /><div style={{ flex: 1 }}><b>Back up your progress.</b> {lastBackup ? `Last backup: ${new Date(lastBackup).toLocaleDateString("en-GB")}.` : "You have never exported a backup."} Your data exists only on this device.</div>
              <button className="btn sm" onClick={() => go("/data")}>Export backup</button>
              <button className="btn sm ghost" onClick={() => import("./lib/store").then((m) => m.setKV("backupSnooze", Date.now() + 2 * 864e5))}>Later</button></div>
          )}
          {page}
        </main>
      </div>
      <Toasts />
    </div>
  );
}
