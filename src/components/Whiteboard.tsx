
import React, { useEffect, useState } from 'react';
import { Tldraw, useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

interface WhiteboardProps {
  roomId: string;
}

const Whiteboard = ({ roomId }: WhiteboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  
  // Initialize Yjs document and WebRTC provider
  useEffect(() => {
    if (!roomId) return;
    
    const doc = new Y.Doc();
    const webrtcProvider = new WebrtcProvider(roomId, doc, {
      signaling: ['wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
    });
    
    setYDoc(doc);
    setProvider(webrtcProvider);
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
        
        provider.on('sync', handleConnect);
        
        return () => {
          provider.off('sync', handleConnect);
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
      <Tldraw>
        <EditorComponent />
      </Tldraw>
    </div>
  );
};

export default Whiteboard;
