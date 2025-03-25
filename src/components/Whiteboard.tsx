
import React, { useEffect, useState, useRef } from 'react';
import { Tldraw, useEditor, TLRecord, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { toast } from 'sonner';
import WhiteboardToolbar from './WhiteboardToolbar';
import CursorPresence from './CursorPresence';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Get container size
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
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
          toast.success('连接到协作服务器成功');
          setConnectionAttempts(0);
        } else if (status === 'disconnected') {
          toast.error('与协作服务器连接断开');
          
          // If we've made less than 3 attempts, try to reconnect
          if (connectionAttempts < 3) {
            setConnectionAttempts(prev => prev + 1);
            toast('正在尝试重新连接...', {
              description: `尝试 ${connectionAttempts + 1}/3`
            });
          } else {
            toast.error('无法连接到服务器，请检查服务器是否运行');
          }
        }
      }
    });
    
    // Handle errors with event listener instead of config option
    hocuspocusProvider.on('error', (error) => {
      console.error('Connection error:', error);
      toast.error(`连接错误: ${error.message || '未知错误'}`);
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
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    const randomId = Math.random().toString(36).slice(2, 10);
    
    awareness.setLocalState({
      id: randomId,
      user: {
        name: `用户 ${Math.floor(Math.random() * 1000)}`,
        color: randomColor,
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
    
    // Handle tool changes from our custom toolbar
    const handleToolChange = (tool: string) => {
      if (!editor) return;
      
      switch (tool) {
        case "select":
          editor.setSelectedTool("select");
          break;
        case "hand":
          editor.setSelectedTool("hand");
          break;
        case "pen":
          editor.setSelectedTool("draw");
          break;
        case "text":
          editor.setSelectedTool("text");
          break;
        case "shapes":
          editor.setSelectedTool("geo");
          break;
        case "eraser":
          editor.setSelectedTool("eraser");
          break;
        default:
          break;
      }
    };
    
    // Handle color changes
    const handleColorChange = (color: string) => {
      if (!editor) return;
      editor.updateInstanceState({ 
        stylesForNextShape: { 
          ...editor.getInstanceState().stylesForNextShape,
          color 
        } 
      });
    };
    
    // Handle undo/redo
    const handleUndo = () => {
      if (!editor) return;
      editor.undo();
    };
    
    const handleRedo = () => {
      if (!editor) return;
      editor.redo();
    };
    
    // Handle clear
    const handleClear = () => {
      if (!editor) return;
      editor.selectAll();
      const ids = Array.from(editor.getSelectedShapeIds());
      if (ids.length > 0) {
        editor.deleteShapes(ids);
      }
    };
    
    // Handle save
    const handleSave = async () => {
      if (!editor) return;
      try {
        const selectedIds = Array.from(editor.getSelectedShapeIds());
        const allIds = editor.getShapeIds();
        
        const svg = await editor.getSvg(selectedIds.length > 0 ? selectedIds : allIds);
          
        if (svg) {
          const svgString = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(svgBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `whiteboard-${roomId}.svg`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('画板已保存为SVG');
        }
      } catch (error) {
        console.error('Error saving SVG:', error);
        toast.error('保存失败');
      }
    };
    
    return (
      <>
        <WhiteboardToolbar 
          onToolChange={handleToolChange}
          onColorChange={handleColorChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onSave={handleSave}
        />
      </>
    );
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">加载白板中...</div>;
  }
  
  return (
    <div ref={containerRef} className="h-screen w-full relative">
      {connectionStatus !== 'connected' && (
        <div className="fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 z-50 rounded shadow-md">
          {connectionStatus === 'connecting' ? '正在连接服务器...' : '未连接到服务器。请检查 Hocuspocus 服务器是否正在运行。'}
        </div>
      )}
      {store && (
        <div className="relative h-full">
          <Tldraw 
            store={store}
            autoFocus
            hideUi={true}
          >
            <EditorComponent />
          </Tldraw>
          {provider && <CursorPresence provider={provider} roomId={roomId} />}
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
