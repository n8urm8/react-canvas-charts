import React from 'react'

type BeatTransportHeaderProps = {
  bpm: number
  isPlaying: boolean
  currentStep: number
  stepDurationMs: number
  onTogglePlay: () => void
  onBpmChange: (nextBpm: number) => void
}

export const BeatTransportHeader: React.FC<BeatTransportHeaderProps> = ({
  bpm,
  isPlaying,
  currentStep,
  stepDurationMs,
  onTogglePlay,
  onBpmChange
}) => {
  return (
    <div className="beat-overlay-header">
      <div>
        <p className="beat-kicker">Neon Sequencer Lab</p>
        <h1 className="beat-title">Beat Charts</h1>
        <p className="beat-subtitle">Visualizer and sequencer floating inside a single parent chart grid.</p>
      </div>
      <div className="beat-transport-panel">
        <button type="button" className="beat-button" onClick={onTogglePlay}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>

        <div className="beat-readout">
          <span>Step</span>
          <strong>{currentStep + 1}</strong>
        </div>

        <label className="beat-slider-group" htmlFor="beat-bpm">
          <span>BPM</span>
          <input
            id="beat-bpm"
            type="range"
            min={60}
            max={190}
            value={bpm}
            onChange={(event) => onBpmChange(Number(event.target.value))}
          />
          <input
            type="number"
            min={60}
            max={190}
            value={bpm}
            onChange={(event) => onBpmChange(Number(event.target.value))}
          />
        </label>

        <div className="beat-readout">
          <span>16th</span>
          <strong>{Math.round(stepDurationMs)}ms</strong>
        </div>
      </div>
    </div>
  )
}
