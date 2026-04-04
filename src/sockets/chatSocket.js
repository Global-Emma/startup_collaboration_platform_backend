const { Server } = require('socket.io');

const startSocket = (server) => {
  const io = new Server(server, {
    // cors: {
    //   origin: 'http://localhost:5173',
    // },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join project room
    socket.on('joinProject', (projectId) => {
      socket.join(projectId);
      console.log(`User joined project room: ${projectId}`);
    });

    // Send message
    socket.on('sendMessage', (data) => {
      const { projectId, message, sender } = data;

      if (!projectId || !message) return;

      io.to(projectId).emit('receiveMessage', {
        message,
        sender,
        createdAt: new Date(),
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = startSocket;