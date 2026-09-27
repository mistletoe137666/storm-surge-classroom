import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowCounterClockwise, Pause, Play, WaveTriangle } from "@phosphor-icons/react"
import { SimulationControls } from "./components/SimulationControls"
import { StageTimeline } from "./components/StageTimeline"
import { StormScene } from "./components/StormScene"
import { calculateSimulation, defaultSettings, formatMeters, getImpactLevel, getWaterRiseProgress, hasOvertopped, type SimulationSettings } from "./simulation/model"

function getStage(progress: number) {
  if (progress < 0.2) return 0
  if (progress < 0.48) return 1
  if (progress < 0.76) return 2
  return 3
}

function App() {
  const [settings, setSettings] = useState<SimulationSettings>(defaultSettings)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const progressRef = useRef(progress)
  const result = useMemo(() => calculateSimulation(settings), [settings])
  const activeStage = getStage(progress)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    if (!isPlaying) return

    let frame = 0
    let start = 0
    const startingProgress = progressRef.current
    const duration = 15000
    const animate = (time: number) => {
      if (!start) start = time
      const elapsed = time - start
      const next = Math.min(1, startingProgress + elapsed / duration)
      progressRef.current = next
      setProgress(next)
      if (next < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        setIsPlaying(false)
      }
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isPlaying])

  const updateSettings = (nextSettings: SimulationSettings) => {
    setSettings(nextSettings)
    if (!isPlaying) setProgress(0)
  }

  const playSimulation = () => {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    if (progress >= 1) setProgress(0)
    setIsPlaying(true)
  }

  const resetSimulation = () => {
    setSettings(defaultSettings)
    setProgress(0)
    setIsPlaying(false)
  }

  const waterRiseProgress = getWaterRiseProgress(progress)
  const currentSeaLevelRise = result.effectiveSurge * waterRiseProgress
  const currentWaterLevel = result.tideLevel + currentSeaLevelRise
  const currentOvertops = activeStage === 3 && hasOvertopped(currentWaterLevel, result.profile.seawallHeight)
  const showImpact = progress >= 1
  const impactLevel = getImpactLevel(settings, result.overtops)
  const stageMessage = currentOvertops && activeStage === 3
    ? "总水位超过海堤，沿岸城市低洼地开始积水。"
    : activeStage === 0
      ? "向岸风把海水持续推向岸边。"
      : activeStage === 1
        ? "海水在岸边堆积，海面逐渐抬升。"
        : activeStage === 2
          ? "抬高的海水位正在与潮位叠加。"
          : "总水位未超过海堤，暂未形成淹没。"

  return (
    <main className="app-shell">
      <div className="page-frame">
        <header className="intro-block">
          <div className="brand-mark" aria-hidden="true"><WaveTriangle size={19} weight="fill" /></div>
          <div>
            <p className="product-label">高中地理 · 课堂模拟</p>
            <h1>风暴潮模拟平台</h1>
            <p className="intro-copy">调整三个条件，观察海面高度和沿岸积水如何变化。</p>
          </div>
        </header>

        <div className="top-actions" aria-label="模拟操作">
          <button className="primary-button" type="button" onClick={playSimulation}>
            {isPlaying ? <Pause size={19} weight="fill" /> : <Play size={19} weight="fill" />}
            {isPlaying ? "暂停模拟" : "开始模拟"}
          </button>
          <button className="secondary-button" type="button" onClick={resetSimulation}>
            <ArrowCounterClockwise size={18} weight="bold" />
            重置
          </button>
        </div>

        <section className="simulation-surface" aria-labelledby="scene-title">
          <div className="surface-heading">
            <div>
              <p className="surface-kicker">侧面海岸剖面</p>
              <h2 id="scene-title">看见水位怎样一步步抬高</h2>
            </div>
            <span className="status-badge"><span className="status-dot" />动态示意</span>
          </div>

          <StormScene
            coastCondition={settings.coastCondition}
            result={result}
            progress={progress}
            activeStage={activeStage}
            typhoonIntensity={settings.typhoonIntensity}
            isPlaying={isPlaying}
          />
          <StageTimeline activeStage={activeStage} overtops={currentOvertops} />

          <div className={`stage-message ${currentOvertops && activeStage === 3 ? "is-warning" : ""}`} aria-live="polite">
            <span className="message-marker" aria-hidden="true" />
            <span>{stageMessage}</span>
          </div>

          <div className="result-grid" aria-live="polite">
            <div><span>海水位抬升</span><strong>{formatMeters(currentSeaLevelRise)}</strong></div>
            <div><span>当前水位</span><strong>{formatMeters(currentWaterLevel)}</strong></div>
            <div><span>海堤高度</span><strong>{formatMeters(result.profile.seawallHeight)}</strong></div>
            <div className={`impact-${showImpact ? impactLevel.key : "pending"}`}><span>沿岸影响</span><strong>{showImpact ? impactLevel.label : "完成后显示"}</strong></div>
          </div>
        </section>

        <SimulationControls settings={settings} onSettingsChange={updateSettings} />
      </div>
    </main>
  )
}

export default App
