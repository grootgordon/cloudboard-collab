
import React from 'react';

export interface CursorData {
  x: number;
  y: number;
  name: string;
  color: string;
  timestamp?: number;
}

interface CursorOverlayProps {
  cursors: Record<string, CursorData>;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({ cursors }) => {
  return (
    <>
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div 
          key={userId}
          className="absolute pointer-events-none z-50 flex flex-col items-center"
          style={{
            left: `${cursor.x * 100}%`,
            top: `${cursor.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div 
            className="w-4 h-4 rounded-full animate-pulse"
            style={{ backgroundColor: cursor.color }}
          />
          <span 
            className="mt-1 px-2 py-1 rounded text-xs text-white"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </span>
        </div>
      ))}
    </>
  );
};

export default CursorOverlay;
