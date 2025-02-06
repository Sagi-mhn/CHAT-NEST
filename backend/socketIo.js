const { setUsername, updateUserActivity, disconnectUser } = require('./socketHandlers/userHandlers');
const { handlePublicMessage, handlePrivateMessage, handleCommand } = require('./socketHandlers/messageHandlers');
const { joinChannel, leaveChannel, createChannel, deleteChannel, listUsersInChannel, renameChannel } = require('./socketHandlers/channelHandlers');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Utilisateur connecté : ${socket.id}`);

    // Gestion des événements liés à l'utilisateur
    socket.on('setUsername', (username) => setUsername(socket, username));
    socket.on('disconnect', () => disconnectUser(socket));

    // Gestion des messages publics
    socket.on('message', (msg) => {
      updateUserActivity(socket);
      handlePublicMessage(io, socket, msg);
    });

    // Gestion des messages privés
    socket.on('privateMessage', (data) => {
      updateUserActivity(socket);
    });

    // Gestion des utilisateurs dans un canal
    socket.on('users', (data) => listUsersInChannel(io, socket, data));

    // Gestion des canaux
    // Gestion des canaux
    socket.on('joinChannel', (data) => {
      updateUserActivity(socket);

      // Appeler la fonction pour rejoindre le canal
      joinChannel(io, socket, { username: socket.username, channel: data.channel })
        .then(() => {
          // Une fois le canal rejoint, émettre l'événement au client
          socket.emit('channelJoined', { channel: data.channel, username: socket.username });
        })
        .catch((error) => {
          // En cas d'erreur, émettre un message d'erreur au client
          socket.emit('joinError', { error: error.message });
        });
    });



    socket.on('leaveChannel', (data) => leaveChannel(io, socket, data));
    socket.on('createChannel', (data) => createChannel(io, socket, data));
    socket.on('deleteChannel', (data) => deleteChannel(io, socket, data));
    socket.on('renameChannel', (data) => renameChannel(io, socket, data));
});
};

module.exports = initializeSocket;