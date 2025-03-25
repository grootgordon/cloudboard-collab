
import React from 'react';
import { Tldraw, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useYjsSync } from '../../hooks/useYjsSync';
import CursorOverlay from './CursorOverlay';
import ConnectionStatus from './ConnectionStatus';
import EditorComponent from './EditorComponent';

interface WhiteboardProps {
  roomId: string;
}

const Whiteboard = ({ roomId }: WhiteboardProps) => {
  // Create a store instance
  const [store] = React.useState(() => 
    createTLStore({ 
      shapeUtils: defaultShapeUtils,
    })
  );
  
  // Get Yjs sync data and status
  const { provider, yDoc, connectionStatus, cursors, isLoading } = useYjsSync({
    roomId,
    store,
  });
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading whiteboard...</div>;
  }
  
  return (
    <div className="h-screen w-full relative">
      <ConnectionStatus connectionStatus={connectionStatus} />
      
      {/* Remote Cursors */}
      <CursorOverlay cursors={cursors} />
      
      {store && (
        <Tldraw
          store={store}
          hideUi={false}
          components={{
            InFrontOfTheCanvas: () => (
              <EditorComponent 
                provider={provider} 
                yDoc={yDoc} 
              />
            ),
          }}
        />
      )}
    </div>
  );
};

export default Whiteboard;
