import React from 'react'

type BeatTransportHeaderProps = {
  bpm: number
  isPlaying: boolean
  currentStep: number
  totalSteps: number
  stepDurationMs: number
  onTogglePlay: () => void
  onBpmChange: (nextBpm: number) => void
}

export const BeatTransportHeader: React.FC<BeatTransportHeaderProps> = ({
  bpm,
  isPlaying,
  currentStep,
  totalSteps,
  stepDurationMs,
  onTogglePlay,
  onBpmChange
}) => {
  return (
    <div className="beat-transport-panel">
      <button type="button" className="beat-button" onClick={onTogglePlay}>
        {isPlaying ? 'Stop' : 'Play'}
      </button>

      <div className="beat-readout">
        <span>Step</span>
        <strong>{`${currentStep + 1}/${totalSteps}`}</strong>
      </div>

      <label className="beat-slider-group" htmlFor="beat-bpm">
        <span>BPM</span>
        <input
          id="beat-bpm"
          type="range"
          min={60}
          max={500}
          value={bpm}
          onChange={(event) => onBpmChange(Number(event.target.value))}
        />
        <input
          type="number"
          min={60}
          max={500}
          value={bpm}
          onChange={(event) => onBpmChange(Number(event.target.value))}
        />
      </label>

      <div className="beat-readout">
        <span>16th</span>
        <strong>{Math.round(stepDurationMs)}ms</strong>
      </div>
    </div>
  )
}
