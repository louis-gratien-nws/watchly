const { EventEmitter } = require("events");

const emitter = new EventEmitter();
emitter.setMaxListeners(500);

const userChannel = (userId) => `club-user:${String(userId)}`;

const subscribeUserClubEvents = (userId, listener) => {
  const channel = userChannel(userId);
  emitter.on(channel, listener);

  return () => {
    emitter.off(channel, listener);
  };
};

const emitClubEventToUsers = (userIds, payload) => {
  userIds.forEach((userId) => {
    emitter.emit(userChannel(userId), payload);
  });
};

module.exports = {
  subscribeUserClubEvents,
  emitClubEventToUsers
};
