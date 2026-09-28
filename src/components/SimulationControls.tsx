import { Wind } from "@phosphor-icons/react"
import type { CoastCondition, SimulationSettings } from "../simulation/model"
import { coastProfiles } from "../simulation/model"

type SimulationControlsProps = {
  settings: SimulationSettings
  onSettingsChange: (settings: SimulationSettings) => void
}

const coastOptions: CoastCondition[] = ["steep", "slope", "lowland"]

export function SimulationControls({ settings, onSettingsChange }: SimulationControlsProps) {
  return (
    <section className="control-section" aria-labelledby="control-title">
      <div className="section-heading">
        <div>
          <h2 id="control-title">调整条件</h2>
          <p>改变一个条件，再观察水位线的变化。</p>
        </div>
        <span className="classroom-note"><Wind size={15} weight="bold" />课堂示意</span>
      </div>

      <div className="control-list">
        <label className="control-row">
          <span className="control-label">
            <span>台风强度</span>
            <strong>强度 {settings.typhoonIntensity} / 5</strong>
          </span>
          <input type="range" min="1" max="5" step="1" value={settings.typhoonIntensity} aria-label="台风强度" onChange={(event) => onSettingsChange({ ...settings, typhoonIntensity: Number(event.target.value) })} />
          <span className="range-hints"><span>弱</span><span>中等</span><span>强</span></span>
        </label>

        <label className="control-row">
          <span className="control-label">
            <span>潮位</span>
            <strong>{settings.tideLevel.toFixed(1)}m</strong>
          </span>
          <input type="range" min="0.2" max="1.6" step="0.1" value={settings.tideLevel} aria-label="潮位" onChange={(event) => onSettingsChange({ ...settings, tideLevel: Number(event.target.value) })} />
          <span className="range-hints"><span>低潮</span><span>平均</span><span>高潮</span></span>
        </label>

        <div className="control-row coast-control">
          <span className="control-label">
            <span>海岸条件</span>
            <strong>坡度与岸线高度</strong>
          </span>
          <div className="segmented-control" role="radiogroup" aria-label="海岸条件">
            {coastOptions.map((option) => (
              <button className={settings.coastCondition === option ? "is-selected" : ""} type="button" role="radio" aria-checked={settings.coastCondition === option} key={option} onClick={() => onSettingsChange({ ...settings, coastCondition: option })}>
                {coastProfiles[option].shortLabel}
              </button>
            ))}
          </div>
          <p className="control-help">{coastProfiles[settings.coastCondition].description}</p>
        </div>
      </div>

    </section>
  )
}
