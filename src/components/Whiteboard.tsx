
import React, { useEffect, useState } from 'react';
import { Tldraw, useEditor, TLRecord, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

// We need to use the TLStore from tldraw instead of TLYjsStore
import { TLStore } from '@tldraw/tldraw';

interface WhiteboardProps {
  roomId: string;
}

const Whiteboard = ({ roomId }: WhiteboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [store, setStore] = useState<TLStore | null>(null);
  
  // Initialize Yjs document and WebRTC provider
  useEffect(() => {
    if (!roomId) return;
    
    const doc = new Y.Doc();
    const webrtcProvider = new WebrtcProvider(roomId, doc, {
      signaling: ['wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
    });
    
    // Create a Yjs-based store for tldraw
    const yStore = doc.getMap('tldraw');
    
    // Create the tldraw store
    const tlStore = createTLStore({ 
      shapeUtils: defaultShapeUtils,
    });
    
    // Bind the Yjs document to the tldraw store
    // This creates a binding between the two
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
    
    // Set up awareness for collaborative features
    webrtcProvider.awareness.setLocalState({
      id: Math.random().toString(36).slice(2, 10),
      user: {
        name: `User ${Math.floor(Math.random() * 1000)}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      },
    });
    
    setYDoc(doc);
    setProvider(webrtcProvider);
    setStore(tlStore);
    setIsLoading(false);
    
    return () => {
      unsub();
      webrtcProvider.disconnect();
      doc.destroy();
    };
  }, [roomId]);
  
  const EditorComponent = () => {
    const editor = useEditor();
    
    useEffect(() => {
      if (editor && provider) {
        // Handle connection status
        const handleConnect = () => {
          console.log('Connected to room:', roomId);
        };
        
        // Using the correct event name 'synced' instead of 'sync'
        provider.on('synced', handleConnect);
        
        return () => {
          // Also use the correct event name here
          provider.off('synced', handleConnect);
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
