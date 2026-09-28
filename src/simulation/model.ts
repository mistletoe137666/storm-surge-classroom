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
  nearshoreWaterLevel: number
  inundationDepth: number
  overtops: boolean
  profile: CoastProfile
}

export type ImpactLevel = {
  key: "none" | "low" | "medium" | "severe"
  label: string
  shortLabel: string
  description: string
  score: ImpactScore
}

export type ImpactScore = {
  wind: number
  tide: number
  coast: number
  total: number
  max: number
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
export const IMPACT_SCORE_MAX = 9
export const WATER_DISPLAY_DROP_METERS = 20 / 30

const coastImpactPoints: Record<CoastCondition, number> = {
  steep: 0,
  slope: 1,
  lowland: 2,
}

export function getWaterRiseProgress(progress: number): number {
  return Math.min(1, Math.max(0, (progress - 0.2) / 0.56))
}

export function getWindSetupPixels(typhoonIntensity: number): number {
  const windRatio = (Math.min(5, Math.max(1, typhoonIntensity)) - 1) / 4
  return 4 + Math.pow(windRatio, 1.3) * 21
}

export function getNearshoreWaterLevel(waterLevel: number, typhoonIntensity: number): number {
  return waterLevel + getWindSetupPixels(typhoonIntensity) / 30
}

export function hasOvertopped(waterLevel: number, seawallHeight: number): boolean {
  return waterLevel - seawallHeight - WATER_DISPLAY_DROP_METERS >= OVERTOP_CLEARANCE
}

function getTideImpactPoints(tideLevel: number): number {
  if (tideLevel < 0.6) return 0
  if (tideLevel < 1.0) return 1
  if (tideLevel < 1.3) return 2
  return 3
}

export function getImpactScore(settings: Pick<SimulationSettings, "typhoonIntensity" | "tideLevel" | "coastCondition">): ImpactScore {
  const wind = Math.min(4, Math.max(0, Math.round(settings.typhoonIntensity) - 1))
  const tide = getTideImpactPoints(settings.tideLevel)
  const coast = coastImpactPoints[settings.coastCondition]

  return { wind, tide, coast, total: wind + tide + coast, max: IMPACT_SCORE_MAX }
}

export function getImpactLevel(
  settings: Pick<SimulationSettings, "typhoonIntensity" | "tideLevel" | "coastCondition">,
  overtopped: boolean,
): ImpactLevel {
  const score = getImpactScore(settings)

  if (overtopped) {
    return { key: "severe", label: "严重影响", shortLabel: "严重", description: "总水位已经越过海堤", score }
  }
  if (score.total >= 8) {
    return { key: "severe", label: "严重影响", shortLabel: "严重", description: "三个条件叠加作用明显", score }
  }
  if (score.total >= 5) {
    return { key: "medium", label: "中度影响", shortLabel: "中度", description: "三个条件叠加作用较明显", score }
  }
  if (score.total >= 2) {
    return { key: "low", label: "轻度影响", shortLabel: "轻度", description: "三个条件的叠加作用较弱", score }
  }
  return { key: "none", label: "暂无明显影响", shortLabel: "暂无", description: "三个条件的叠加作用不明显", score }
}

export function calculateSimulation(settings: SimulationSettings): SimulationResult {
  const profile = coastProfiles[settings.coastCondition]
  const surge = 0.12 + settings.typhoonIntensity * 0.17
  const effectiveSurge = surge * profile.amplification
  const totalWaterLevel = settings.tideLevel + effectiveSurge
  const nearshoreWaterLevel = getNearshoreWaterLevel(totalWaterLevel, settings.typhoonIntensity)
  const inundationDepth = hasOvertopped(nearshoreWaterLevel, profile.seawallHeight)
    ? nearshoreWaterLevel - profile.seawallHeight - WATER_DISPLAY_DROP_METERS
    : 0

  return {
    tideLevel: settings.tideLevel,
    surge,
    effectiveSurge,
    totalWaterLevel,
    nearshoreWaterLevel,
    inundationDepth,
    overtops: inundationDepth > 0,
    profile,
  }
}

export function formatMeters(value: number): string {
  return `${value.toFixed(1)}m`
}
