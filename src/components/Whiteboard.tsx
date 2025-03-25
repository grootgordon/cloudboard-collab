
import React, { useEffect, useState } from 'react';
import { Tldraw, useEditor, TLRecord, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { toast } from 'sonner';

// We need to use the TLStore from tldraw
import { TLStore } from '@tldraw/tldraw';

// Define the server URL with fallback to local development
const SERVER_URL = import.meta.env.VITE_HOCUSPOCUS_URL || 'ws://localhost:1234';

interface WhiteboardProps {
  roomId: string;
}

const Whiteboard = ({ roomId }: WhiteboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [store, setStore] = useState<TLStore | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [cursors, setCursors] = useState<Record<string, { x: number, y: number, name: string, color: string }>>({});
  
  // Initialize Yjs document and Hocuspocus provider
  useEffect(() => {
    if (!roomId) return;
    
    const doc = new Y.Doc();
    console.log(`Connecting to Hocuspocus server at ${SERVER_URL} for room ${roomId}`);
    
    // Create a Hocuspocus provider
    const hocuspocusProvider = new HocuspocusProvider({
      url: SERVER_URL,
      name: roomId,
      document: doc,
      onStatus: ({ status }) => {
        console.log('Connection status:', status);
        setConnectionStatus(status);
        
        if (status === 'connected') {
          toast.success('Connected to collaboration server');
          setConnectionAttempts(0);
        } else if (status === 'disconnected') {
          toast.error('Disconnected from collaboration server');
          
          // If we've made less than 3 attempts, try to reconnect
          if (connectionAttempts < 3) {
            setConnectionAttempts(prev => prev + 1);
            toast.info(`Attempting to reconnect (${connectionAttempts + 1}/3)...`);
          } else {
            toast.error('Could not connect to server. Please check if the server is running.');
          }
        }
      },
      onConnect: () => {
        console.log('Connected to Hocuspocus server');
        toast.success('Connected to collaboration server');
      },
      onDisconnect: () => {
        console.log('Disconnected from Hocuspocus server');
        toast.error('Disconnected from collaboration server');
      },
      onClose: () => {
        console.log('Connection closed');
      },
    });
    
    // Handle errors manually
    hocuspocusProvider.on('error', (error) => {
      console.error('Connection error:', error);
      toast.error(`Connection error: ${error.message || 'Unknown error'}`);
    });
    
    // Create a Yjs-based store for tldraw
    const yStore = doc.getMap('tldraw');
    
    // Create the tldraw store
    const tlStore = createTLStore({ 
      shapeUtils: defaultShapeUtils,
    });
    
    // Bind the Yjs document to the tldraw store
    const undoManager = new Y.UndoManager(yStore);
    
    // Initial sync from Yjs to tldraw
    const syncFromYjs = () => {
      // Convert Yjs map entries to TLRecord array
      const records: TLRecord[] = [];
      yStore.forEach((value, key) => {
        if (value && typeof value === 'object') {
          records.push(value as TLRecord);
        }
      });
      
      if (records.length > 0) {
        tlStore.put(records);
      }
    };
    
    // Initial sync from tldraw to Yjs
    const syncToYjs = () => {
      const records = tlStore.allRecords();
      
      // Delete records from Yjs that no longer exist in tldraw
      yStore.forEach((_, key) => {
        if (!records.find(r => r.id === key)) {
          yStore.delete(key);
        }
      });
      
      // Add or update records in Yjs
      records.forEach(record => {
        yStore.set(record.id, record);
      });
    };
    
    // Initial sync
    syncFromYjs();
    if (yStore.size === 0) {
      syncToYjs(); // If Yjs is empty, populate from tldraw
    }
    
    // Subscribe to tldraw store changes
    const unsubscribeTldraw = tlStore.listen(() => {
      // Prevent infinite loops by wrapping in a transaction
      doc.transact(() => {
        syncToYjs();
      });
    });
    
    // Subscribe to Yjs changes
    yStore.observe(() => {
      syncFromYjs();
    });
    
    // Set up cursor synchronization
    const cursorsMap = doc.getMap('cursors');
    
    // Initialize random user for this session
    const userId = Math.random().toString(36).slice(2, 10);
    const userColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    const userName = `User ${Math.floor(Math.random() * 1000)}`;
    
    // Setup for presence (user awareness)
    const awareness = hocuspocusProvider.awareness;
    awareness.setLocalState({
      id: userId,
      user: {
        name: userName,
        color: userColor,
      },
    });
    
    // Observe cursor changes
    cursorsMap.observe(() => {
      const currentCursors: Record<string, any> = {};
      cursorsMap.forEach((value, key) => {
        if (key !== userId) { // Don't show our own cursor
          currentCursors[key] = value;
        }
      });
      setCursors(currentCursors);
    });
    
    setYDoc(doc);
    setProvider(hocuspocusProvider);
    setStore(tlStore);
    setIsLoading(false);
    
    return () => {
      unsubscribeTldraw();
      hocuspocusProvider.destroy();
      doc.destroy();
    };
  }, [roomId, connectionAttempts]);
  
  const EditorComponent = () => {
    const editor = useEditor();
    
    useEffect(() => {
      if (editor && provider && yDoc) {
        // Get the cursors map from the Yjs document
        const cursorsMap = yDoc.getMap('cursors');
        // Get user info from the awareness
        const awareness = provider.awareness;
        const myState = awareness.getLocalState();
        const userId = myState?.id;
        
        if (!userId) return;
        
        // Track pointer movements
        const handlePointerMove = (event: PointerEvent) => {
          // Get editor container bounds
          const bounds = editor.getContainer().getBoundingClientRect();
          
          // Calculate relative position within the canvas
          const x = (event.clientX - bounds.left) / bounds.width;
          const y = (event.clientY - bounds.top) / bounds.height;
          
          // Update cursor position in Yjs
          cursorsMap.set(userId, {
            x,
            y,
            name: myState.user.name,
            color: myState.user.color,
            timestamp: Date.now(),
          });
        };
        
        // Clean up old cursors (idle for more than 5 seconds)
        const cleanupInterval = setInterval(() => {
          const now = Date.now();
          cursorsMap.forEach((value, key) => {
            if (value.timestamp && now - value.timestamp > 5000) {
              cursorsMap.delete(key);
            }
          });
        }, 5000);
        
        // Add event listeners
        const container = editor.getContainer();
        container.addEventListener('pointermove', handlePointerMove);
        
        // Disable infinite canvas
        editor.setCamera({ x: 0, y: 0, z: 1 });
        editor.updateInstanceState({ 
          canMoveCamera: false,
          isGridMode: true,
        });
        
        // Log connected users
        const handleAwarenessUpdate = () => {
          const states = Array.from(awareness.getStates().values());
          console.log(`Connected users: ${states.length}`, states);
        };
        
        awareness.on('update', handleAwarenessUpdate);
        
        return () => {
          container.removeEventListener('pointermove', handlePointerMove);
          clearInterval(cleanupInterval);
          awareness.off('update', handleAwarenessUpdate);
        };
      }
    }, [editor, provider, yDoc]);
    
    return null;
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading whiteboard...</div>;
  }
  
  return (
    <div className="h-screen w-full relative">
      {connectionStatus !== 'connected' && (
        <div className="fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 z-50 rounded shadow-md">
          {connectionStatus === 'connecting' ? 'Connecting to server...' : 'Disconnected from server. Check if the Hocuspocus server is running.'}
        </div>
      )}
      
      {/* Remote Cursors */}
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
      
      {store && (
        <Tldraw
          store={store}
          hideUi={false}
          components={{
            // Override the context menu component to disable zoom and pan
            InFrontOfTheCanvas: () => (
              <>
                <EditorComponent />
              </>
            ),
          }}
        >
        </Tldraw>
      )}
    </div>
  );
};

export default Whiteboard;
