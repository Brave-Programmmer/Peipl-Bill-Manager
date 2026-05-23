import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import logo from '../assets/logo.png';

export const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    console.log('Minimize clicked');
    window.electron.windowMinimize().catch(err => console.error(err));
  };
  const handleMaximize = () => {
    console.log('Maximize clicked');
    window.electron.windowMaximize().catch(err => console.error(err));
  };
  const handleClose = () => {
    console.log('Close clicked');
    window.electron.windowClose().catch(err => console.error(err));
  };

  return (
    <div className="h-10 bg-card border-b border-border flex items-center justify-between px-4 select-none relative z-[100]">
      {/* Drag region overlay */}
      <div className="absolute inset-0 drag-region pointer-events-none" />
      
      <div className="flex items-center gap-2 relative z-10">
        <img src={logo} alt="PEIPL Logo" className="w-5 h-5 object-contain" />
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">PEIPL BILL v1.0</span>
      </div>
      
      <div className="flex items-center no-drag-region h-full relative z-20">
        <button 
          type="button"
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-accent transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Minus size={14} />
        </button>
        <button 
          type="button"
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-accent transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Square size={12} />
        </button>
        <button 
          type="button"
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-500 transition-colors flex items-center justify-center text-muted-foreground hover:text-white cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
      
      <style>{`
        .drag-region {
          -webkit-app-region: drag;
        }
        .no-drag-region {
          -webkit-app-region: no-drag;
        }
      `}</style>
    </div>
  );
};
