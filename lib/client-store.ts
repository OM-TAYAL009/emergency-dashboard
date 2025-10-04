"use client"

import { ALL_UNITS, type Unit, type UnitType } from "./units"

type Status = "pending" | "processing" | "resolved"

type Assignment = {
  incidentId: string
  unitId?: string
  unitType?: UnitType
  status: Status
}

type AssignmentsState = Record<string, Assignment>
type BusyMap = Record<string, boolean>

const USERS_KEY = "erd_auth_users"
const SESSION_KEY = "erd_auth_session"
const ASSIGNMENTS_KEY = "erd_incident_assignments"
const BUSY_UNITS_KEY = "erd_units_busy"

type StoredUser = { email: string; password: string }

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("erd:store-updated"))
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  console.log("[v0] writeJSON:", key, value)
  localStorage.setItem(key, JSON.stringify(value))
  emitChange()
}

// Auth
export function registerUser(email: string, password: string): { ok: boolean; message: string } {
  const users = readJSON<StoredUser[]>(USERS_KEY, [])
  if (users.find((u) => u.email === email)) {
    return { ok: false, message: "User already exists" }
  }
  users.push({ email, password })
  writeJSON(USERS_KEY, users)
  writeJSON(SESSION_KEY, { email })
  return { ok: true, message: "Registered" }
}

export function loginUser(email: string, password: string): { ok: boolean; message: string } {
  const users = readJSON<StoredUser[]>(USERS_KEY, [])
  const match = users.find((u) => u.email === email && u.password === password)
  if (!match) return { ok: false, message: "Invalid credentials" }
  writeJSON(SESSION_KEY, { email })
  return { ok: true, message: "Logged in" }
}

export function logoutUser() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser(): { email: string } | null {
  return readJSON(SESSION_KEY, null)
}

// Units availability
function getBusy(): BusyMap {
  return readJSON<BusyMap>(BUSY_UNITS_KEY, {})
}
function setBusy(map: BusyMap) {
  writeJSON(BUSY_UNITS_KEY, map)
}
export function getAvailableUnit(type: UnitType): Unit | undefined {
  const busy = getBusy()
  return ALL_UNITS.find((u) => u.type === type && !busy[u.id])
}
export function occupyUnit(unitId: string) {
  console.log("[v0] occupyUnit:", unitId)
  const busy = getBusy()
  busy[unitId] = true
  setBusy(busy)
}
export function releaseUnit(unitId?: string) {
  if (!unitId) return
  console.log("[v0] releaseUnit:", unitId)
  const busy = getBusy()
  delete busy[unitId]
  setBusy(busy)
}

// Assignments and status
function getAssignments(): AssignmentsState {
  return readJSON<AssignmentsState>(ASSIGNMENTS_KEY, {})
}
function setAssignments(state: AssignmentsState) {
  writeJSON(ASSIGNMENTS_KEY, state)
}

export function getIncidentStatus(incidentId: string): Status {
  const s = getAssignments()[incidentId]
  return s?.status ?? "pending"
}
export function getIncidentAssignment(incidentId: string): Assignment | null {
  const s = getAssignments()[incidentId]
  return s ?? null
}

export function assignUnitToIncident(
  incidentId: string,
  type: UnitType,
): { ok: boolean; message: string; unitId?: string } {
  console.log("[v0] assignUnitToIncident:", { incidentId, type })
  const state = getAssignments()
  const already = state[incidentId]
  if (already?.status === "processing") return { ok: true, message: "Already assigned", unitId: already.unitId }
  if (already?.status === "resolved") return { ok: false, message: "Incident already resolved" }

  const unit = getAvailableUnit(type)
  if (!unit) return { ok: false, message: "No available unit" }

  occupyUnit(unit.id)
  state[incidentId] = { incidentId, unitId: unit.id, unitType: type, status: "processing" }
  setAssignments(state)
  return { ok: true, message: "Unit assigned", unitId: unit.id }
}

export function markIncidentResolved(incidentId: string): { ok: boolean; message: string } {
  console.log("[v0] markIncidentResolved:", { incidentId })
  const state = getAssignments()
  const current = state[incidentId]
  if (!current) {
    state[incidentId] = { incidentId, status: "resolved" as const }
    setAssignments(state)
    return { ok: true, message: "Marked resolved" }
  }
  releaseUnit(current.unitId)
  state[incidentId] = { ...current, status: "resolved" }
  setAssignments(state)
  return { ok: true, message: "Marked resolved" }
}

export function getUnitsUtilization(): Record<UnitType, { used: number; free: number; total: number }> {
  const busy = readJSON<BusyMap>(BUSY_UNITS_KEY, {})
  const byType: Record<UnitType, { used: number; free: number; total: number }> = {
    ambulance: { used: 0, free: 0, total: 0 },
    police: { used: 0, free: 0, total: 0 },
    firefighter: { used: 0, free: 0, total: 0 },
  }
  for (const u of ALL_UNITS) {
    byType[u.type].total += 1
    if (busy[u.id]) byType[u.type].used += 1
    else byType[u.type].free += 1
  }
  console.log("[v0] getUnitsUtilization:", byType)
  return byType
}
