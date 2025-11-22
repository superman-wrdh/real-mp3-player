import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Play, Pause, Menu } from 'lucide-react';

interface ControlPadProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onCenter: () => void;
  onMenu: () => void;
}

const ControlPad: React.FC<ControlPadProps> = ({
  onUp,
  onDown,
  onLeft,
  onRight,
  onCenter,
  onMenu
}) => {
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  const handleMouseDown = (btn: string, callback: () => void) => {
    setActiveBtn(btn);
    callback();
  };

  const handleMouseUp = () => {
    setActiveBtn(null);
  };

  const buttonClass = (id: string) => `
    absolute text-gray-500 hover:text-gray-700 transition-colors duration-150
    flex items-center justify-center
    ${activeBtn === id ? 'scale-95 text-gray-800' : ''}
  `;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Main Circular Pad Background */}
      <div className="w-48 h-48 rounded-full bg-gray-200 shadow-btn flex items-center justify-center relative border border-gray-300">
        
        {/* Menu / Top Button Area */}
        <button
          className={`${buttonClass('up')} top-2 h-12 w-full pt-2 rounded-t-full`}
          onMouseDown={() => handleMouseDown('up', onMenu)}
          onMouseUp={handleMouseUp}
          onTouchStart={() => handleMouseDown('up', onMenu)}
          onTouchEnd={handleMouseUp}
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-widest uppercase mb-[-2px]">Menu</span>
            <ChevronUp size={24} />
          </div>
        </button>

        {/* Prev / Left Button Area */}
        <button
          className={`${buttonClass('left')} left-2 w-12 h-full pr-2 rounded-l-full`}
          onMouseDown={() => handleMouseDown('left', onLeft)}
          onMouseUp={handleMouseUp}
          onTouchStart={() => handleMouseDown('left', onLeft)}
          onTouchEnd={handleMouseUp}
        >
           <div className="flex flex-col items-center -rotate-90">
             <span className="text-[8px] font-bold tracking-widest uppercase mb-[-2px]">Prev</span>
             <ChevronUp size={20} />
           </div>
        </button>

        {/* Next / Right Button Area */}
        <button
          className={`${buttonClass('right')} right-2 w-12 h-full pl-2 rounded-r-full`}
          onMouseDown={() => handleMouseDown('right', onRight)}
          onMouseUp={handleMouseUp}
          onTouchStart={() => handleMouseDown('right', onRight)}
          onTouchEnd={handleMouseUp}
        >
           <div className="flex flex-col items-center rotate-90">
             <span className="text-[8px] font-bold tracking-widest uppercase mb-[-2px]">Next</span>
             <ChevronUp size={20} />
           </div>
        </button>

        {/* Play/Pause / Down Button Area (Using Down for PlayPause in "List" logic, but typically iPod had PlayPause at bottom) */}
        <button
          className={`${buttonClass('down')} bottom-2 h-12 w-full pb-2 rounded-b-full`}
          onMouseDown={() => handleMouseDown('down', onDown)} // In menu mode, this goes down. In play mode, maybe Play/Pause?
          onMouseUp={handleMouseUp}
          onTouchStart={() => handleMouseDown('down', onDown)}
          onTouchEnd={handleMouseUp}
        >
          <div className="flex flex-col items-center mt-2">
            <div className="flex gap-1 mb-[-2px]">
                <Play size={10} fill="currentColor" />
                <Pause size={10} fill="currentColor" />
            </div>
          </div>
        </button>

        {/* Center Button */}
        <button
          className={`
            relative z-10 w-16 h-16 rounded-full bg-gray-300 border border-gray-400
            flex items-center justify-center
            active:shadow-inner active:scale-95 transition-all
            shadow-[2px_2px_5px_rgba(0,0,0,0.2),-2px_-2px_5px_rgba(255,255,255,0.8)]
            ${activeBtn === 'center' ? 'bg-gray-400 shadow-inner' : ''}
          `}
          onMouseDown={() => handleMouseDown('center', onCenter)}
          onMouseUp={handleMouseUp}
          onTouchStart={() => handleMouseDown('center', onCenter)}
          onTouchEnd={handleMouseUp}
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 opacity-20"></div>
        </button>

      </div>
    </div>
  );
};

export default ControlPad;