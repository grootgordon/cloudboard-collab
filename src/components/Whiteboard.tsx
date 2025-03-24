
import React, { useEffect, useState } from 'react';
import { Tldraw, useEditor, TLRecord, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

// We need to use the TLStore from tldraw
import { TLStore } from '@tldraw/tldraw';

interface WhiteboardProps {
  roomId: string;
}

const Whiteboard = ({ roomId }: WhiteboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [store, setStore] = useState<TLStore | null>(null);
  
  // Initialize Yjs document and Hocuspocus provider
  useEffect(() => {
    if (!roomId) return;
    
    const doc = new Y.Doc();
    
    // Create a Hocuspocus provider
    const hocuspocusProvider = new HocuspocusProvider({
      url: 'wss://demos.yjs.dev', // Using public demo server, replace with your own server in production
      name: roomId,
      document: doc,
      onStatus: ({ status }) => {
        console.log('Connection status:', status);
      },
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
  }, [roomId]);
  
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
      {store && (
        <Tldraw store={store}>
          <EditorComponent />
        </Tldraw>
      )}
    </div>
  );
};

export default Whiteboard;
