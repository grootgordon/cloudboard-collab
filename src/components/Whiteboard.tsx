
import React, { useEffect, useState } from 'react';
import { Tldraw, useEditor, TLInstanceId, TLRecord, useValue, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

// Let's directly use what's available in the current version
// Instead of importing from a specific path, import from the main package
import { TLYjsStore } from '@tldraw/tldraw';

interface WhiteboardProps {
  roomId: string;
}

const Whiteboard = ({ roomId }: WhiteboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [store, setStore] = useState<TLYjsStore | null>(null);
  
  // Initialize Yjs document and WebRTC provider
  useEffect(() => {
    if (!roomId) return;
    
    const doc = new Y.Doc();
    const webrtcProvider = new WebrtcProvider(roomId, doc, {
      signaling: ['wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
    });
    
    // Create a Yjs-based store for tldraw
    const yStore = new Y.Map<TLRecord>();
    doc.getMap('tldraw').set('store', yStore);
    
    // Create a store with the yjs store
    // Use the TLYjsStore from the main package
    const tlYjsStore = new TLYjsStore({
      store: createTLStore({ 
        shapeUtils: defaultShapeUtils,
      }),
      yDoc: doc,
      storeKey: 'tldraw',
      yStore,
    });
    
    // Handle user presence (for collaborator cursors)
    // We'll use a simpler approach without TLYjsPresence since it's not available
    const roomPresence = doc.getMap('presence');
    
    // Set up awareness for collaborative features
    webrtcProvider.awareness.setLocalState({
      id: Math.random().toString(36).slice(2, 10),
      user: {
        name: `User ${Math.floor(Math.random() * 1000)}`,
      },
    });
    
    setYDoc(doc);
    setProvider(webrtcProvider);
    setStore(tlYjsStore);
    setIsLoading(false);
    
    return () => {
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
