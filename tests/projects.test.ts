import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProject, editProject, addTask, editTask, toggleTask, deleteTask, projectProgress } from '../src/core/projects';

test('creates a trimmed project and independent starter tasks', () => {
  const p = createProject('  Cloud cafe  ', 'Social', 'Test a five minute loop', ['Build counter', 'Playtest']);
  assert.equal(p.title, 'Cloud cafe');
  assert.equal(p.tasks.length, 2);
  assert.notEqual(p.tasks[0]?.id, p.tasks[1]?.id);
  assert.equal(projectProgress(p), 0);
});
test('empty project progress is zero', () => assert.equal(projectProgress(createProject('Test')), 0));
test('task CRUD is immutable and progress survives editing', () => {
  const p = createProject('Test');
  const withTask = addTask(p, '  Create map  ');
  const id = withTask.tasks[0]!.id;
  const edited = editTask(withTask, id, 'Create lobby');
  const done = toggleTask(edited, id);
  assert.equal(p.tasks.length, 0);
  assert.equal(done.tasks[0]?.title, 'Create lobby');
  assert.equal(projectProgress(done), 100);
  assert.equal(projectProgress(toggleTask(done, id)), 0);
  assert.equal(deleteTask(done, id).tasks.length, 0);
});
test('editing project keeps identity and tasks', () => {
  const p = createProject('Old', 'Obby', '', ['Playtest']);
  const edited = editProject(p, { title: 'New', notes: 'First session', phase: 'Testing' });
  assert.equal(edited.id, p.id);
  assert.equal(edited.tasks.length, 1);
  assert.equal(edited.phase, 'Testing');
});
test('rejects empty titles, oversized notes and missing task identifiers', () => {
  assert.throws(() => createProject('  '));
  const p = createProject('Test');
  assert.throws(() => addTask(p, ''));
  assert.throws(() => editProject(p, { notes: 'x'.repeat(5001) }));
  assert.throws(() => toggleTask(p, 'missing'));
  assert.throws(() => editTask(p, 'missing', 'Name'));
});
