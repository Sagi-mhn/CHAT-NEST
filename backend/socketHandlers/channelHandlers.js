const Channel = require('../models/Channel');


/**
 * Liste tous les channels existants.
 */
const listChannels = async (req, res) => {
  try {
    const channels = await Channel.find();
    res.status(200).json(channels);
  } catch (error) {
    console.error('Erreur lors de la récupération des channels :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Permet à un utilisateur de rejoindre un channel.
 */
const joinChannel = async (io, socket, { channel }) => {
  console.log("join channel", channel);
  try {
    const existingChannel = await Channel.findOne({ name: channel });
    if (!existingChannel) {
      socket.emit('error', `Channel "${channel}" non trouvé.`);
      console.log('error', `Channel "${channel}" non trouvé.`);
      return false;  // On retourne false pour indiquer l'échec
    }

    if (!existingChannel.users.includes(socket.username)) {
      existingChannel.users.push(socket.username);
      await existingChannel.save();
    }

    socket.join(channel);
    console.log('notification', `${socket.username} a rejoint le channel "${channel}"`);

    // Émet un événement de mise à jour au client qui rejoint
    socket.emit('channelJoined', channel);

    io.emit('message', {
      username: 'Server',
      content: `${socket.username} a rejoint le channel "${channel}"`,
      channel: channel,
      createdAt: new Date().toISOString(),
    });

    return true;  // On retourne true pour indiquer le succès
  } catch (error) {
    console.error('Erreur lors de la connexion au channel :', error);
    return false;
  }
};


/**
 * Permet à un utilisateur de quitter un channel.
 */
const leaveChannel = async (io, socket, { channel }) => {
  try {
    const existingChannel = await Channel.findOne({ name: channel });
    if (!existingChannel) {
      socket.emit('error', `Channel "${channel}" non trouvé.`);
      return;
    }

    existingChannel.users = existingChannel.users.filter((user) => user !== socket.username);
    await existingChannel.save();
    const old_channel = channel;
    socket.leave(channel);
    socket.emit('leaveConfirmed', channel);
    io.emit('message', {
      username: 'Server',
      content: `${socket.username} a quitté le channel "${old_channel}"`,
      channel: channel,
      createdAt: new Date().toISOString(),
    });


  } catch (error) {
    console.error('Erreur lors de la déconnexion du channel :', error);
  }
};
/**
 * Crée un nouveau channel.
 */
const createChannel = async (io, socket, { name }) => {
  try {
    if (!name || name.trim() === '') {
      socket.emit('error', 'Nom de channel invalide.');
      return;
    }

    const existingChannel = await Channel.findOne({ name });
    if (existingChannel) {
      socket.emit('error', 'Le channel existe déjà.');
      return;
    }

    const newChannel = new Channel({ name });
    await newChannel.save();

    io.emit('channelCreated', { name: newChannel.name, users: [] });
    socket.emit('message', {
      username: 'Server',
      content: `Channel "${name}" créé avec succès.`,
    });
  } catch (error) {
    console.error('Erreur lors de la création du channel :', error);
    socket.emit('error', 'Erreur lors de la création du channel.');
  }
};

/**
 * Supprime un channel.
 */
const deleteChannel = async (io, socket, { name }) => {
  try {
    const channel = await Channel.findOneAndDelete({ name });
    if (!channel) {
      socket.emit('message', {
        username: 'Server',
        content: `Le canal "${name}" n'existe pas.`,
        channel: null,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    io.emit('channelDeleted', { name });

    socket.emit('message', {
      username: 'Server',
      content: `Le canal "${name}" a été supprimé avec succès.`,
      channel: null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du canal :', error);
    socket.emit('message', {
      username: 'Server',
      content: 'Erreur serveur lors de la suppression du canal.',
      channel: null,
      createdAt: new Date().toISOString(),
    });
  }
};
/**
 * Liste les utilisateurs connectés dans un channel donné.
 */
const listUsersInChannel = async (io, socket, { channel }) => {
  try {
    // Récupère les sockets dans la room spécifiée
    const room = io.sockets.adapter.rooms.get(channel);

    // Vérifie si la room existe
    if (!room) {
      socket.emit('error', `Le channel "${channel}" n'existe pas.`);
      return;
    }

    // Récupère les utilisateurs à partir des sockets
    const users = Array.from(room).map((socketId) => {
      const userSocket = io.sockets.sockets.get(socketId);
      return userSocket?.username || 'Anonyme'; // Nom d'utilisateur ou 'Anonyme' par défaut
    });

    // Envoie la liste des utilisateurs au client
    socket.emit('message', {
      username: 'Server',
      content: `Utilisateurs dans le channel "${channel}" : ${users.join(', ')}`,
      channel,
      createdAt: new Date().toISOString(),
    });

    // Retourne la liste pour usage interne éventuel
    return users;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    socket.emit('error', 'Erreur lors de la récupération des utilisateurs.');
    return [];
  }
};

module.exports = {
  listChannels,
  createChannel,
  deleteChannel,
  joinChannel,
  leaveChannel,
  listUsersInChannel
};