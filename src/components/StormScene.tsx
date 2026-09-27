import { getWaterRiseProgress, hasOvertopped, type CoastCondition, type SimulationResult } from "../simulation/model"

type StormSceneProps = {
  coastCondition: CoastCondition
  result: SimulationResult
  progress: number
  activeStage: number
}

const sceneProfiles = {
  steep: { shore: "M 177 196 L 210 187 L 228 155 L 245 132 L 360 132 L 360 260 L 177 260 Z", wallX: 246, wallTop: 127, landTop: 132, buildingsTop: 103 },
  slope: { shore: "M 177 196 L 216 181 L 246 164 L 270 145 L 360 145 L 360 260 L 177 260 Z", wallX: 270, wallTop: 140, landTop: 145, buildingsTop: 116 },
  lowland: { shore: "M 177 196 L 220 185 L 255 176 L 282 168 L 360 168 L 360 260 L 177 260 Z", wallX: 282, wallTop: 163, landTop: 168, buildingsTop: 139 },
}

const stageCallouts = [
  { title: "向岸风推动海水", detail: "风把海水持续推向海岸" },
  { title: "海面逐渐抬升", detail: "海水在岸边慢慢堆积" },
  { title: "潮位叠加", detail: "潮位与抬高的海水位相加" },
]

function waterY(level: number, profile: { wallTop: number; seawallHeight: number }) {
  const y = profile.wallTop + (profile.seawallHeight - Math.min(level, 3)) * 30
  return Math.max(16, y)
}

export function StormScene({ coastCondition, result, progress, activeStage }: StormSceneProps) {
  const profile = sceneProfiles[coastCondition]
  const normalY = waterY(result.tideLevel, { wallTop: profile.wallTop, seawallHeight: result.profile.seawallHeight })
  const targetY = waterY(result.totalWaterLevel, { wallTop: profile.wallTop, seawallHeight: result.profile.seawallHeight })
  const waterRiseProgress = getWaterRiseProgress(progress)
  const visibleLevel = result.tideLevel + result.effectiveSurge * waterRiseProgress
  const currentY = waterY(visibleLevel, { wallTop: profile.wallTop, seawallHeight: result.profile.seawallHeight })
  const currentOvertops = activeStage === 3 && hasOvertopped(visibleLevel, result.profile.seawallHeight)
  const currentInundationDepth = Math.max(0, visibleLevel - result.profile.seawallHeight)
  const inundationProgress = Math.min(1, Math.max(0, (progress - 0.76) / 0.24))
  const overflowRatio = currentOvertops
    ? Math.min(1, Math.max(0, currentInundationDepth / 0.5)) * inundationProgress
    : 0
  const inundationWidth = overflowRatio * (360 - profile.wallX)
  const callout = activeStage < 3 ? stageCallouts[activeStage] : {
    title: currentOvertops ? "超过海堤" : "暂未越堤",
    detail: currentOvertops ? "低洼地开始积水" : "水位还没有越过海堤",
  }

  return (
    <div className="storm-scene-wrap">
      <svg className="storm-scene" viewBox="0 0 360 260" role="img" aria-label="海洋、海堤与低洼居民区的风暴潮侧面剖面示意图">
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
        <g className="wind-lines" stroke="#dbeff0" strokeWidth="1.8" strokeLinecap="round" markerEnd="url(#arrow-marker)"><path d="M17 67 C45 60 68 63 92 61" /><path d="M36 79 C64 72 83 75 111 72" /><path d="M66 51 C89 47 110 50 130 47" /></g>
        <text x="18" y="97" fill="#e9f7f6" fontSize="9" fontWeight="700" letterSpacing="1">向岸风</text>

        <path d={`M0 ${currentY} C38 ${currentY - 7} 64 ${currentY + 5} 101 ${currentY - 2} C138 ${currentY - 9} 165 ${currentY + 4} 203 ${currentY - 3} C238 ${currentY - 9} 278 ${currentY + 4} 360 ${currentY - 4} L360 260 L0 260 Z`} fill="url(#water-gradient)" />
        <path d={`M0 ${currentY + 6} C38 ${currentY - 1} 64 ${currentY + 11} 101 ${currentY + 4} C138 ${currentY - 3} 165 ${currentY + 10} 203 ${currentY + 3} C238 ${currentY - 3} 278 ${currentY + 10} 360 ${currentY + 2} L360 260 L0 260 Z`} fill="url(#water-lines)" />
        <path d={profile.shore} fill="url(#land-gradient)" stroke="#a48b68" strokeWidth="1" />
        <path d="M0 231 C45 224 98 218 145 210 C165 207 177 201 194 194" fill="none" stroke="#4d8d97" strokeOpacity="0.5" strokeWidth="2" />

        <line x1="8" y1={normalY} x2={profile.wallX} y2={normalY} stroke="#d6fbf5" strokeDasharray="4 4" strokeWidth="1.1" strokeOpacity="0.85" />
        <line x1="8" y1={targetY} x2={profile.wallX} y2={targetY} stroke="#ffcc78" strokeDasharray="4 3" strokeWidth="1.5" strokeOpacity="0.95" />
        <g className="water-label water-label-normal"><rect x="10" y={normalY - 14} width="61" height="15" rx="5" fill="#0a5678" fillOpacity="0.85" /><text x="17" y={normalY - 4} fill="#d6fbf5" fontSize="8" fontWeight="700">正常潮位</text></g>
        <g className="water-label water-label-total"><rect x="10" y={Math.max(12, targetY - 14)} width="124" height="15" rx="5" fill="#9a5d1c" fillOpacity="0.94" /><text x="17" y={Math.max(22, targetY - 4)} fill="#fff3dc" fontSize="8" fontWeight="700">总水位：潮位 + 海水位抬升</text></g>

        <g key={activeStage} className={`scene-stage-callout ${currentOvertops && activeStage === 3 ? "is-warning" : ""}`}>
          <rect x="182" y="14" width="166" height="36" rx="6" fill={currentOvertops && activeStage === 3 ? "#f4a340" : "#0b526d"} fillOpacity="0.96" />
          <text x="191" y="29" fill={currentOvertops && activeStage === 3 ? "#44260c" : "#f2fbfa"} fontSize="8.5" fontWeight="800">{callout.title}</text>
          <text x="191" y="42" fill={currentOvertops && activeStage === 3 ? "#5f3411" : "#cbe8e6"} fontSize="7.4">{callout.detail}</text>
        </g>

        <g className="seawall"><rect x={profile.wallX} y={profile.wallTop} width="7" height={260 - profile.wallTop} fill="#526977" /><rect x={profile.wallX - 2} y={profile.wallTop - 3} width="11" height="4" rx="1.5" fill="#304958" /><line x1={profile.wallX - 4} y1={profile.wallTop - 8} x2={profile.wallX + 12} y2={profile.wallTop - 8} stroke="#ffcc78" strokeDasharray="2 2" strokeWidth="1" /><text x={profile.wallX - 5} y={profile.wallTop - 12} fill="#ffe6b0" fontSize="8" fontWeight="700" textAnchor="end">海堤</text></g>

        {inundationWidth > 0 && <g className="inundation"><path d={`M${profile.wallX + 7} ${currentY} L${profile.wallX + 7 + inundationWidth} ${currentY} L${profile.wallX + 7 + inundationWidth} ${profile.landTop} L${profile.wallX + 7} ${profile.landTop} Z`} fill="#278fa4" fillOpacity="0.68" /><path d={`M${profile.wallX + 7} ${currentY + 3} L${profile.wallX + 7 + inundationWidth} ${currentY + 3}`} stroke="#c4f0ea" strokeWidth="1.2" strokeDasharray="4 3" /></g>}

        <g className="buildings" fill="#e6e1d4" stroke="#8b867b" strokeWidth="0.7">
          <path d={`M${profile.wallX + 24} ${profile.buildingsTop + 8} h25 v${profile.landTop - profile.buildingsTop - 8} h-25 Z`} />
          <path d={`M${profile.wallX + 57} ${profile.buildingsTop - 7} h19 v${profile.landTop - profile.buildingsTop + 7} h-19 Z`} />
          <path d={`M${profile.wallX + 86} ${profile.buildingsTop + 17} h32 v${profile.landTop - profile.buildingsTop - 17} h-32 Z`} />
          {[0, 1].map((row) => <g key={`first-${row}`} fill="#71a4aa" stroke="none" opacity="0.84"><rect x={profile.wallX + 29} y={profile.buildingsTop + 17 + row * 10} width="4" height="4" /><rect x={profile.wallX + 39} y={profile.buildingsTop + 17 + row * 10} width="4" height="4" /></g>)}
          {[0, 1, 2].map((row) => <g key={`second-${row}`} fill="#71a4aa" stroke="none" opacity="0.84"><rect x={profile.wallX + 61} y={profile.buildingsTop + 4 + row * 9} width="4" height="4" /><rect x={profile.wallX + 68} y={profile.buildingsTop + 4 + row * 9} width="4" height="4" /></g>)}
        </g>

        <g className="lowland-label"><rect x="292" y={profile.landTop + 13} width="60" height="16" rx="5" fill="#536e6c" fillOpacity="0.9" /><text x="322" y={profile.landTop + 24} textAnchor="middle" fill="#f4f5ec" fontSize="8" fontWeight="700">低洼居民区</text></g>
        {currentOvertops && activeStage === 3 && <g className="overtop-label"><rect x={profile.wallX - 22} y={profile.wallTop - 34} width="78" height="16" rx="5" fill="#f4a340" /><text x={profile.wallX + 17} y={profile.wallTop - 23} textAnchor="middle" fill="#44260c" fontSize="8" fontWeight="800">超过海堤</text></g>}
      </svg>
      <div className="scene-caption"><span>海洋</span><span>海岸剖面</span><span>低洼陆地</span></div>
    </div>
  )
}
