
import React from 'react';
import { useParams } from 'react-router-dom';
import Whiteboard from '@/components/whiteboard/Whiteboard';

const WhiteboardRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  
  if (!roomId) {
    return <div className="flex items-center justify-center h-screen">Invalid room ID</div>;
  }
  
  return <Whiteboard roomId={roomId} />;
};

export default WhiteboardRoom;
