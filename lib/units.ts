export type UnitType = "ambulance" | "police" | "firefighter"

export interface Unit {
  id: string
  label: string
  type: UnitType
}

const makeUnits = (prefix: string, type: UnitType): Unit[] =>
  Array.from({ length: 10 }).map((_, i) => ({
    id: `${type}-${i + 1}`,
    label: `${prefix} ${i + 1}`,
    type,
  }))

export const AMBULANCE_UNITS = makeUnits("Ambulance", "ambulance")
export const POLICE_UNITS = makeUnits("Police Unit", "police")
export const FIREFIGHTER_UNITS = makeUnits("Firefighter", "firefighter")

export const ALL_UNITS: Unit[] = [...AMBULANCE_UNITS, ...POLICE_UNITS, ...FIREFIGHTER_UNITS]
