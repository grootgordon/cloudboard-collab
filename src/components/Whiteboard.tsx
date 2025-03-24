
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
    
    // Sync the store with the Yjs doc
    const updateYDoc = () => {
      const records = tlStore.allRecords();
      yStore.forEach((_, key) => {
        if (!records.find(r => r.id === key)) {
          yStore.delete(key);
        }
      });
      
      records.forEach(record => {
        const existingRecord = yStore.get(record.id);
        if (!existingRecord || JSON.stringify(existingRecord) !== JSON.stringify(record)) {
          yStore.set(record.id, record);
        }
      });
    };
    
    // Initial sync
    const existingRecords = Array.from(yStore.entries()).map(([id, value]) => value as TLRecord);
    if (existingRecords.length > 0) {
      tlStore.put(existingRecords);
    } else {
      updateYDoc();
    }
    
    // Subscribe to changes from the store
    const unsub = tlStore.listen(() => {
      updateYDoc();
    });
    
    // Listen for changes from other users
    yStore.observe(() => {
      const yRecords = Array.from(yStore.entries()).map(([id, value]) => value as TLRecord);
      
      // Update the store with records from other users
      tlStore.put(yRecords);
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
      unsub();
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
