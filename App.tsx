import React, { useState, useRef, useEffect, useCallback } from 'react';
import LCDScreen from './components/LCDScreen';
import ControlPad from './components/ControlPad';
import { AudioFile, PlayerState, ScreenMode } from './types';
import { Plus, Minus } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.IDLE);
  const [screenMode, setScreenMode] = useState<ScreenMode>(ScreenMode.MENU);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);

  // Audio Ref
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // Handle File Selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      const audioFiles: AudioFile[] = selectedFiles
        .filter(file => file.name.toLowerCase().endsWith('.mp3'))
        .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
        .map(file => ({
          name: file.name.replace(/\.mp3$/i, ''),
          url: URL.createObjectURL(file),
          originalFile: file
        }));

      if (audioFiles.length > 0) {
        // Clean up old URLs
        files.forEach(f => URL.revokeObjectURL(f.url));
        
        setFiles(audioFiles);
        setCurrentIndex(0);
        setPlayerState(PlayerState.IDLE);
        setScreenMode(ScreenMode.MENU);
      } else {
        alert("No MP3 files found in the selected folder.");
      }
    }
  };

  // Play Audio Logic
  const playTrack = useCallback(async (index: number) => {
    if (files.length === 0) return;

    const file = files[index];
    if (!file) return;

    try {
      if (audioRef.current.src !== file.url) {
        audioRef.current.src = file.url;
        audioRef.current.load();
      }
      
      await audioRef.current.play();
      setPlayerState(PlayerState.PLAYING);
      setScreenMode(ScreenMode.NOW_PLAYING);
    } catch (err) {
      console.error("Playback error:", err);
    }
  }, [files]);

  const togglePlayPause = useCallback(() => {
    if (files.length === 0) return;

    if (playerState === PlayerState.PLAYING) {
      audioRef.current.pause();
      setPlayerState(PlayerState.PAUSED);
    } else {
      if (audioRef.current.src) {
        audioRef.current.play().catch(e => console.error(e));
        setPlayerState(PlayerState.PLAYING);
      } else {
        playTrack(currentIndex);
      }
    }
  }, [playerState, files, currentIndex, playTrack]);

  // Audio Event Listeners setup
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      // Auto play next song
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next < files.length) {
          playTrack(next);
          return next;
        } else {
            // Loop to start? Or stop. Let's stop.
            setPlayerState(PlayerState.IDLE);
            return 0; 
        }
      });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [files, playTrack]);

  // Update volume
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // --- CONTROLS HANDLERS ---

  const handleMenu = () => {
    if (files.length === 0) return;
    setScreenMode(prev => prev === ScreenMode.MENU ? ScreenMode.NOW_PLAYING : ScreenMode.MENU);
  };

  const handleCenter = () => {
    if (files.length === 0) return;

    if (screenMode === ScreenMode.MENU) {
      // Select song and play
      playTrack(currentIndex);
    } else {
      // Toggle play/pause
      togglePlayPause();
    }
  };

  const handleUp = () => {
    if (files.length === 0) return;
    
    // In MENU: Scroll Up
    if (screenMode === ScreenMode.MENU) {
        setCurrentIndex(prev => (prev - 1 + files.length) % files.length);
    } 
    // In NOW PLAYING: Volume Up (Keep D-Pad redundancy)
    else {
        setVolume(prev => Math.min(prev + 0.1, 1));
    }
  };

  const handleDown = () => {
    if (files.length === 0) return;

    // In MENU: Scroll Down
    if (screenMode === ScreenMode.MENU) {
        setCurrentIndex(prev => (prev + 1) % files.length);
    } 
    // In NOW PLAYING: Play/Pause
    else {
        togglePlayPause();
    }
  };

  const handleWheelNext = () => { // Right button click
    if (screenMode === ScreenMode.MENU) {
        setCurrentIndex(prev => (prev + 1) % files.length);
    } else {
        // Next Track
        const next = (currentIndex + 1) % files.length;
        setCurrentIndex(next);
        playTrack(next);
    }
  };

  const handleWheelPrev = () => { // Left button click
    if (screenMode === ScreenMode.MENU) {
        setCurrentIndex(prev => (prev - 1 + files.length) % files.length);
    } else {
        // Prev Track (or restart current if > 3s)
        if (currentTime > 3) {
            audioRef.current.currentTime = 0;
        } else {
            const prev = (currentIndex - 1 + files.length) % files.length;
            setCurrentIndex(prev);
            playTrack(prev);
        }
    }
  };

  // Dedicated Volume Handlers
  const handleVolUp = () => setVolume(prev => Math.min(prev + 0.05, 1));
  const handleVolDown = () => setVolume(prev => Math.max(prev - 0.05, 0));

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen">
      
      {/* Wrapper for the 3D Device */}
      <div className="relative group">
        
        {/* Side Buttons (Right Side) */}
        <div className="absolute top-[120px] -right-4 flex flex-col gap-3 z-0">
             <button 
                onClick={handleVolUp}
                className="w-6 h-14 bg-gradient-to-l from-stone-300 to-stone-400 rounded-r-md border-y border-r border-stone-500/50 shadow-[4px_4px_8px_rgba(0,0,0,0.2)] active:translate-x-[-2px] active:shadow-inner transition-all flex items-center justify-center text-stone-600 hover:bg-stone-300"
                title="Volume Up"
                aria-label="Increase Volume"
             >
               <Plus size={14} strokeWidth={3} />
             </button>
             <button 
                onClick={handleVolDown}
                className="w-6 h-14 bg-gradient-to-l from-stone-300 to-stone-400 rounded-r-md border-y border-r border-stone-500/50 shadow-[4px_4px_8px_rgba(0,0,0,0.2)] active:translate-x-[-2px] active:shadow-inner transition-all flex items-center justify-center text-stone-600 hover:bg-stone-300"
                title="Volume Down"
                aria-label="Decrease Volume"
             >
               <Minus size={14} strokeWidth={3} />
             </button>
        </div>

        {/* The Physical Device Casing */}
        {/* Enhanced 3D effects: thicker shadows, gradients, and borders */}
        <div className="relative z-10 w-[340px] h-[540px] bg-gradient-to-br from-[#f0f0f0] to-[#c0c0c0] rounded-[40px] p-8 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.7),inset_-2px_-2px_5px_rgba(0,0,0,0.1),20px_20px_60px_rgba(0,0,0,0.4),-10px_-10px_40px_rgba(255,255,255,0.8)] border border-stone-300 flex flex-col items-center gap-8 overflow-hidden">
          
          {/* Metallic/Plastic Texture overlay */}
          <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] pointer-events-none rounded-[40px]" />
          
          {/* Screen Bezel Area */}
          <div className="w-full flex justify-center z-10 relative">
             {/* Dark Glassy Bezel around Screen */}
             <div className="bg-stone-800/5 p-1 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] backdrop-blur-[1px]">
               <div className="rounded border-[3px] border-stone-400/30 shadow-lg bg-stone-900/10">
                 <LCDScreen 
                  files={files}
                  currentIndex={currentIndex}
                  screenMode={screenMode}
                  playerState={playerState}
                  currentTime={currentTime}
                  duration={duration}
                  volume={volume}
                  onFileSelect={handleFileSelect}
                />
               </div>
             </div>
          </div>

          {/* Controls Container */}
          <div className="flex-1 flex items-center justify-center z-10 w-full mt-2">
            <ControlPad 
              onMenu={handleMenu} 
              onDown={handleDown}
              onLeft={handleWheelPrev}
              onRight={handleWheelNext}
              onCenter={handleCenter}
              onUp={handleUp}
            />
          </div>
        </div>
      </div>
      
      {/* Ground Shadow / Reflection */}
      <div className="w-[300px] h-[30px] bg-black/20 blur-xl rounded-[100%] mt-[-25px] z-[-1]" />

      <div className="mt-8 text-stone-500 text-xs font-mono text-center space-y-1">
        <p>Use side buttons for volume.</p>
        <p>Center to Select • Bottom to Play/Pause</p>
      </div>

    </div>
  );
};

export default App;