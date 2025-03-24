
# Hocuspocus Server for Yjs Collaboration

This is a simple Hocuspocus server implementation for Yjs collaboration.

## Setup and Run

1. Navigate to the server directory:
```
cd server
```

2. Install dependencies:
```
npm install
```

3. Start the server:
```
npm start
```

The server will run on port 1234 by default. You can change this by setting the PORT environment variable.

## Production Deployment

For production deployment, consider using a process manager like PM2:

```
npm install -g pm2
pm2 start index.js --name hocuspocus-server
```

Make sure to set up proper security, HTTPS, and authentication for production use.
