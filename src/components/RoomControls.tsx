
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const RoomControls = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/whiteboard/${roomId.trim()}`);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    navigate(`/whiteboard/${newRoomId}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>协作白板</CardTitle>
        <CardDescription>创建或加入一个白板房间与他人协作</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="room-id" className="text-sm font-medium">房间 ID</label>
          <Input
            id="room-id"
            placeholder="输入房间 ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCreateRoom}>
          创建房间
        </Button>
        <Button onClick={handleJoinRoom}>
          加入房间
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoomControls;
