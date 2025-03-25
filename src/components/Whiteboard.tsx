
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
    
    // Setup for presence (user awareness)
    const awareness = hocuspocusProvider.awareness;
    awareness.setLocalState({
      id: Math.random().toString(36).slice(2, 10),
      user: {
        name: `User ${Math.floor(Math.random() * 1000)}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      },
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
      if (editor && provider) {
        // Log connected users
        const awareness = provider.awareness;
        
        const handleAwarenessUpdate = () => {
          const states = Array.from(awareness.getStates().values());
          console.log(`Connected users: ${states.length}`, states);
        };
        
        awareness.on('update', handleAwarenessUpdate);
        
        return () => {
          awareness.off('update', handleAwarenessUpdate);
        };
      }
    }, [editor]);
    
    return null;
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading whiteboard...</div>;
  }
  
  return (
    <div className="h-screen w-full">
      {connectionStatus !== 'connected' && (
        <div className="fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 z-50 rounded shadow-md">
          {connectionStatus === 'connecting' ? 'Connecting to server...' : 'Disconnected from server. Check if the Hocuspocus server is running.'}
        </div>
      )}
      {store && (
        <Tldraw store={store}>
          <EditorComponent />
        </Tldraw>
      )}
    </div>
  );
};

export default Whiteboard;
