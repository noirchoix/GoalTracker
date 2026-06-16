<script lang="ts">
  // -----------------------------
  // Types (UI state, camelCase)
  // -----------------------------
  type TaskStatus = 'pending' | 'completed' | 'failed';
  type Task = {
    id: string;
    title: string;
    dueDate: string | null;      // ISO yyyy-mm-dd
    createdAt: string;           // ISO datetime
    durationHours: number;       // hours from createdAt
    completed: boolean;
    completedAt: string | null;
    status: TaskStatus;
    notes: string;
    editing?: boolean;
    openNotes?: boolean;
  };

  // DB row shape (snake_case) coming from the server
  type TaskRowDB = {
    id: string;
    user_id?: string;                 // not used in UI
    title: string;
    due_date: string | null;
    created_at: string;
    duration_hours: number;
    completed: 0 | 1;
    completed_at: string | null;
    status: TaskStatus;
    notes: string;
  };

  type TaskLogRowDB = {
    id: string;
    task_id: string;
    task_title: string;
    event_type: 'note_saved' | 'completed' | 'reopened' | 'audit_failed';
    note_snapshot: string;
    created_at: string;
  };

  // If +page.server.ts returns tasks, accept them here:
  export let data:
    | { tasks: TaskRowDB[]; logs?: TaskLogRowDB[] }
    | undefined;

  // -----------------------------
  // State
  // -----------------------------
  let tasks: Task[] = [];
  let logs: TaskLogRowDB[] = data?.logs ?? [];
  let auditMessage = '';
  let saveMessage = '';

  // New task form
  let newTitle = '';
  let newDueDate: string | null = null;   // <input type="date">
  let newDurationHours = 24;

  // -----------------------------
  // Mapping helpers
  // -----------------------------
  function fromRow(r: TaskRowDB): Task {
    return {
      id: r.id,
      title: r.title,
      dueDate: r.due_date,
      createdAt: r.created_at,
      durationHours: r.duration_hours,
      completed: !!r.completed,
      completedAt: r.completed_at,
      status: r.status,
      notes: r.notes,
      editing: false,
      openNotes: false
    };
  }

  // -----------------------------
  // Time helpers
  // -----------------------------
  const nowIso = () => new Date().toISOString();

  function hoursBetween(aIso: string, bIso: string) {
    const a = new Date(aIso).getTime();
    const b = new Date(bIso).getTime();
    return (b - a) / 36e5;
  }

  function timeLeftHours(task: Task): number {
    const elapsed = hoursBetween(task.createdAt, nowIso());
    return task.durationHours - elapsed;
  }

  function fmtHM(hours: number) {
    const sign = hours < 0 ? '-' : '';
    const h = Math.floor(Math.abs(hours));
    const m = Math.round((Math.abs(hours) - h) * 60);
    return `${sign}${h}h ${m}m`;
  }

  // -----------------------------
  // Initial data
  // -----------------------------
  if (data?.tasks) {
    tasks = data.tasks.map(fromRow);
  } else if (typeof window !== 'undefined') {
    // Fallback in case someone hits this page without server data (CSR nav)
    refresh();
  }

  // -----------------------------
  // CRUD via API
  // -----------------------------
  async function refresh() {
    const res = await fetch('/api/tasks');
    if (!res.ok) return;
    const rows: TaskRowDB[] = await res.json();
    tasks = rows.map(fromRow);
  }

  async function refreshLogs() {
    const res = await fetch('/api/tasks/logs');
    if (!res.ok) return;
    logs = await res.json();
  }

  async function addTask() {
    const title = newTitle.trim();
    if (!title) return;

    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        due_date: newDueDate,
        duration_hours: Number(newDurationHours) || 0,
        notes: ''
      })
    });

    // reset form and reload
    newTitle = '';
    newDueDate = null;
    newDurationHours = 24;
    await refresh();
  }

  async function toggleComplete(task: Task) {
    const completing = !task.completed;
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completed: completing ? 1 : 0,
        completed_at: completing ? nowIso() : null
      })
    });
    await refresh();
    await refreshLogs();
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    tasks = tasks.filter((t) => t.id !== taskId);
  }

  function startEdit(task: Task) {
    task.editing = true;
    tasks = [...tasks];
  }
  function cancelEdit(task: Task) {
    task.editing = false;
    tasks = [...tasks];
  }

  async function saveEdit(task: Task, fields: Partial<Task>) {
  // apply local changes first so bindings reflect the latest values
  task.title = fields.title ?? task.title;
  task.dueDate = fields.dueDate ?? task.dueDate;
  if (fields.durationHours !== undefined) {
    task.durationHours = Math.max(0, Number(fields.durationHours) || 0);
  }

  await fetch(`/api/tasks/${task.id}`, {
    method: 'PUT', // ⟵ use PUT now
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: task.title,
      due_date: task.dueDate,
      duration_hours: task.durationHours,
      // include completion + notes so PUT represents the whole resource
      completed: task.completed ? 1 : 0,
      completed_at: task.completed ? task.completedAt : null,
      notes: task.notes
    })
  });

  task.editing = false;
  await refresh();
  await refreshLogs();
}


  async function saveNotes(task: Task) {
    saveMessage = '';
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: task.notes })
    });
    if (!res.ok) {
      saveMessage = 'Could not save note. Please try again.';
      return;
    }
    saveMessage = 'Note saved.';
    await refreshLogs();
  }

  // -----------------------------
  // Global audit (server recomputes status)
  // -----------------------------
  async function auditAll() {
    auditMessage = 'Running audit...';
    const res = await fetch('/api/tasks/audit', { method: 'POST' });
    if (!res.ok) {
      auditMessage = 'Audit failed. Please try again.';
      return;
    }
    const result = await res.json();
    auditMessage = result.changed
      ? `Audit complete. ${result.changed} task${result.changed === 1 ? '' : 's'} updated.`
      : 'Audit complete. No task status changes.';
    await refresh();
    await refreshLogs();
  }

  function eventLabel(eventType: TaskLogRowDB['event_type']) {
    if (eventType === 'note_saved') return 'Note saved';
    if (eventType === 'completed') return 'Task completed';
    if (eventType === 'reopened') return 'Task reopened';
    return 'Marked failed by audit';
  }
</script>

<svelte:head>
  <link href="/css/notes.css" rel="stylesheet" />
  <title>Notes — Goals</title>
</svelte:head>

<!-- Header / Global actions -->
<header class="toolbar">
  <h1>Goals</h1>
  <div class="spacer"></div>
  <button class="btn ghost" on:click={auditAll} aria-label="Run audit on all tasks">Audit</button>
</header>

{#if auditMessage}
  <section class="card">
    <p class="muted">{auditMessage}</p>
  </section>
{/if}

<!-- New Task Form -->
<section class="card">
  <h2>Create a task</h2>
  <form class="grid" on:submit|preventDefault={addTask}>
    <label class="field">
      <span>Title</span>
      <input
        class="input"
        type="text"
        placeholder="e.g. Draft pitch deck"
        bind:value={newTitle}
        required
        autocomplete="off"
      />
    </label>

    <label class="field">
      <span>Due date</span>
      <!-- Calendar pop-up: native -->
      <input
        class="input"
        type="date"
        bind:value={newDueDate}
        aria-label="Pick a due date"
      />
    </label>

    <label class="field">
      <span>Duration (hours)</span>
      <input
        class="input"
        type="number"
        min="0"
        step="1"
        bind:value={newDurationHours}
        required
      />
    </label>

    <div class="actions">
      <button class="btn" type="submit">Add</button>
    </div>
  </form>
</section>

<!-- Task List -->
<section class="card">
  <h2>Your tasks</h2>

  {#if tasks.length === 0}
    <p class="muted">No tasks yet. Add one above.</p>
  {:else}
    <ul class="list">
      {#each tasks as t (t.id)}
        <li class="row">
          <!-- Complete -->
          <input
            type="checkbox"
            class="check"
            checked={t.completed}
            on:change={() => toggleComplete(t)}
            aria-label="Mark complete"
            title="Mark complete"
          />

          <!-- Main content -->
          <div class="content">
            <!-- Display mode -->
            {#if !t.editing}
              <div class="titleLine">
                <h3 class:done={t.completed}>{t.title}</h3>
                <span class="chip" data-status={t.status}>
                  {#if t.status === 'completed'}✓ Completed
                  {:else if t.status === 'failed'}✗ Failed
                  {:else}⏳ {fmtHM(timeLeftHours(t))} left{/if}
                </span>
              </div>
              <div class="meta">
                {#if t.dueDate}
                  <span class="muted">Due: {t.dueDate}</span>
                {/if}
                <span class="muted">Created: {new Date(t.createdAt).toLocaleString()}</span>
                <span class="muted">Budget: {t.durationHours}h</span>
              </div>
            {/if}

            <!-- Edit mode -->
            {#if t.editing}
              <div class="editGrid">
                <input class="input" type="text" bind:value={t.title} required />
                <input class="input" type="date" bind:value={t.dueDate} />
                <input class="input" type="number" min="0" step="1" bind:value={t.durationHours} />
                <div class="editActions">
                  <button class="btn" on:click|preventDefault={() => saveEdit(t, {})}>Save</button>
                  <button class="btn ghost" on:click|preventDefault={() => cancelEdit(t)}>Cancel</button>
                </div>
              </div>
            {/if}

            <!-- Notes -->
            <details bind:open={t.openNotes} class="notes">
              <summary>Notes</summary>
              <textarea
                class="textarea"
                rows="5"
                placeholder="Log progress, thoughts, obstacles..."
                bind:value={t.notes}
              ></textarea>
              <div class="notesActions">
                <button class="btn" on:click|preventDefault={() => saveNotes(t)}>Save notes</button>
              </div>
            </details>
          </div>

          <!-- Row actions -->
          <div class="rowActions">
            {#if !t.editing}
              <button class="icon" title="Edit" aria-label="Edit" on:click={() => startEdit(t)}>✎</button>
            {/if}
            <button
              class="icon danger"
              title="Delete"
              aria-label="Delete"
              on:click={() => deleteTask(t.id)}
            >🗑</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<section class="card">
  <h2>Task completion log</h2>
  {#if saveMessage}
    <p class="muted">{saveMessage}</p>
  {/if}

  {#if logs.length === 0}
    <p class="muted">No saved notes or completion events yet.</p>
  {:else}
    <ul class="list">
      {#each logs as log (log.id)}
        <li class="row">
          <div class="content">
            <div class="titleLine">
              <h3>{log.task_title}</h3>
              <span class="chip">{eventLabel(log.event_type)}</span>
            </div>
            <div class="meta">
              <span class="muted">{new Date(log.created_at).toLocaleString()}</span>
            </div>
            {#if log.note_snapshot}
              <p class="muted">{log.note_snapshot}</p>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>
