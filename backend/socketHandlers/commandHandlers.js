const { setUsername, getLastActive } = require('./userHandlers');
const { createChannel, deleteChannel, joinChannel, leaveChannel, listUsersInChannel } = require('./channelHandlers');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const User = require('../models/User');

const handleCommand = async (io, socket, msg, currentChannel) => {
  const parts = msg.trim().split(' ');
  const mainCommand = parts[0].slice(1).toLowerCase();

  switch (mainCommand) {
    case 'nick':
      const oldUsername_nick = socket.username;
      const newNickname = parts[1];
      if (!newNickname) {
        socket.emit('message', {
          username: 'Server',
          content: `Usage: /nick <nouveauPseudo>`,
          channel: currentChannel,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      setUsername(socket, newNickname);
      io.emit('message', {
        username: 'Server',
        content: `${oldUsername_nick} changé en ${newNickname}`,
        channel: currentChannel,
        createdAt: new Date().toISOString(),
      });
      break;

    case 'list':
      const filter = parts[1]?.toLowerCase() || '';
      const allChannels = await Channel.find();
      const filtered = filter
        ? allChannels.filter((c) => c.name.toLowerCase().includes(filter))
        : allChannels;
      const channelNames = filtered.map((c) => c.name).join(', ');
      socket.emit('message', {
        username: 'Server',
        content: channelNames ? `Canaux: ${channelNames}` : 'Aucun canal',
        channel: currentChannel,
        createdAt: new Date().toISOString(),
      });
      break;

    case 'create':
      const channelToCreate = parts[1];
      if (!channelToCreate) {
        socket.emit('message', {
          username: 'Server',
          content: 'Usage: /create <channel>',
          channel: currentChannel,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      await createChannel(io, socket, { name: channelToCreate });
      break;

    case 'delete':
      const channelToDelete = parts[1];
      if (!channelToDelete) {
        socket.emit('message', {
          username: 'Server',
          content: 'Usage: /delete <channel>',
          channel: currentChannel,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      await deleteChannel(io, socket, { name: channelToDelete });
      break;

    case 'join':
      const channelToJoin = parts[1];
      if (!channelToJoin) {
        socket.emit('message', {
          username: 'Server',
          content: 'Usage: /join <channel>',
          channel: currentChannel,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      const success = await joinChannel(io, socket, { username: socket.username, channel: channelToJoin });
      if (success) {
        socket.emit('joinConfirmed', {
          success: true,
          channel: channelToJoin
        });
      }
      break;

    case 'quit':
      const channelToQuit = parts[1];
      if (!channelToQuit) {
        socket.emit('message', {
          username: 'Server',
          content: 'Usage: /quit <channel>',
          channel: currentChannel,
          createdAt: new Date().toISOString(),
        });
        return;  // 🔹 Empêche la suite du code de s'exécuter en cas d'erreur
      }
      console.log("leave", channelToQuit);
      await leaveChannel(io, socket, { username: socket.username, channel: channelToQuit });

      break;


    case 'users': {
      try {
        // Récupère le nom du channel à partir de la commande ou du channel courant
        const channelUsers = parts[1] || currentChannel;

        // Si aucun channel n'est fourni
        if (!channelUsers) {
          socket.emit('message', {
            username: 'Server',
            content: 'Usage: /users <channel>',
            channel: currentChannel,
            createdAt: new Date().toISOString(),
          });
          break;
        }

        // Appelle la fonction pour lister les utilisateurs du channel
        await listUsersInChannel(io, socket, { channel: channelUsers });
      } catch (error) {
        console.error('Erreur dans la commande /users :', error);
        socket.emit('error', 'Erreur lors de l’exécution de la commande /users.');
      }
      break;
    }




    case 'msg':
      const to = parts[1];
      const pmContent = parts.slice(2).join(' ');

      if (!to || !pmContent) {
        socket.emit('message', {
          username: 'Server',
          content: 'Usage: /msg <pseudo> <message>',
          channel: currentChannel,
          createdAt: new Date().toISOString(),
        });
        return;
      }

      try {
        console.log('Message privé reçu avec les données :', { to, pmContent });

        // Vérification du destinataire dans la base de données
        console.log('Vérification du destinataire :', to);
        const recipient = await User.findOne({ username: to });

        if (!recipient) {
          console.log(`Destinataire "${to}" introuvable dans la base de données.`);
          socket.emit('message', {
            username: 'Server',
            content: `Utilisateur "${to}" introuvable.`,
            channel: currentChannel,
            createdAt: new Date().toISOString(),
          });
          return;
        }
        // console.log('Destinataire trouvé dans la base de données :', recipient);

        // Recherche du socket du destinataire
        console.log('Recherche du socket pour :', to);
        const recipientSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.username === to
        );

        if (recipientSocket) {
          console.log('Socket du destinataire trouvé :', recipientSocket.id);
          recipientSocket.emit('privateMessage', {
            from: socket.username,
            to: to,
            content: pmContent,
            lastActive: getLastActive(socket.username),
          });
          // Pour dire que le message privée à bien été envoyé
          socket.emit('message', {
            username: 'Server',
            content: `Message privé envoyé à ${to}.`,
            channel: currentChannel,
            createdAt: new Date().toISOString(),
          });

          socket.emit('privateMessage', {
            from: socket.username,
            to: to,
            content: pmContent,
            lastActive: getLastActive(socket.username),
          });


        } else {
          console.log(`Utilisateur "${to}" n'est pas connecté.`);
          socket.emit('message', {
            username: 'Server',
            content: `Utilisateur "${to}" n'est pas connecté.`,
            channel: currentChannel,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message privé :', error);
        socket.emit('message', {
          username: 'Server',
          content: 'Erreur serveur lors de l\'envoi du message privé.',
          channel: currentChannel,
          createdAt: new Date().toISOString(),
        });
      }
      break;



    default:
      socket.emit('message', {
        username: 'Server',
        content: `Commande inconnue: ${mainCommand}`,
        channel: currentChannel,
        createdAt: new Date().toISOString(),
      });
      break;
  }
};

module.exports = {
  handleCommand
};