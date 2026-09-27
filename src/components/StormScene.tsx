import type { CSSProperties } from "react"
import { getImpactLevel, getWaterRiseProgress, hasOvertopped, type CoastCondition, type SimulationResult } from "../simulation/model"

type StormSceneProps = {
  coastCondition: CoastCondition
  result: SimulationResult
  progress: number
  activeStage: number
  typhoonIntensity: number
  isPlaying: boolean
}

const sceneProfiles = {
  steep: { shore: "M 177 196 L 210 187 L 228 155 L 245 132 L 360 132 L 360 260 L 177 260 Z", wallX: 246, wallTop: 127, landTop: 132, buildingsTop: 103 },
  slope: { shore: "M 177 196 L 216 181 L 246 164 L 270 145 L 360 145 L 360 260 L 177 260 Z", wallX: 270, wallTop: 140, landTop: 145, buildingsTop: 116 },
  lowland: { shore: "M 177 196 L 220 185 L 255 176 L 282 168 L 360 168 L 360 260 L 177 260 Z", wallX: 282, wallTop: 163, landTop: 168, buildingsTop: 139 },
}

const stageCallouts = [
  { title: "向岸风推动海水", detail: "台风越强，海水向岸移动越快" },
  { title: "海面逐渐抬升", detail: "海水在岸边慢慢堆积" },
  { title: "潮位叠加", detail: "潮位与抬高的海水位相加" },
]

const impactColors = {
  none: { background: "#315f6d", foreground: "#eaf5f4", muted: "#bad6d7" },
  low: { background: "#278b84", foreground: "#f1fffb", muted: "#c7f0e9" },
  medium: { background: "#c4862d", foreground: "#fff8e9", muted: "#ffe0a6" },
  severe: { background: "#e7772f", foreground: "#321a09", muted: "#5c2e0d" },
}

function waterY(level: number, profile: { wallTop: number; seawallHeight: number }) {
  const y = profile.wallTop + (profile.seawallHeight - Math.min(level, 3)) * 30
  return Math.max(16, y)
}

function makeSurfacePath(y: number, setup: number, shoreX: number) {
  const baseline = (x: number) => y - setup * Math.min(1, Math.max(0, x / shoreX))
  return `M0 ${baseline(0)} C38 ${baseline(38) - 7} 64 ${baseline(64) + 5} 101 ${baseline(101) - 2} C138 ${baseline(138) - 9} 165 ${baseline(165) + 4} 203 ${baseline(203) - 3} C238 ${baseline(238) - 9} 278 ${baseline(278) + 4} 360 ${baseline(360) - 4} L360 260 L0 260 Z`
}

function makeWavePath(y: number, amplitude: number, setup: number, shoreX: number) {
  const parts = [`M -80 ${y}`]
  const startX = -80
  const segmentWidth = 20
  const segmentCount = 25
  const baseline = (x: number) => y - setup * Math.min(1, Math.max(0, x / shoreX))

  for (let index = 0; index < segmentCount; index += 1) {
    const endX = startX + segmentWidth * (index + 1)
    const startY = baseline(startX + segmentWidth * index)
    const endY = baseline(endX)
    parts.push(`Q ${endX - 10} ${(startY + endY) / 2 - amplitude} ${endX} ${endY}`)
  }

  return parts.join(" ")
}

export function StormScene({ coastCondition, result, progress, activeStage, typhoonIntensity, isPlaying }: StormSceneProps) {
  const profile = sceneProfiles[coastCondition]
  const normalY = waterY(result.tideLevel, { wallTop: profile.wallTop, seawallHeight: result.profile.seawallHeight })
  const targetY = waterY(result.totalWaterLevel, { wallTop: profile.wallTop, seawallHeight: result.profile.seawallHeight })
  const waterRiseProgress = getWaterRiseProgress(progress)
  const visibleLevel = result.tideLevel + result.effectiveSurge * waterRiseProgress
  const shoreY = waterY(visibleLevel, { wallTop: profile.wallTop, seawallHeight: result.profile.seawallHeight })
  const currentOvertops = activeStage === 3 && hasOvertopped(visibleLevel, result.profile.seawallHeight)
  const currentInundationDepth = Math.max(0, visibleLevel - result.profile.seawallHeight)
  const inundationProgress = Math.min(1, Math.max(0, (progress - 0.76) / 0.24))
  const overflowRatio = currentOvertops
    ? Math.min(1, Math.max(0, currentInundationDepth / 0.5)) * inundationProgress
    : 0
  const inundationWidth = overflowRatio * (360 - profile.wallX)
  const impactLevel = getImpactLevel({ typhoonIntensity, tideLevel: result.tideLevel, coastCondition }, result.overtops)
  const impactColor = impactColors[impactLevel.key]
  const windRatio = (typhoonIntensity - 1) / 4
  const windDuration = 4.2 - windRatio * 3
  const waveDuration = 6 - windRatio * 4.6
  const waveAmplitude = 2 + Math.pow(windRatio, 1.1) * 7.5
  const waveShift = 36 + windRatio * 30
  const windSetup = 4 + Math.pow(windRatio, 1.3) * 21
  // Keep the open-ocean reference level fixed; wind setup raises the water only toward shore.
  const currentY = shoreY
  const windStrokeWidth = 1.45 + windRatio * 0.9
  const waveStrokeWidth = 1.8 + windRatio * 1.2
  const waveStyle = {
    animationDuration: `${waveDuration}s`,
    "--wave-shift": `${waveShift}px`,
  } as CSSProperties
  const callout = activeStage < 3 ? stageCallouts[activeStage] : {
    title: currentOvertops ? "海水越过海堤" : "水位未越过海堤",
    detail: currentOvertops ? "水流进入沿岸城市低洼地" : "当前条件下没有形成淹没",
  }

  return (
    <div className="storm-scene-wrap">
      <svg className={`storm-scene ${isPlaying ? "is-playing" : ""}`} viewBox="0 0 360 260" role="img" aria-label="海洋、海堤与沿岸城市的风暴潮侧面剖面示意图">
        <defs>
          <linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#183b55" /><stop offset="1" stopColor="#7db7c3" /></linearGradient>
          <linearGradient id="water-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#32a4b4" /><stop offset="1" stopColor="#07567d" /></linearGradient>
          <linearGradient id="land-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9c49d" /><stop offset="1" stopColor="#b69b71" /></linearGradient>
          <pattern id="water-lines" width="52" height="18" patternUnits="userSpaceOnUse"><path d="M0 7 C12 2 22 12 34 7 C42 4 47 6 52 8" fill="none" stroke="#a9e5e3" strokeOpacity="0.32" strokeWidth="1.2" /></pattern>
          <marker id="arrow-marker" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="#dbeff0" /></marker>
        </defs>

        <rect width="360" height="260" fill="url(#sky-gradient)" />
        <path className="cloud cloud-a" d="M16 40 C36 26 54 29 65 42 C78 34 96 40 98 53 L12 53 C8 48 10 44 16 40 Z" fill="#9ac3c6" fillOpacity="0.24" />
        <path className="cloud cloud-b" d="M142 22 C158 10 173 17 177 28 C191 22 208 28 207 39 L133 39 C130 32 134 27 142 22 Z" fill="#aacdd0" fillOpacity="0.2" />
        <path d="M0 88 C48 83 89 87 128 84 C169 80 206 84 246 80 C285 76 324 81 360 78 L360 125 L0 125 Z" fill="#74b9c5" fillOpacity="0.25" />
        <path d="M0 35 L0 18 M10 35 L10 13 M20 35 L20 19 M30 35 L30 11" stroke="#d7f0ef" strokeOpacity="0.3" strokeWidth="1.2" />
        <g className="wind-lines" style={{ animationDuration: `${windDuration}s` }} stroke="#e5faf7" strokeWidth={windStrokeWidth} strokeLinecap="round" markerEnd="url(#arrow-marker)"><path d="M9 65 C42 57 72 61 106 57" /><path d="M25 80 C58 72 89 76 126 70" /><path d="M57 47 C87 42 118 46 148 41" /></g>
        <g className="wind-lines wind-lines-secondary" style={{ animationDuration: `${windDuration}s`, animationDelay: `${-windDuration / 2}s` }} stroke="#c9ebe9" strokeWidth={1.05 + windRatio * 0.72} strokeLinecap="round" markerEnd="url(#arrow-marker)"><path d="M-35 56 C-9 50 14 53 40 49" /><path d="M-19 90 C7 84 31 86 58 82" /></g>
        <g className="wind-badge">
          <rect x="12" y="89" width="52" height="17" rx="5" fill="#0a526c" fillOpacity="0.88" />
          <text x="20" y="100.5" fill="#e9f7f6" fontSize="8" fontWeight="800">向岸风</text>
        </g>

        <path d={makeSurfacePath(currentY, windSetup, profile.wallX)} fill="url(#water-gradient)" />
        <path d={makeSurfacePath(currentY + 6, windSetup, profile.wallX)} fill="url(#water-lines)" />
        <g className="wave-flow" style={waveStyle} fill="none" strokeLinecap="round">
          <path d={makeWavePath(currentY + 3, waveAmplitude, windSetup, profile.wallX)} stroke="#d5f7f2" strokeOpacity={0.82 + windRatio * 0.12} strokeWidth={waveStrokeWidth} />
          <path d={makeWavePath(currentY + 17, waveAmplitude * 0.72, windSetup, profile.wallX)} stroke="#a9e5e3" strokeOpacity={0.48 + windRatio * 0.1} strokeWidth={1.3 + windRatio * 0.55} />
          <path d={makeWavePath(currentY + 31, waveAmplitude * 0.52, windSetup, profile.wallX)} stroke="#87d3d5" strokeOpacity={0.34 + windRatio * 0.08} strokeWidth={1.1 + windRatio * 0.4} />
        </g>
        <path d={profile.shore} fill="url(#land-gradient)" stroke="#a48b68" strokeWidth="1" />
        <path d="M0 231 C45 224 98 218 145 210 C165 207 177 201 194 194" fill="none" stroke="#4d8d97" strokeOpacity="0.5" strokeWidth="2" />

        <line x1="8" y1={normalY} x2={profile.wallX} y2={normalY} stroke="#d6fbf5" strokeDasharray="4 4" strokeWidth="1.1" strokeOpacity="0.85" />
        <line x1="8" y1={targetY} x2={profile.wallX} y2={targetY} stroke="#ffcc78" strokeDasharray="4 3" strokeWidth="1.5" strokeOpacity="0.95" />
        <g className="water-label water-label-normal"><rect x="10" y={normalY - 14} width="61" height="15" rx="5" fill="#0a5678" fillOpacity="0.85" /><text x="17" y={normalY - 4} fill="#d6fbf5" fontSize="8" fontWeight="700">正常潮位</text></g>
        <g className="water-label water-label-total"><rect x="10" y={Math.max(12, targetY - 14)} width="124" height="15" rx="5" fill="#9a5d1c" fillOpacity="0.94" /><text x="17" y={Math.max(22, targetY - 4)} fill="#fff3dc" fontSize="8" fontWeight="700">总水位：潮位 + 海水位抬升</text></g>

        <g key={activeStage} className="scene-stage-callout">
          <rect x="10" y="12" width="207" height="40" rx="6" fill="#0b526d" fillOpacity="0.96" />
          <text x="19" y="28" fill="#f2fbfa" fontSize="8.6" fontWeight="800">{callout.title}</text>
          <text x="19" y="42" fill="#cbe8e6" fontSize="7.3">{callout.detail}</text>
        </g>
        {progress >= 1 && <g key={impactLevel.key} className="impact-panel">
          <rect x="224" y="12" width="126" height="40" rx="6" fill={impactColor.background} fillOpacity="0.97" />
          <text x="234" y="27" fill={impactColor.muted} fontSize="6.8" fontWeight="700">沿岸影响程度</text>
          <circle cx="235" cy="39" r="2.5" fill={impactColor.foreground} />
          <text x="242" y="43" fill={impactColor.foreground} fontSize="10" fontWeight="800">{impactLevel.shortLabel}</text>
          <text x="278" y="43" fill={impactColor.muted} fontSize="6.8" fontWeight="700">{impactLevel.score.total}/{impactLevel.score.max}分{result.overtops ? " · 越堤" : ""}</text>
        </g>}

        <g className="seawall"><rect x={profile.wallX} y={profile.wallTop} width="7" height={260 - profile.wallTop} fill="#526977" /><rect x={profile.wallX - 2} y={profile.wallTop - 3} width="11" height="4" rx="1.5" fill="#304958" /><line x1={profile.wallX - 4} y1={profile.wallTop - 8} x2={profile.wallX + 12} y2={profile.wallTop - 8} stroke="#ffcc78" strokeDasharray="2 2" strokeWidth="1" /><text x={profile.wallX - 5} y={profile.wallTop - 12} fill="#ffe6b0" fontSize="8" fontWeight="700" textAnchor="end">海堤</text></g>

        {inundationWidth > 0 && <g className="inundation"><path d={`M${profile.wallX + 7} ${currentY} L${profile.wallX + 7 + inundationWidth} ${currentY} L${profile.wallX + 7 + inundationWidth} ${profile.landTop} L${profile.wallX + 7} ${profile.landTop} Z`} fill="#278fa4" fillOpacity="0.68" /><path d={`M${profile.wallX + 7} ${currentY + 3} L${profile.wallX + 7 + inundationWidth} ${currentY + 3}`} stroke="#c4f0ea" strokeWidth="1.2" strokeDasharray="4 3" /></g>}

        <g className="buildings" fill="#e6e1d4" stroke="#8b867b" strokeWidth="0.7">
          <path d={`M${profile.wallX + 24} ${profile.buildingsTop + 8} h25 v${profile.landTop - profile.buildingsTop - 8} h-25 Z`} />
          <path d={`M${profile.wallX + 57} ${profile.buildingsTop - 7} h19 v${profile.landTop - profile.buildingsTop + 7} h-19 Z`} />
          <path d={`M${profile.wallX + 86} ${profile.buildingsTop + 17} h32 v${profile.landTop - profile.buildingsTop - 17} h-32 Z`} />
          {[0, 1].map((row) => <g key={`first-${row}`} fill="#71a4aa" stroke="none" opacity="0.84"><rect x={profile.wallX + 29} y={profile.buildingsTop + 17 + row * 10} width="4" height="4" /><rect x={profile.wallX + 39} y={profile.buildingsTop + 17 + row * 10} width="4" height="4" /></g>)}
          {[0, 1, 2].map((row) => <g key={`second-${row}`} fill="#71a4aa" stroke="none" opacity="0.84"><rect x={profile.wallX + 61} y={profile.buildingsTop + 4 + row * 9} width="4" height="4" /><rect x={profile.wallX + 68} y={profile.buildingsTop + 4 + row * 9} width="4" height="4" /></g>)}
        </g>

        <g className="lowland-label"><rect x="292" y={profile.landTop + 13} width="60" height="16" rx="5" fill="#536e6c" fillOpacity="0.9" /><text x="322" y={profile.landTop + 24} textAnchor="middle" fill="#f4f5ec" fontSize="8" fontWeight="700">沿岸城市</text></g>
        {currentOvertops && activeStage === 3 && <g className="overtop-label"><circle className="overtop-pulse" cx={profile.wallX + 3} cy={profile.wallTop - 2} r="7" fill="none" stroke="#ffd391" strokeWidth="2" /><rect x={profile.wallX - 86} y={profile.wallTop - 29} width="56" height="13" rx="4" fill="#f4a340" /><text x={profile.wallX - 58} y={profile.wallTop - 20} textAnchor="middle" fill="#44260c" fontSize="6.8" fontWeight="800">超过海堤</text></g>}
      </svg>
      <div className="scene-caption"><span>海洋</span><span>海岸剖面</span><span>沿岸城市</span></div>
    </div>
  )
}
