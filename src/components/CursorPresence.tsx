
import React, { useEffect, useState } from 'react';

interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

const Cursor: React.FC<CursorProps> = ({ x, y, color, name }) => {
  return (
    <div 
      className="absolute pointer-events-none flex flex-col items-center"
      style={{ 
        left: `${x}px`, 
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      }}
    >
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: color }} 
      />
      <div 
        className="text-xs px-2 py-1 rounded-md mt-1 whitespace-nowrap"
        style={{ backgroundColor: color, color: '#fff' }}
      >
        {name}
      </div>
    </div>
  );
};

interface CursorPresenceProps {
  provider: any;
  roomId: string;
}

interface CursorPosition {
  x: number;
  y: number;
  color: string;
  name: string;
  timestamp: number;
  id: string;
}

const CursorPresence: React.FC<CursorPresenceProps> = ({ provider, roomId }) => {
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});
  const [localPosition, setLocalPosition] = useState({ x: 0, y: 0 });

  // Update local cursor position on mouse move
  useEffect(() => {
    if (!provider) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setLocalPosition({ x, y });
      
      // Get local user data from awareness
      const awareness = provider.awareness;
      const localState = awareness.getLocalState();
      
      if (localState) {
        awareness.setLocalState({
          ...localState,
          cursor: {
            x,
            y,
            timestamp: Date.now(),
          }
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [provider]);

  // Update cursors from awareness
  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;
    const handleUpdate = () => {
      const states = Array.from(awareness.getStates().entries());
      const newCursors: Record<string, CursorPosition> = {};
      
      states.forEach(([clientId, state]: [number, any]) => {
        // Skip if it's the local client or if the state doesn't have cursor data
        if (clientId === awareness.clientID || !state.cursor) return;
        
        newCursors[clientId] = {
          x: state.cursor.x,
          y: state.cursor.y,
          color: state.user?.color || '#ff0000',
          name: state.user?.name || 'Anonymous',
          timestamp: state.cursor.timestamp,
          id: clientId.toString(),
        };
      });
      
      setCursors(newCursors);
    };
    
    awareness.on('update', handleUpdate);
    return () => {
      awareness.off('update', handleUpdate);
    };
  }, [provider]);

  return (
    <>
      {Object.values(cursors).map((cursor) => (
        <Cursor
          key={cursor.id}
          x={cursor.x}
          y={cursor.y}
          color={cursor.color}
          name={cursor.name}
        />
      ))}
    </>
  );
};

export default CursorPresence;
