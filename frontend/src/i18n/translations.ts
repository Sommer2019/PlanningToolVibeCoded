export type Lang = "en" | "de";
export type LangPref = "system" | "en" | "de";

export const LANGS: Lang[] = ["en", "de"];
export const LANG_PREFS: LangPref[] = ["system", "en", "de"];

type Dict = Record<string, string>;

// Flat key -> string. Use {name} placeholders for interpolation.
const en: Dict = {
  "app.title": "Planning & Tracking",
  "nav.board": "Board",
  "nav.roadmap": "Roadmap",
  "nav.tasklist": "Tasklist",
  "nav.calendar": "Calendar",
  "nav.members": "Members",

  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.create": "Create",
  "common.save": "Save",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.add": "Add",
  "common.all": "All",
  "common.today": "Today",
  "common.prev": "← Prev",
  "common.next": "Next →",
  "common.copy": "Copy",
  "common.actingAs": "Acting as",
  "common.language": "Language",
  "common.theme": "Theme",
  "theme.system": "System",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "lang.system": "System",

  "projects.title": "Projects",
  "projects.new": "+ New project",
  "projects.empty": "No projects yet. Create one to get started.",
  "projects.owner": "Owner",
  "projects.since": "since",
  "projects.noDescription": "No description",
  "projects.join.title": "Join a project",
  "projects.join.hint": "Paste a project ID to request membership (owner/admin approves).",
  "projects.join.placeholder": "project id",
  "projects.join.button": "Request to join",
  "projects.join.sent": "Join request sent — an admin/owner needs to approve it.",
  "projects.join.failed": "Could not request to join.",
  "projects.form.name": "Name *",
  "projects.form.description": "Description",
  "projects.form.titleNew": "New project",

  "board.myTasks": "My tasks",
  "board.allTasks": "All tasks",
  "board.allTasksOption": "All tasks (owner/admin)",
  "board.filter.mine": "Mine",
  "board.filter.all": "All",
  "board.filter.label": "Show",
  "board.newTask": "+ New task",
  "board.empty": "No tasks on this board yet.",
  "board.lock": "Lock",
  "board.unlock": "Unlock",
  "board.locked": "Locked",
  "board.confirmDelete": 'Delete task "{title}"?',
  "board.addStatus": "Add Status",
  "board.statusDialog.title": "New Status",
  "board.statusDialog.name": "Name *",
  "board.statusDialog.errRequired": "Name is required.",

  "task.form.titleNew": "New task",
  "task.form.titleEdit": "Edit task",
  "task.form.title": "Title *",
  "task.form.description": "Description",
  "task.form.assignee": "Assignee",
  "task.form.status": "Status *",
  "task.form.plannedStart": "Planned start *",
  "task.form.plannedEnd": "Planned end *",
  "task.form.noMembers": "No members",
  "task.form.noAssignee": "No User",
  "task.form.errRequired": "Title and status are required.",
  "task.form.errDates": "Planned end must not be before planned start.",

  "roadmap.task": "Task",
  "roadmap.empty": "No tasks to show on the roadmap.",
  "roadmap.outside": "outside range",

  "tasklist.assignee": "Assignee",
  "tasklist.status": "Status",
  "tasklist.from": "From",
  "tasklist.to": "To",
  "tasklist.colTitle": "Title",
  "tasklist.colStart": "Start",
  "tasklist.colEnd": "End",
  "tasklist.empty": "No tasks match the filters.",

  "calendar.entry.new": "+ Calendar entry",
  "calendar.subscribe.title": "Subscribe (iCal / CalDAV)",
  "calendar.subscribe.hint":
    "Read-only feed compatible with any calendar client. The token in the URL is the credential.",
  "calendar.subscribe.project": "Project feed link",
  "calendar.subscribe.personal": "My personal feed link",
  "calendar.more": "+{n} more",
  "calendar.entry.titleNew": "New calendar entry",
  "calendar.entry.title": "Title *",
  "calendar.entry.description": "Description",
  "calendar.entry.start": "Start *",
  "calendar.entry.end": "End *",
  "calendar.entry.scope": "Visible to the whole project (otherwise personal)",
  "calendar.entry.errTitle": "Title is required.",
  "calendar.entry.errDates": "End must not be before start.",

  "members.title": "Members ({n})",
  "members.colUser": "User",
  "members.colRole": "Role",
  "members.colActions": "Actions",
  "members.remove": "Remove",
  "members.roleMember": "member",
  "members.requests.title": "Join requests ({n})",
  "members.requests.empty": "No pending requests.",
  "members.approve": "Approve",
  "members.reject": "Reject",
  "members.add.title": "Add member directly",
  "members.add.userRef": "user reference (sub)",
  "members.add.role": "role (optional)",
};

const de: Dict = {
  "app.title": "Planung & Tracking",
  "nav.board": "Board",
  "nav.roadmap": "Roadmap",
  "nav.tasklist": "Aufgabenliste",
  "nav.calendar": "Kalender",
  "nav.members": "Mitglieder",

  "common.loading": "Lädt…",
  "common.cancel": "Abbrechen",
  "common.create": "Erstellen",
  "common.save": "Speichern",
  "common.edit": "Bearbeiten",
  "common.delete": "Löschen",
  "common.add": "Hinzufügen",
  "common.all": "Alle",
  "common.today": "Heute",
  "common.prev": "← Zurück",
  "common.next": "Weiter →",
  "common.copy": "Kopieren",
  "common.actingAs": "Angemeldet als",
  "common.language": "Sprache",
  "common.theme": "Design",
  "theme.system": "System",
  "theme.light": "Hell",
  "theme.dark": "Dunkel",
  "lang.system": "System",

  "projects.title": "Projekte",
  "projects.new": "+ Neues Projekt",
  "projects.empty": "Noch keine Projekte. Erstelle eines, um zu starten.",
  "projects.owner": "Eigentümer",
  "projects.since": "seit",
  "projects.noDescription": "Keine Beschreibung",
  "projects.join.title": "Projekt beitreten",
  "projects.join.hint":
    "Projekt-ID einfügen, um eine Mitgliedschaft anzufragen (Eigentümer/Admin bestätigt).",
  "projects.join.placeholder": "Projekt-ID",
  "projects.join.button": "Beitritt anfragen",
  "projects.join.sent": "Beitrittsanfrage gesendet — ein Admin/Eigentümer muss sie bestätigen.",
  "projects.join.failed": "Beitritt konnte nicht angefragt werden.",
  "projects.form.name": "Name *",
  "projects.form.description": "Beschreibung",
  "projects.form.titleNew": "Neues Projekt",

  "board.myTasks": "Meine Aufgaben",
  "board.allTasks": "Alle Aufgaben",
  "board.allTasksOption": "Alle Aufgaben (Eigentümer/Admin)",
  "board.filter.mine": "Meins",
  "board.filter.all": "Alle",
  "board.filter.label": "Anzeigen",
  "board.newTask": "+ Neue Aufgabe",
  "board.empty": "Noch keine Aufgaben auf diesem Board.",
  "board.lock": "Sperren",
  "board.unlock": "Entsperren",
  "board.locked": "Gesperrt",
  "board.confirmDelete": 'Aufgabe „{title}" löschen?',
  "board.addStatus": "Status hinzufügen",
  "board.statusDialog.title": "Neuer Status",
  "board.statusDialog.name": "Name *",
  "board.statusDialog.errRequired": "Name ist erforderlich.",

  "task.form.titleNew": "Neue Aufgabe",
  "task.form.titleEdit": "Aufgabe bearbeiten",
  "task.form.title": "Titel *",
  "task.form.description": "Beschreibung",
  "task.form.assignee": "Zuständige Person",
  "task.form.status": "Status *",
  "task.form.plannedStart": "Geplanter Start *",
  "task.form.plannedEnd": "Geplantes Ende *",
  "task.form.noMembers": "Keine Mitglieder",
  "task.form.noAssignee": "Kein Benutzer",
  "task.form.errRequired": "Titel und Status sind Pflicht.",
  "task.form.errDates": "Geplantes Ende darf nicht vor dem Start liegen.",

  "roadmap.task": "Aufgabe",
  "roadmap.empty": "Keine Aufgaben für die Roadmap.",
  "roadmap.outside": "außerhalb des Zeitraums",

  "tasklist.assignee": "Zuständig",
  "tasklist.status": "Status",
  "tasklist.from": "Von",
  "tasklist.to": "Bis",
  "tasklist.colTitle": "Titel",
  "tasklist.colStart": "Start",
  "tasklist.colEnd": "Ende",
  "tasklist.empty": "Keine Aufgaben entsprechen den Filtern.",

  "calendar.entry.new": "+ Kalendereintrag",
  "calendar.subscribe.title": "Abonnieren (iCal / CalDAV)",
  "calendar.subscribe.hint":
    "Schreibgeschützter Feed, kompatibel mit jedem Kalender-Client. Das Token in der URL ist die Berechtigung.",
  "calendar.subscribe.project": "Projekt-Feed-Link",
  "calendar.subscribe.personal": "Mein persönlicher Feed-Link",
  "calendar.more": "+{n} weitere",
  "calendar.entry.titleNew": "Neuer Kalendereintrag",
  "calendar.entry.title": "Titel *",
  "calendar.entry.description": "Beschreibung",
  "calendar.entry.start": "Start *",
  "calendar.entry.end": "Ende *",
  "calendar.entry.scope": "Für das ganze Projekt sichtbar (sonst persönlich)",
  "calendar.entry.errTitle": "Titel ist erforderlich.",
  "calendar.entry.errDates": "Ende darf nicht vor dem Start liegen.",

  "members.title": "Mitglieder ({n})",
  "members.colUser": "Benutzer",
  "members.colRole": "Rolle",
  "members.colActions": "Aktionen",
  "members.remove": "Entfernen",
  "members.roleMember": "Mitglied",
  "members.requests.title": "Beitrittsanfragen ({n})",
  "members.requests.empty": "Keine offenen Anfragen.",
  "members.approve": "Bestätigen",
  "members.reject": "Ablehnen",
  "members.add.title": "Mitglied direkt hinzufügen",
  "members.add.userRef": "Benutzer-Referenz (sub)",
  "members.add.role": "Rolle (optional)",
};

export const messages: Record<Lang, Dict> = { en, de };

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let s = messages[lang][key] ?? messages.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
}

/** Language implied by the OS/browser. */
export function systemLang(): Lang {
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

export function initialLangPref(): LangPref {
  const stored = localStorage.getItem("planning_lang");
  return stored === "system" || stored === "en" || stored === "de" ? stored : "system";
}

export function resolveLang(pref: LangPref): Lang {
  return pref === "system" ? systemLang() : pref;
}
