import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { addTask, deleteTask, editProject, editTask, PHASES, projectProgress, toggleTask, type Project, type Task } from '../core/projects';
import { Body, Button, Card, Chips, ErrorMessage, Field, Heading, Icon, useUI } from '../components/ui';

export function ProjectEditor({ project, onChange, onDelete, onClose }: { project: Project; onChange: (next: Project) => void; onDelete: () => void; onClose: () => void }) {
  const { color, ui } = useUI();
  const [title, setTitle] = useState(project.title);
  const [notes, setNotes] = useState(project.notes);
  const [phase, setPhase] = useState(project.phase);
  const [taskTitle, setTaskTitle] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  function act(fn: () => void) { try { fn(); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Could not update the project.'); } }
  const progress = projectProgress(project);
  return <Card>
    <View style={ui.spread}><Heading>{project.title}</Heading><Button label="Close project" icon="x" tone="quiet" compact onPress={onClose} /></View>
    <View style={{ gap: 8 }}><Text style={ui.caption}>{project.tasks.filter(t => t.done).length} of {project.tasks.length} tasks complete · {progress}%</Text><View style={{ height: 6, backgroundColor: color.pale, borderRadius: 3 }}><View style={{ width: `${progress}%`, height: 6, backgroundColor: color.green, borderRadius: 3 }} /></View></View>
    <Field label="Project name" value={title} onChangeText={setTitle} maxLength={100} />
    <Chips label="Phase" options={PHASES} value={phase} onChange={setPhase} />
    <Field label="Project notes" value={notes} onChangeText={setNotes} multiline maxLength={5000} hint="Brief, playtest notes, and the next thing to try. Saved with the button below." />
    <Button label="Save project details" icon="check" tone="secondary" onPress={() => act(() => onChange(editProject(project, { title, notes, phase })))} />
    <View style={ui.divider} /><Heading small>Build list</Heading>
    {!project.tasks.length && <Body muted>No tasks yet. Add one small step to get moving.</Body>}
    {project.tasks.map(task => <TaskRow key={task.id} task={task}
      onToggle={() => act(() => onChange(toggleTask(project, task.id)))}
      onEdit={value => act(() => onChange(editTask(project, task.id, value)))}
      onDelete={() => act(() => onChange(deleteTask(project, task.id)))} />)}
    <Field label="New task" value={taskTitle} onChangeText={setTaskTitle} maxLength={200} placeholder="e.g. Playtest the first upgrade" onSubmitEditing={() => act(() => { onChange(addTask(project, taskTitle)); setTaskTitle(''); })} />
    <Button label="Add task" icon="plus" tone="secondary" onPress={() => act(() => { onChange(addTask(project, taskTitle)); setTaskTitle(''); })} />
    <ErrorMessage message={error} />
    <View style={ui.divider} />
    {confirmDelete ? <View style={{ gap: 12 }}><Body>Delete “{project.title}” and all its tasks? In an account workspace, this deletion also syncs to other devices.</Body><View style={ui.wrap}><Button label="Delete permanently" tone="danger" onPress={onDelete} /><Button label="Keep project" tone="secondary" onPress={() => setConfirmDelete(false)} /></View></View>
      : <Button label="Delete project" icon="trash-2" tone="danger" onPress={() => setConfirmDelete(true)} />}
  </Card>;
}
function TaskRow({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: () => void; onEdit: (title: string) => void; onDelete: () => void }) {
  const { color, ui } = useUI();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  return <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: color.line, gap: 8 }}>
    <View style={ui.row}>
      <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: task.done }} aria-checked={task.done} accessibilityLabel={`Complete task: ${task.title}`}
        style={{ minHeight: 44, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name={task.done ? 'check-square' : 'square'} tint={color.green} /><Text style={[ui.body, { flex: 1, textDecorationLine: task.done ? 'line-through' : 'none', color: task.done ? color.muted : color.ink }]}>{task.title}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit task: ${task.title}`} onPress={() => { setDraft(task.title); setEditing(!editing); }} style={{ padding: 12, minHeight: 44 }}><Icon name="edit-2" size={17} /></Pressable>
    </View>
    {editing && <View style={{ gap: 8 }}><Field label="Edit task title" value={draft} onChangeText={setDraft} maxLength={200} /><View style={ui.wrap}>
      <Button label="Save task" compact tone="secondary" disabled={!draft.trim()} onPress={() => { onEdit(draft); setEditing(false); }} />
      <Button label="Delete task" compact tone="danger" onPress={onDelete} />
      <Button label="Cancel edit" compact tone="quiet" onPress={() => setEditing(false)} />
    </View></View>}
  </View>;
}
