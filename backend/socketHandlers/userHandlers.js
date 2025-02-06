const User = require('../models/User');
const Message = require('../models/Message')

const connectedUsers = new Map();

const setUsername = async (socket, username) => {
  if (!username || username.trim() === '') {
    socket.emit('error', 'Nom d\'utilisateur invalide.');
    return;
  }

  const oldUsername = socket.username || 'Anonyme';
  socket.username = username.trim();

  connectedUsers.set(socket.id, { username: socket.username, lastActive: Date.now() });

  try {
    await User.updateOne(
      { username: socket.username },
      { $set: { username: socket.username, lastActive: Date.now() } },
      { upsert: true }
    );
    console.log(`Utilisateur ${socket.id} enregistré : ${socket.username}`);
  } catch (error) {
    console.error('Erreur lors de l"enregistrement de l"utilisateur :', error);
  }
  try {
    await Message.updateMany(
      { username: oldUsername }, // Condition : messages avec l'ancien username
      { $set: { username: socket.username } } // Mise à jour : nouveau username
    );
  } catch (error) {
    console.error('Erreur lors du changement du propriétaire des message :', error);
  }

  // Confirmation au client de la connexion réussie
  socket.emit('connected', {
    success: true,
    username: socket.username,
    message: `Bienvenue, ${socket.username}! Vous êtes maintenant connecté.`,
  });


  //Permet l' Envoie d'une notif
  socket.emit('notification', `${oldUsername} est maintenant ${socket.username}`);
};

const updateUserActivity = (socket) => {
  if (connectedUsers.has(socket.id)) {
    connectedUsers.get(socket.id).lastActive = Date.now();
  }
};


const disconnectUser = (socket) => {
  console.log(`Utilisateur déconnecté : ${socket.username || 'Anonyme'}`);
  connectedUsers.delete(socket.id);
};

const getLastActive = (username) => {
  for (const [, user] of connectedUsers) {
    if (user.username === username) {
      return user.lastActive;
    }
  }
  return null;
};

module.exports = {
  setUsername,
  updateUserActivity,
  disconnectUser,
  connectedUsers,
  getLastActive,
};
