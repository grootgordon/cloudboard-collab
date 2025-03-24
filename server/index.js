
const { Server } = require('@hocuspocus/server')
const { Logger } = require('@hocuspocus/extension-logger')

// Create a new Hocuspocus server instance
const server = Server.configure({
  port: process.env.PORT || 1234,
  extensions: [
    new Logger({
      // Configure the Logger as needed
      onLoadDocument: false,
      onChange: false,
      onConnect: true,
      onDisconnect: true,
      onDestroy: true,
    }),
  ],
})

// Start the server
server.listen()
console.log(`Hocuspocus server running at http://localhost:${process.env.PORT || 1234}`)
