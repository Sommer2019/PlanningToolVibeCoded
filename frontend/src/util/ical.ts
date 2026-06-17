import type { Task } from "../api";

export function downloadTaskIcal(task: Task) {
  const format = (iso: string) => {
     return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  const start = format(task.plannedStart);
  const end = format(task.plannedEnd);
  
  const icalStr = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sommer2019//Planning Module//EN',
    'BEGIN:VEVENT',
    `UID:task-${task.id}@planning.sommer2019.de`,
    `SUMMARY:${task.title}`,
    task.description ? `DESCRIPTION:${task.description.replace(/\n/g, '\\n')}` : undefined,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([icalStr], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `task-${task.id}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
