export function registerPollSocket(io) {
  io.on("connection", (socket) => {
    socket.on("poll:join", (pollId) => {
      socket.join(`poll:${pollId}`);
    });

    socket.on("poll:leave", (pollId) => {
      socket.leave(`poll:${pollId}`);
    });
  });
}
