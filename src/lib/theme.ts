import { getState } from "./store";
export function applyTheme(): void {
  const t = getState().settings.theme;
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("im-theme", JSON.stringify(t)); } catch { /* small UI preference only */ }
}
