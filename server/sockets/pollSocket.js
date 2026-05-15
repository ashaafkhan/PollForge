const pendingUpdates = new Map();
const debounceTimers = new Map();

export function emitDebounced(io, pollId, payload) {
  const key = String(pollId);

  // Merge into pending (accumulate totalResponses, keep latest timestamp)
  const prev = pendingUpdates.get(key) || {};
  pendingUpdates.set(key, {
    ...prev,
    ...payload,
    totalResponses: payload.totalResponses ?? (prev.totalResponses ?? 0),
  });

  // Reset debounce timer
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }

  const timer = setTimeout(() => {
    const merged = pendingUpdates.get(key);
    if (merged) {
      io.to(`poll:${key}`).emit("response:new", merged);
      pendingUpdates.delete(key);
    }
    debounceTimers.delete(key);
  }, 5000);

  debounceTimers.set(key, timer);
}

export function registerPollSocket(io) {
  io.on("connection", (socket) => {
    socket.on("poll:join", (pollId) => {
      socket.join(`poll:${pollId}`);
    });

    socket.on("poll:leave", (pollId) => {
      socket.leave(`poll:${pollId}`);
    });

    socket.on("user:join", (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on("user:leave", (userId) => {
      socket.leave(`user:${userId}`);
    });
  });
}
