export const PHASES = ['Prototype', 'Building', 'Testing', 'Live'] as const;
export type Phase = typeof PHASES[number];
export type Task = { id: string; title: string; done: boolean };
export type Project = {
  id: string; title: string; genre: string; notes: string; phase: Phase;
  tasks: Task[]; createdAt: string; updatedAt: string;
};
export const MAX_PROJECTS = 100;
export const MAX_TASKS = 200;
export function makeId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`; }
export function cleanText(value: string, name: string, max: number, required = true) {
  const result = value.trim();
  if ((required && !result) || result.length > max) throw new Error(`${name} ${required ? 'is required and ' : ''}must be at most ${max} characters.`);
  return result;
}
export function createProject(title: string, genre = 'Custom', notes = '', taskTitles: string[] = []): Project {
  if (taskTitles.length > MAX_TASKS) throw new Error(`Use at most ${MAX_TASKS} tasks.`);
  const now = new Date().toISOString();
  return {
    id: makeId(), title: cleanText(title, 'Project name', 100), genre: cleanText(genre, 'Genre', 40),
    notes: cleanText(notes, 'Notes', 5000, false), phase: 'Prototype', createdAt: now, updatedAt: now,
    tasks: taskTitles.map(t => ({ id: makeId(), title: cleanText(t, 'Task', 200), done: false })),
  };
}
function touched(project: Project, patch: Partial<Project>): Project { return { ...project, ...patch, updatedAt: new Date().toISOString() }; }
export function editProject(project: Project, patch: Partial<Pick<Project, 'title' | 'notes' | 'phase'>>): Project {
  if (patch.phase && !PHASES.includes(patch.phase)) throw new Error('Choose a valid project phase.');
  return touched(project, {
    title: patch.title === undefined ? project.title : cleanText(patch.title, 'Project name', 100),
    notes: patch.notes === undefined ? project.notes : cleanText(patch.notes, 'Notes', 5000, false),
    phase: patch.phase ?? project.phase,
  });
}
export function addTask(project: Project, title: string) {
  if (project.tasks.length >= MAX_TASKS) throw new Error(`Use at most ${MAX_TASKS} tasks per project.`);
  return touched(project, { tasks: [...project.tasks, { id: makeId(), title: cleanText(title, 'Task', 200), done: false }] });
}
function requireTask(project: Project, id: string) {
  if (!project.tasks.some(t => t.id === id)) throw new Error('Task was not found.');
}
export function editTask(project: Project, id: string, title: string) {
  requireTask(project, id);
  const clean = cleanText(title, 'Task', 200);
  return touched(project, { tasks: project.tasks.map(t => t.id === id ? { ...t, title: clean } : t) });
}
export function toggleTask(project: Project, id: string) {
  requireTask(project, id);
  return touched(project, { tasks: project.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) });
}
export function deleteTask(project: Project, id: string) {
  requireTask(project, id);
  return touched(project, { tasks: project.tasks.filter(t => t.id !== id) });
}
export function projectProgress(project: Project) {
  return project.tasks.length ? Math.round(100 * project.tasks.filter(t => t.done).length / project.tasks.length) : 0;
}
