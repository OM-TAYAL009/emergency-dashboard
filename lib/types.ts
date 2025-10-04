export type EmergencyType = "fire" | "medical" | "other"
export type Urgency = "Immediate" | "High" | "Low" | "Non-urgent"
export type Status = "active" | "pending" | "resolved"

export interface IncidentAnalysis {
  location: string
  victims: number
  injuries: string[]
  resourcesNeeded: string[]
}

export interface Incident {
  id: string
  type: EmergencyType
  priority: number // 1-100
  severity: 1 | 2 | 3 | 4 | 5
  urgency: Urgency
  address: string
  timestamp: string // ISO
  summary: string
  victimsCount: number
  transcription: string
  analysis: IncidentAnalysis
  status: Status
}
