const Message = require('../models/Message');
const { getLastActive } = require('./userHandlers');
const { handleCommand } = require('./commandHandlers');

const handlePublicMessage = async (io, socket, msg) => {
  try {
    if (!msg.content.trim()) return;
    const isCommand = msg.content.startsWith('/');
    if (isCommand) {
      await handleCommand(io, socket, msg.content, msg.channel);
    } else {
      const newMessage = new Message({
        username: socket.username || 'Anonyme',
        content: msg.content.trim(),
        channel: msg.channel
      });
      await newMessage.save();
      io.to(msg.channel).emit('message', {
        _id: newMessage._id,
        username: newMessage.username,
        content: newMessage.content,
        channel: newMessage.channel,
        createdAt: newMessage.createdAt,
      });

    }
  } catch (error) {
    socket.emit('error', 'Erreur handlePublicMessage');
  }
};

module.exports = {
  handlePublicMessage
};