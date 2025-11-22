import React, { useState, useRef, useEffect, useCallback } from 'react';
import LCDScreen from './components/LCDScreen';
import ControlPad from './components/ControlPad';
import { AudioFile, PlayerState, ScreenMode } from './types';

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
  }, [files, playTrack]); // Dependencies are important here

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
    // In NOW PLAYING: Volume Up (Classic logic: Wheel moves volume)
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
    // In NOW PLAYING: Volume Down (or Play/Pause depending on interpretation of 'Play' icon at bottom)
    // We will use it for Volume Down to match Up behavior, but checking if the user wants Play/Pause via bottom button?
    // The visual UI shows Play/Pause icon at bottom. 
    // Let's implement Hybrid: If held? No, let's keep it simple.
    // Bottom Button = Play/Pause logic usually.
    // BUT the wheel logic suggests Up/Down is scrolling/volume.
    // Let's map Down Button specifically to Toggle Play/Pause if in Menu? No, that's center.
    // Let's make Down = Scroll Down (Menu) / PlayPause (Playing)? 
    // Actually, looking at the iPod Clickwheel: Top=Menu, Bottom=Play/Pause, Left=Prev, Right=Next, Center=Select.
    // Scrolling was done by *rotating*. Since we have buttons:
    // Let's map UP/DOWN to Scroll in Menu.
    // In Playing: UP/DOWN to Volume.
    // To respect the Visual Icon on Bottom Button (Play/Pause):
    // If we click Bottom Button in Playing mode -> Toggle Play/Pause.
    else {
        // Option A: Volume Down
        // setVolume(prev => Math.max(prev - 0.1, 0)); 
        
        // Option B: Play/Pause (Matches icon)
        togglePlayPause();
    }
  };

  // We need a specific volume control if Up/Down are occupied. 
  // Let's Re-evaluate based on "Retro MP3" D-pad standard.
  // Usually: Up/Down = Volume (if playing) or Next/Prev File. Left/Right = Seek.
  // Let's stick to the Visual Icons on the rendered D-Pad component.
  // Top: Menu. Bottom: Play/Pause. Left: Prev. Right: Next. Center: Select.
  // But how do we Scroll the menu?
  // Let's use Left/Right for Seek/PrevNext, and we need scrolling.
  // Let's make the "Wheel" metaphor work this way:
  // When in MENU: Top (Menu) goes up? No.
  // Let's override for usability:
  // Top (Menu Button) -> Go Back / Toggle View.
  // Bottom (Play Button) -> Toggle Play / Pause.
  // Left (Prev) -> Prev Song / Scroll Up in Menu (Counter-clockwise).
  // Right (Next) -> Next Song / Scroll Down in Menu (Clockwise).
  // Center -> Select.
  // This mimics the rotation.

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

  return (
    <div className="relative flex flex-col items-center">
      
      {/* The Physical Device Casing */}
      <div className="w-[320px] h-[520px] bg-gradient-to-br from-gray-200 to-gray-400 rounded-[30px] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] border border-gray-100 flex flex-col items-center gap-8 relative overflow-hidden">
        
        {/* Metallic Texture overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] pointer-events-none rounded-[30px]" />
        
        {/* Screen Container */}
        <div className="w-full flex justify-center z-10">
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

        {/* Controls Container */}
        <div className="flex-1 flex items-center justify-center z-10 w-full mt-4">
          <ControlPad 
            onMenu={handleMenu} // Top Button
            onDown={() => {
                // Bottom Button: Play/Pause
                togglePlayPause();
            }}
            onLeft={handleWheelPrev} // Left Button
            onRight={handleWheelNext} // Right Button
            onCenter={handleCenter} // Center Button
            onUp={() => { 
                // We actually mapped "Menu" to the visual "Up/Menu" button in ControlPad.
                // But if we want a separate 'Scroll Up' that isn't Left/Right...
                // Let's stick to the Left/Right = Scroll logic for menu navigation like a wheel.
                // So Up button is strictly Menu.
                handleMenu();
            }}
          />
        </div>
      </div>
      
      {/* Reflection / Ground Shadow */}
      <div className="w-[280px] h-[20px] bg-black/20 blur-xl rounded-[100%] mt-[-20px] z-[-1]" />

      <div className="mt-8 text-stone-500 text-xs font-mono text-center">
        <p>Use the buttons to navigate.</p>
        <p>Left/Right to Scroll & Skip.</p>
        <p>Center to Select.</p>
        <p>Bottom to Play/Pause.</p>
      </div>

    </div>
  );
};

export default App;