
import React from 'react';

interface ConnectionStatusProps {
  connectionStatus: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connectionStatus }) => {
  if (connectionStatus === 'connected') return null;
  
  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 z-50 rounded shadow-md">
      {connectionStatus === 'connecting' ? 'Connecting to server...' : 'Disconnected from server. Check if the Hocuspocus server is running.'}
    </div>
  );
};

export default ConnectionStatus;
