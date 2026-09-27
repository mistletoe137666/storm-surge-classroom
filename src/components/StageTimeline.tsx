import { Wind, Waves, Plus, HouseSimple } from "@phosphor-icons/react"

type StageTimelineProps = {
  activeStage: number
  overtops: boolean
}

const stages = [
  { label: "向岸风", icon: Wind },
  { label: "海面抬升", icon: Waves },
  { label: "潮位叠加", icon: Plus },
  { label: "越堤淹没", icon: HouseSimple },
]

export function StageTimeline({ activeStage, overtops }: StageTimelineProps) {
  return (
    <div className="stage-timeline" aria-label="风暴潮形成过程">
      {stages.map(({ label, icon: Icon }, index) => (
        <div className={`stage-item ${index <= activeStage ? "is-active" : ""} ${index === activeStage ? "is-current" : ""}`} key={label}>
          <div className="stage-icon" aria-hidden="true">
            <Icon size={16} weight={index <= activeStage ? "fill" : "regular"} />
          </div>
          <span>{index === 3 && !overtops && index <= activeStage ? "未越堤" : label}</span>
        </div>
      ))}
    </div>
  )
}
