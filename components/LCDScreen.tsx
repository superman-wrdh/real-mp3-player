import React, { useEffect, useRef } from 'react';
import { AudioFile, PlayerState, ScreenMode } from '../types';
import { formatTime, truncateFileName } from '../utils';
import { Battery, Music, Volume2, Disc } from 'lucide-react';

interface LCDScreenProps {
  files: AudioFile[];
  currentIndex: number;
  screenMode: ScreenMode;
  playerState: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const LCDScreen: React.FC<LCDScreenProps> = ({
  files,
  currentIndex,
  screenMode,
  playerState,
  currentTime,
  duration,
  volume,
  onFileSelect,
}) => {
  const listRef = useRef<HTMLUListElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to selected item in menu
  useEffect(() => {
    if (listRef.current && screenMode === ScreenMode.MENU && files.length > 0) {
      const selectedItem = listRef.current.children[currentIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentIndex, screenMode, files]);

  const handleOpenFolder = () => {
    fileInputRef.current?.click();
  };

  const renderContent = () => {
    if (files.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
          <p className="text-lg animate-pulse">NO DISK</p>
          <button 
            onClick={handleOpenFolder}
            className="border-2 border-retro-screenText px-2 py-1 text-sm hover:bg-retro-screenText hover:text-retro-screen transition-colors"
          >
            LOAD FOLDER
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            className="hidden"
            // @ts-ignore - webkitdirectory is non-standard but supported
            webkitdirectory=""
            directory=""
            multiple
          />
        </div>
      );
    }

    if (screenMode === ScreenMode.MENU) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex justify-between border-b-2 border-retro-screenText/50 mb-1 pb-1">
            <span className="font-bold flex items-center gap-1"><Music size={12}/> ROOT</span>
            <span className="text-xs">{currentIndex + 1}/{files.length}</span>
          </div>
          <ul ref={listRef} className="flex-1 overflow-y-auto lcd-scrollbar space-y-1 text-sm">
            {files.map((file, index) => (
              <li 
                key={index} 
                className={`px-1 truncate cursor-pointer ${index === currentIndex ? 'bg-retro-screenText text-retro-screen font-bold' : ''}`}
              >
                {index === currentIndex ? '> ' : '  '}
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Now Playing Mode
    const currentFile = files[currentIndex];
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const isPlaying = playerState === PlayerState.PLAYING;

    return (
      <div className="h-full flex flex-col justify-between py-1">
        
        {/* Header Status */}
        <div className="flex justify-between text-xs border-b border-retro-screenText/30 pb-1">
          <span className="flex items-center gap-1">
            {isPlaying ? <span className="animate-pulse">▶</span> : <span>❚❚</span>}
            {isPlaying ? 'PLAY' : 'PAUSE'}
          </span>
          <span className="flex items-center gap-1">
            <Volume2 size={10} /> {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Song Info */}
        <div className="flex flex-col items-center justify-center flex-1 text-center overflow-hidden px-2">
           <Disc size={32} className={`mb-2 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
           <div className="w-full whitespace-nowrap overflow-hidden">
             <p className="font-bold text-lg leading-tight truncate">
               {currentFile?.name || "Unknown"}
             </p>
           </div>
           <p className="text-xs mt-1 opacity-75">128kbps MP3</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full h-3 border border-retro-screenText p-0.5">
             <div 
               className="h-full bg-retro-screenText transition-all duration-500 ease-linear"
               style={{ width: `${progress}%` }}
             />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 h-48 bg-retro-screen rounded-md shadow-inner-lg p-4 font-lcd text-retro-screenText relative overflow-hidden select-none border-4 border-gray-400/50">
      {/* Scanlines overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none z-10 opacity-60"></div>
      
      {/* Battery Indicator (Static) */}
      <div className="absolute top-2 right-2 opacity-50 z-0">
        <Battery size={16} />
      </div>

      <div className="relative z-0 h-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default LCDScreen;