import { useEffect, useMemo, useState } from "react"
import { Info, WaveTriangle } from "@phosphor-icons/react"
import { SimulationControls } from "./components/SimulationControls"
import { StageTimeline } from "./components/StageTimeline"
import { StormScene } from "./components/StormScene"
import { calculateSimulation, defaultSettings, formatMeters, type SimulationSettings } from "./simulation/model"

function getStage(progress: number) {
  if (progress < 0.2) return 0
  if (progress < 0.48) return 1
  if (progress < 0.76) return 2
  return 3
}

function App() {
  const [settings, setSettings] = useState<SimulationSettings>(defaultSettings)
  const [progress, setProgress] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const result = useMemo(() => calculateSimulation(settings), [settings])
  const activeStage = getStage(progress)

  useEffect(() => {
    if (!isPlaying) return

    let frame = 0
    let start = 0
    const duration = 7200
    const animate = (time: number) => {
      if (!start) start = time
      const elapsed = time - start
      const next = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - next, 3)
      setProgress(eased)
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
    if (!isPlaying) setProgress(1)
  }

  const playSimulation = () => {
    setProgress(0)
    setIsPlaying(true)
  }

  const resetSimulation = () => {
    setSettings(defaultSettings)
    setProgress(1)
    setIsPlaying(false)
  }

  const stageMessage = result.overtops && activeStage === 3
    ? "总水位超过海堤，低洼地开始积水。"
    : activeStage === 0
      ? "向岸风把海水持续推向岸边。"
      : activeStage === 1
        ? "海水在岸边堆积，海面逐渐抬升。"
        : activeStage === 2
          ? "异常增水正在与天文潮位叠加。"
          : "总水位未超过海堤，暂未形成淹没。"

  return (
    <main className="app-shell">
      <div className="page-frame">
        <header className="intro-block">
          <div className="brand-mark" aria-hidden="true"><WaveTriangle size={19} weight="fill" /></div>
          <div>
            <p className="product-label">高中地理 · 课堂模拟</p>
            <h1>风暴潮是怎样形成的？</h1>
            <p className="intro-copy">调整三个条件，观察海面高度和沿岸积水如何变化。</p>
          </div>
        </header>

        <section className="simulation-surface" aria-labelledby="scene-title">
          <div className="surface-heading">
            <div>
              <p className="surface-kicker">侧面海岸剖面</p>
              <h2 id="scene-title">看见水位怎样一步步抬高</h2>
            </div>
            <span className="status-badge"><span className="status-dot" />动态示意</span>
          </div>

          <StormScene coastCondition={settings.coastCondition} result={result} progress={progress} />
          <StageTimeline activeStage={activeStage} overtops={result.overtops} />

          <div className={`stage-message ${result.overtops && activeStage === 3 ? "is-warning" : ""}`} aria-live="polite">
            <span className="message-marker" aria-hidden="true" />
            <span>{stageMessage}</span>
          </div>

          <div className="result-grid" aria-live="polite">
            <div><span>异常增水</span><strong>{formatMeters(result.effectiveSurge)}</strong></div>
            <div><span>总水位</span><strong>{formatMeters(result.totalWaterLevel)}</strong></div>
            <div><span>海堤高度</span><strong>{formatMeters(result.profile.seawallHeight)}</strong></div>
            <div className={result.overtops ? "is-warning" : "is-safe"}><span>结果</span><strong>{result.overtops ? "低洼区积水" : "未越堤"}</strong></div>
          </div>
        </section>

        <SimulationControls settings={settings} isPlaying={isPlaying} onSettingsChange={updateSettings} onPlay={playSimulation} onReset={resetSimulation} />

        <aside className="explain-note">
          <Info size={18} weight="fill" aria-hidden="true" />
          <p>本页面为课堂示意模型，数值用于帮助理解“风、潮、岸”如何共同影响沿岸水位。</p>
        </aside>
      </div>
    </main>
  )
}

export default App
