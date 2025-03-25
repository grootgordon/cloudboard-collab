
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";

const RoomControls = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/whiteboard/${roomId.trim()}`);
      toast.info(`Joining room: ${roomId.trim()}`);
    } else {
      toast.error("Please enter a room ID");
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    navigate(`/whiteboard/${newRoomId}`);
    toast.success(`Created new room: ${newRoomId}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>协作白板</CardTitle>
        <CardDescription>创建或加入一个白板房间与他人协作</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-700">
            在使用白板前，请确保 Hocuspocus 服务器已正确启动：
          </AlertDescription>
        </Alert>
        
        <div className="bg-gray-50 p-3 rounded-md text-sm border border-gray-200 space-y-2">
          <p className="font-medium">服务器设置步骤：</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>进入 server 目录: <code className="bg-gray-100 px-1">cd server</code></li>
            <li>安装依赖: <code className="bg-gray-100 px-1">npm install</code></li>
            <li>启动服务器: <code className="bg-gray-100 px-1">npm start</code></li>
          </ol>
          <p>服务器默认运行在 <code className="bg-gray-100 px-1">ws://localhost:1234</code></p>
        </div>
        
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
