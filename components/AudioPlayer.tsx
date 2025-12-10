import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | undefined;
  duration?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const duration = audioBuffer?.duration || 0;

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const playAudio = async () => {
    if (!audioBuffer) return;

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    // Start playing from where we left off (pauseTime)
    const offset = pauseTimeRef.current % duration;
    source.start(0, offset);
    
    startTimeRef.current = audioContextRef.current.currentTime - offset;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      // Only reset if we reached the end naturally (not stopped by user)
      // Note: onended fires even on stop(), so we check if progress is near 100% or implement distinct logic
      // For simplicity here, we let the animation loop handle the final state reset
    };

    requestAnimationFrame(updateProgress);
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
      if (audioContextRef.current) {
         pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      }
      setIsPlaying(false);
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
        try {
            sourceNodeRef.current.stop();
        } catch (e) {
            // Ignore errors if already stopped
        }
    }
    sourceNodeRef.current = null;
    setIsPlaying(false);
    cancelAnimationFrame(animationFrameRef.current);
  };

  const updateProgress = () => {
    if (!audioContextRef.current || !isPlaying) return;

    const elapsedTime = audioContextRef.current.currentTime - startTimeRef.current;
    
    if (elapsedTime >= duration) {
      setProgress(100);
      setIsPlaying(false);
      pauseTimeRef.current = 0;
      return; 
    }

    setProgress((elapsedTime / duration) * 100);
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      // If finished, reset
      if (progress >= 100) {
        pauseTimeRef.current = 0;
        setProgress(0);
      }
      playAudio();
    }
  };

  return (
    <div className="flex items-center gap-3 w-full min-w-[200px] max-w-[280px]">
      <button 
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-colors"
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Fake waveform / Progress bar */}
        <div className="h-8 flex items-center gap-[2px] opacity-70">
            {/* Visualizer bars simulation */}
             {Array.from({ length: 20 }).map((_, i) => (
               <div 
                key={i} 
                className={`w-1.5 rounded-full transition-all duration-300 ${i/20 * 100 < progress ? 'bg-teal-600' : 'bg-gray-400'}`}
                style={{ height: `${Math.max(20, Math.random() * 80)}%` }} // Random height for "voice" look
               ></div>
             ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 font-medium">
          <span>{isPlaying && audioContextRef.current ? formatTime(audioContextRef.current.currentTime - startTimeRef.current) : formatTime(pauseTimeRef.current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Profile for Pak Ariess */}
      <div className="relative">
         <img 
            src="https://picsum.photos/id/64/100/100" // A portrait placeholder
            alt="Pak ARIESS" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" 
         />
         <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      </div>
    </div>
  );
};
