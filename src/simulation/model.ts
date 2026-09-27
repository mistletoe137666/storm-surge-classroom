export type CoastCondition = "steep" | "slope" | "lowland"

export type SimulationSettings = {
  typhoonIntensity: number
  tideLevel: number
  coastCondition: CoastCondition
}

export type CoastProfile = {
  label: string
  shortLabel: string
  amplification: number
  seawallHeight: number
  slope: "steep" | "slope" | "lowland"
  description: string
}

export type SimulationResult = {
  tideLevel: number
  surge: number
  effectiveSurge: number
  totalWaterLevel: number
  inundationDepth: number
  overtops: boolean
  profile: CoastProfile
}

export const coastProfiles: Record<CoastCondition, CoastProfile> = {
  steep: {
    label: "陡岸",
    shortLabel: "陡岸",
    amplification: 0.78,
    seawallHeight: 1.55,
    slope: "steep",
    description: "岸线较陡，海水向陆地推进的距离较小。",
  },
  slope: {
    label: "缓坡海岸",
    shortLabel: "缓坡",
    amplification: 1,
    seawallHeight: 1.35,
    slope: "slope",
    description: "岸线较缓，海水在岸边堆积时更容易影响海堤附近。",
  },
  lowland: {
    label: "低洼海岸",
    shortLabel: "低洼",
    amplification: 1.16,
    seawallHeight: 1.12,
    slope: "lowland",
    description: "地势低平，越堤后积水更容易向居民区扩展。",
  },
}

export const defaultSettings: SimulationSettings = {
  typhoonIntensity: 3,
  tideLevel: 0.9,
  coastCondition: "slope",
}

export const OVERTOP_CLEARANCE = 0.08

export function getWaterRiseProgress(progress: number): number {
  return Math.min(1, Math.max(0, (progress - 0.2) / 0.56))
}

export function hasOvertopped(waterLevel: number, seawallHeight: number): boolean {
  return waterLevel - seawallHeight >= OVERTOP_CLEARANCE
}

export function calculateSimulation(settings: SimulationSettings): SimulationResult {
  const profile = coastProfiles[settings.coastCondition]
  const surge = 0.12 + settings.typhoonIntensity * 0.17
  const effectiveSurge = surge * profile.amplification
  const totalWaterLevel = settings.tideLevel + effectiveSurge
  const inundationDepth = hasOvertopped(totalWaterLevel, profile.seawallHeight)
    ? totalWaterLevel - profile.seawallHeight
    : 0

  return {
    tideLevel: settings.tideLevel,
    surge,
    effectiveSurge,
    totalWaterLevel,
    inundationDepth,
    overtops: inundationDepth > 0,
    profile,
  }
}

export function formatMeters(value: number): string {
  return `${value.toFixed(1)}m`
}
