<script setup lang="ts">
/**
 * DayMealPlanner.vue
 * -------------------
 * Vue 3 + TypeScript single-file component.
 *
 * Stores an array of "Day" objects ({ id, label, lunch, dinner }) and keeps
 * it in sync with a local JSON file on disk.
 *
 * Persistence strategy:
 *  - Chrome / Edge (and anything supporting the File System Access API):
 *    you open or create a real file once, and every add/edit/delete writes
 *    straight back to it — no repeated download prompts.
 *  - Other browsers (Firefox, Safari): falls back to "Import JSON" (file
 *    picker + FileReader) and "Export JSON" (Blob download). You import at
 *    the start of a session and export again whenever you want to save.
 *
 * Drop this file into a Vue 3 + TS project (Vite scaffold works out of the
 * box) and use it as <DayMealPlanner />.
 */
import { reactive, ref, computed } from 'vue'

interface Day {
  id: string
  label: string
  lunch: string
  dinner: string
}

interface StoreShape {
  days: Day[]
}

// Narrow, local typing for the File System Access API, which isn't yet
// part of TS's default lib.dom.d.ts in every environment.
interface FileSystemFileHandleLike {
  name: string
  getFile: () => Promise<File>
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>
    close: () => Promise<void>
  }>
}

const days = reactive<Day[]>([])
const fileHandle = ref<FileSystemFileHandleLike | null>(null)
const fileName = ref<string>('')
const statusMessage = ref<string>('No file connected yet.')
const importInput = ref<HTMLInputElement | null>(null)

const supportsFileSystemAccess = computed(
  () => typeof (window as any).showOpenFilePicker === 'function',
)

const newLabel = ref('')
const newLunch = ref('')
const newDinner = ref('')

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `day-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function loadFromStore(parsed: StoreShape | null) {
  days.splice(0, days.length, ...(parsed?.days ?? []))
}

/* ---------- File System Access API path (Chrome / Edge) ---------- */

async function openExistingFile() {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
    })
    fileHandle.value = handle
    fileName.value = handle.name
    const file: File = await handle.getFile()
    const text = await file.text()
    loadFromStore(text ? JSON.parse(text) : { days: [] })
    statusMessage.value = `Connected to "${handle.name}".`
  } catch (err) {
    if ((err as DOMException).name !== 'AbortError') {
      statusMessage.value = 'Could not open that file.'
    }
  }
}

async function createNewFile() {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'meal-plan.json',
      types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
    })
    fileHandle.value = handle
    fileName.value = handle.name
    days.splice(0, days.length)
    await persist()
    statusMessage.value = `Created "${handle.name}".`
  } catch (err) {
    if ((err as DOMException).name !== 'AbortError') {
      statusMessage.value = 'Could not create a file.'
    }
  }
}

async function persist() {
  if (!fileHandle.value) return
  const writable = await fileHandle.value.createWritable()
  const data: StoreShape = { days: days.map((d) => ({ ...d })) }
  await writable.write(JSON.stringify(data, null, 2))
  await writable.close()
  statusMessage.value = `Saved to "${fileHandle.value.name}".`
}

/* ---------- Fallback path (Firefox / Safari) ---------- */

function triggerImport() {
  importInput.value?.click()
}

function handleImportChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{"days":[]}'))
      loadFromStore(parsed)
      fileName.value = file.name
      statusMessage.value = `Imported "${file.name}". Use "Export JSON" to save changes.`
    } catch {
      statusMessage.value = 'That file is not valid JSON.'
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function exportJson() {
  const data: StoreShape = { days: days.map((d) => ({ ...d })) }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.value || 'meal-plan.json'
  link.click()
  URL.revokeObjectURL(url)
  statusMessage.value = `Downloaded "${link.download}".`
}

/* ---------- Shared save + CRUD ---------- */

async function save() {
  if (supportsFileSystemAccess.value && fileHandle.value) {
    await persist()
  } else {
    // No live handle yet in a supporting browser, or a fallback browser:
    // nudge the person toward the right action instead of silently doing nothing.
    statusMessage.value = supportsFileSystemAccess.value
      ? 'Open or create a file first.'
      : 'Use "Export JSON" to save your changes.'
  }
}

function addDay() {
  if (!newLabel.value.trim()) {
    statusMessage.value = 'Give the day a label first (e.g. "Monday").'
    return
  }
  days.push({
    id: uid(),
    label: newLabel.value.trim(),
    lunch: newLunch.value.trim(),
    dinner: newDinner.value.trim(),
  })
  newLabel.value = ''
  newLunch.value = ''
  newDinner.value = ''
  save()
}

function updateDay(id: string, field: 'lunch' | 'dinner' | 'label', value: string) {
  const day = days.find((d) => d.id === id)
  if (day) {
    day[field] = value
    save()
  }
}

function removeDay(id: string) {
  const index = days.findIndex((d) => d.id === id)
  if (index !== -1) {
    days.splice(index, 1)
    save()
  }
}
</script>

<template>
  <div class="planner">
    <header class="planner__header">
      <div>
        <p class="planner__eyebrow">Meal planning, kept on disk</p>
        <h1 class="planner__title">Day Planner</h1>
      </div>
      <p class="planner__status" role="status">{{ statusMessage }}</p>
    </header>

    <section class="planner__toolbar" aria-label="File actions">
      <template v-if="supportsFileSystemAccess">
        <button class="btn btn--ghost" type="button" @click="openExistingFile">
          Open JSON file
        </button>
        <button class="btn btn--ghost" type="button" @click="createNewFile">New JSON file</button>
        <span v-if="fileName" class="planner__filename">{{ fileName }}</span>
      </template>
      <template v-else>
        <button class="btn btn--ghost" type="button" @click="triggerImport">Import JSON</button>
        <button class="btn btn--ghost" type="button" @click="exportJson">Export JSON</button>
        <input
          ref="importInput"
          type="file"
          accept="application/json"
          class="planner__hidden-input"
          @change="handleImportChange"
        />
      </template>
    </section>

    <section class="planner__form" aria-label="Add a day">
      <input
        v-model="newLabel"
        class="field field--label"
        type="text"
        placeholder="Day (e.g. Monday)"
        @keyup.enter="addDay"
      />
      <input
        v-model="newLunch"
        class="field"
        type="text"
        placeholder="Lunch"
        @keyup.enter="addDay"
      />
      <input
        v-model="newDinner"
        class="field"
        type="text"
        placeholder="Dinner"
        @keyup.enter="addDay"
      />
      <button class="btn btn--primary" type="button" @click="addDay">Add day</button>
    </section>

    <ul class="planner__list" v-if="days.length">
      <li v-for="day in days" :key="day.id" class="day-row">
        <input
          class="field field--label"
          type="text"
          :value="day.label"
          @change="updateDay(day.id, 'label', ($event.target as HTMLInputElement).value)"
        />
        <input
          class="field"
          type="text"
          placeholder="Lunch"
          :value="day.lunch"
          @change="updateDay(day.id, 'lunch', ($event.target as HTMLInputElement).value)"
        />
        <input
          class="field"
          type="text"
          placeholder="Dinner"
          :value="day.dinner"
          @change="updateDay(day.id, 'dinner', ($event.target as HTMLInputElement).value)"
        />
        <button class="btn btn--danger" type="button" @click="removeDay(day.id)">Remove</button>
      </li>
    </ul>
    <p v-else class="planner__empty">
      No days yet — add one above, or open a JSON file that already has some.
    </p>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');

.planner {
  --ink: #1f2a24;
  --paper: #f6f4ee;
  --panel: #ffffff;
  --pine: #1b4b43;
  --mustard: #e0a531;
  --line: #dcd6c8;
  --danger: #b3543f;

  max-width: 760px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Inter', system-ui, sans-serif;
  border-radius: 12px;
}

.planner__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  border-bottom: 2px solid var(--pine);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.planner__eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pine);
  font-weight: 600;
}

.planner__title {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 2rem;
  color: var(--ink);
}

.planner__status {
  margin: 0;
  font-size: 0.85rem;
  color: #5a6b62;
  max-width: 240px;
  text-align: right;
}

.planner__toolbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.planner__filename {
  font-size: 0.85rem;
  color: var(--pine);
  font-weight: 500;
}

.planner__hidden-input {
  display: none;
}

.planner__form {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1.4fr auto;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

.planner__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.day-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1.4fr auto;
  gap: 0.6rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.6rem;
  align-items: center;
}

.field {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.55rem 0.7rem;
  font-family: inherit;
  font-size: 0.9rem;
  background: var(--panel);
  color: var(--ink);
}

.field:focus {
  outline: 2px solid var(--mustard);
  outline-offset: 1px;
}

.field--label {
  font-weight: 600;
}

.btn {
  border: none;
  border-radius: 6px;
  padding: 0.55rem 0.9rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn:focus-visible {
  outline: 2px solid var(--mustard);
  outline-offset: 2px;
}

.btn--primary {
  background: var(--pine);
  color: #fff;
}

.btn--ghost {
  background: transparent;
  color: var(--pine);
  border: 1px solid var(--pine);
}

.btn--danger {
  background: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
}

.planner__empty {
  color: #6b7a72;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .planner__form,
  .day-row {
    grid-template-columns: 1fr;
  }
}
</style>
