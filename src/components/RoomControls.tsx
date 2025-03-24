
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface RoomControlsProps {
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
}

const RoomControls = ({ onJoinRoom, onCreateRoom }: RoomControlsProps) => {
  const [roomId, setRoomId] = useState('');

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      onJoinRoom(roomId.trim());
    }
  };

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    onCreateRoom();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Collaborative Whiteboard</CardTitle>
        <CardDescription>Create or join a whiteboard room to collaborate with others</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="room-id" className="text-sm font-medium">Room ID</label>
          <Input
            id="room-id"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCreateRoom}>
          Create Room
        </Button>
        <Button onClick={handleJoinRoom}>
          Join Room
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoomControls;
