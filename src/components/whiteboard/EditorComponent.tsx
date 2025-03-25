
import React, { useEffect } from 'react';
import { useEditor } from '@tldraw/tldraw';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { CursorData } from './CursorOverlay';

interface EditorComponentProps {
  provider: HocuspocusProvider | null;
  yDoc: Y.Doc | null;
}

const EditorComponent: React.FC<EditorComponentProps> = ({ provider, yDoc }) => {
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
          const cursorData = value as CursorData;
          if (cursorData.timestamp && now - cursorData.timestamp > 5000) {
            cursorsMap.delete(key);
          }
        });
      }, 5000);
      
      // Add event listeners
      const container = editor.getContainer();
      container.addEventListener('pointermove', handlePointerMove);
      
      // Completely disable canvas movement by applying additional restrictions
      // This is the key change to fix the "hand tool" issue
      editor.setCamera({ x: 0, y: 0, z: 1 });
      
      // Apply multiple configurations to prevent any canvas movement
      editor.updateInstanceState({ 
        isGridMode: true,
      });
      
      // Additional measures to restrict movement
      const preventDefaultWheelBehavior = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      };
      container.addEventListener('wheel', preventDefaultWheelBehavior, { passive: false });
      
      // Force camera to stay fixed by repeatedly resetting it
      const fixedCameraInterval = setInterval(() => {
        editor.setCamera({ x: 0, y: 0, z: 1 });
      }, 100);

      // Disable gestures and pan/zoom using TLDraw's preferences
      if (editor.user) {
        editor.user.updateUserPreferences({
          isDarkMode: false,
          isSnapMode: true,
          nudgeDistanceSmall: 1,
          nudgeDistanceLarge: 10,
          isDarkPaletteMode: false,
          keepStyleMenuOpen: false,
          isToolLocked: true,  // Lock the current tool
        });
      }
      
      // Log connected users
      const handleAwarenessUpdate = () => {
        const states = Array.from(awareness.getStates().values());
        console.log(`Connected users: ${states.length}`, states);
      };
      
      awareness.on('update', handleAwarenessUpdate);
      
      return () => {
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('wheel', preventDefaultWheelBehavior);
        clearInterval(cleanupInterval);
        clearInterval(fixedCameraInterval);
        awareness.off('update', handleAwarenessUpdate);
      };
    }
  }, [editor, provider, yDoc]);
  
  return null;
};

export default EditorComponent;
