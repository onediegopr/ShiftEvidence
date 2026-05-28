"use client";

import { Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

type ReplayControlsProps = {
  isPlaying: boolean;
  soundEnabled: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRestart: () => void;
  onSkipToReport: () => void;
  onToggleSound: () => void;
};

export default function ReplayControls({
  isPlaying,
  soundEnabled,
  canGoBack,
  canGoNext,
  onPlayPause,
  onPrevious,
  onNext,
  onRestart,
  onSkipToReport,
  onToggleSound,
}: ReplayControlsProps) {
  return (
    <div className="demo-replay-controls" aria-label="Replay controls">
      <button type="button" className="demo-control-btn demo-control-primary" onClick={onPlayPause} data-event="demo_started">
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        <span>{isPlaying ? "Pause" : "Play"}</span>
      </button>

      <button type="button" className="demo-control-btn" onClick={onPrevious} disabled={!canGoBack} aria-label="Previous replay step">
        <SkipBack size={17} />
        <span>Previous</span>
      </button>

      <button type="button" className="demo-control-btn" onClick={onNext} disabled={!canGoNext} aria-label="Next replay step">
        <SkipForward size={17} />
        <span>Next step</span>
      </button>

      <button type="button" className="demo-control-btn" onClick={onRestart} aria-label="Restart replay">
        <RotateCcw size={17} />
        <span>Restart</span>
      </button>

      <button type="button" className="demo-control-btn" onClick={onSkipToReport} data-event="demo_skipped_to_report">
        <span>Skip to report</span>
      </button>

      <button
        type="button"
        className="demo-control-btn demo-sound-toggle"
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? "Disable visual sound mode" : "Enable visual sound mode"}
      >
        {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        <span>{soundEnabled ? "Sound visual on" : "Sound off"}</span>
      </button>
    </div>
  );
}
