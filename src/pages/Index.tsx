
import React, { useState } from 'react';
import Whiteboard from '@/components/Whiteboard';
import RoomControls from '@/components/RoomControls';

const Index = () => {
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleJoinRoom = (id: string) => {
    setRoomId(id);
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    setRoomId(newRoomId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {roomId ? (
        <div className="h-screen">
          <Whiteboard roomId={roomId} />
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <RoomControls 
            onJoinRoom={handleJoinRoom} 
            onCreateRoom={handleCreateRoom} 
          />
        </div>
      )}
    </div>
  );
};

export default Index;
