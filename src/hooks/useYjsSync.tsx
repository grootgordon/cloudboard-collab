
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { TLRecord, TLStore } from '@tldraw/tldraw';
import { toast } from 'sonner';
import { CursorData } from '../components/whiteboard/CursorOverlay';

// Define the server URL with fallback to local development
const SERVER_URL = import.meta.env.VITE_HOCUSPOCUS_URL || 'ws://localhost:1234';

interface UseYjsSyncProps {
  roomId: string;
  store: TLStore | null;
}

interface UseYjsSyncResult {
  provider: HocuspocusProvider | null;
  yDoc: Y.Doc | null;
  connectionStatus: string;
  cursors: Record<string, CursorData>;
  isLoading: boolean;
}

export const useYjsSync = ({ roomId, store }: UseYjsSyncProps): UseYjsSyncResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [cursors, setCursors] = useState<Record<string, CursorData>>({});

  useEffect(() => {
    if (!roomId || !store) return;
    
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
        store.put(records);
      }
    };
    
    // Initial sync from tldraw to Yjs
    const syncToYjs = () => {
      const records = store.allRecords();
      
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
    const unsubscribeTldraw = store.listen(() => {
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
      const currentCursors: Record<string, CursorData> = {};
      cursorsMap.forEach((value, key) => {
        const cursorData = value as CursorData;
        if (key !== userId && cursorData) { // Don't show our own cursor
          currentCursors[key] = cursorData;
        }
      });
      setCursors(currentCursors);
    });
    
    setYDoc(doc);
    setProvider(hocuspocusProvider);
    setIsLoading(false);
    
    return () => {
      unsubscribeTldraw();
      hocuspocusProvider.destroy();
      doc.destroy();
    };
  }, [roomId, connectionAttempts, store]);

  return {
    provider,
    yDoc,
    connectionStatus,
    cursors,
    isLoading
  };
};
