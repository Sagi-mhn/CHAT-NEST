const { Server } = require('socket.io');
const { createServer } = require('http');
const Client = require('socket.io-client');
const { 
  joinChannel, 
  leaveChannel, 
  createChannel, 
  deleteChannel, 
  listUsersInChannel, 
  renameChannel 
} = require('../socketHandlers/channelHandlers');
const { setUsername, disconnectUser } = require('../socketHandlers/userHandlers');
const Channel = require('../models/Channel');

jest.mock('../models/Channel');

let io, serverSocket, clientSocket;

beforeAll((done) => {
  const httpServer = createServer();
  io = new Server(httpServer);
  httpServer.listen(() => {
    const port = httpServer.address().port;
    clientSocket = Client(`http://localhost:${port}`);
    io.on('connection', (socket) => {
      serverSocket = socket;
    });
    clientSocket.on('connect', done);
  });
});

afterAll(() => {
  io.close();
  clientSocket.close();
});

describe('Socket.IO Handlers', () => {
  describe('joinChannel', () => {
    it('devrait permettre à un utilisateur de rejoindre un channel existant', async () => {
      Channel.findOne.mockResolvedValue({ name: 'General', users: [] });

      serverSocket.on('joinChannel', async (data) => {
        await joinChannel(io, serverSocket, data);
      });

      clientSocket.emit('joinChannel', { channel: 'General' });

      serverSocket.on('channelJoined', (channel) => {
        expect(channel).toBe('General');
      });
    });

    it('devrait retourner une erreur si le channel n\'existe pas', async () => {
      Channel.findOne.mockResolvedValue(null);

      serverSocket.on('joinChannel', async (data) => {
        await joinChannel(io, serverSocket, data);
      });

      clientSocket.emit('joinChannel', { channel: 'NonExistent' });

      serverSocket.on('error', (error) => {
        expect(error).toBe('Channel "NonExistent" non trouvé.');
      });
    });
  });

  describe('leaveChannel', () => {
    it('devrait permettre à un utilisateur de quitter un channel', async () => {
      Channel.findOne.mockResolvedValue({ name: 'General', users: ['User1'] });

      serverSocket.on('leaveChannel', async (data) => {
        await leaveChannel(io, serverSocket, data);
      });

      clientSocket.emit('leaveChannel', { channel: 'General' });

      serverSocket.on('message', (message) => {
        expect(message.content).toContain('a quitté le channel');
      });
    });
  });

  describe('createChannel', () => {
    it('devrait créer un nouveau channel si le nom est valide', async () => {
      Channel.findOne.mockResolvedValue(null);
      Channel.prototype.save = jest.fn().mockResolvedValue({ name: 'NewChannel' });

      serverSocket.on('createChannel', async (data) => {
        await createChannel(io, serverSocket, data);
      });

      clientSocket.emit('createChannel', { name: 'NewChannel' });

      serverSocket.on('message', (message) => {
        expect(message.content).toContain('créé avec succès');
      });
    });

    it('devrait retourner une erreur si le channel existe déjà', async () => {
      Channel.findOne.mockResolvedValue({ name: 'NewChannel' });

      serverSocket.on('createChannel', async (data) => {
        await createChannel(io, serverSocket, data);
      });

      clientSocket.emit('createChannel', { name: 'NewChannel' });

      serverSocket.on('error', (error) => {
        expect(error).toBe('Le channel existe déjà.');
      });
    });
  });

  describe('deleteChannel', () => {
    it('devrait supprimer un channel existant', async () => {
      Channel.findOneAndDelete.mockResolvedValue({ name: 'General' });

      serverSocket.on('deleteChannel', async (data) => {
        await deleteChannel(io, serverSocket, data);
      });

      clientSocket.emit('deleteChannel', { name: 'General' });

      serverSocket.on('channelDeleted', (channel) => {
        expect(channel.name).toBe('General');
      });
    });

    it('devrait retourner une erreur si le channel n\'existe pas', async () => {
      Channel.findOneAndDelete.mockResolvedValue(null);

      serverSocket.on('deleteChannel', async (data) => {
        await deleteChannel(io, serverSocket, data);
      });

      clientSocket.emit('deleteChannel', { name: 'NonExistent' });

      serverSocket.on('message', (message) => {
        expect(message.content).toContain('n\'existe pas');
      });
    });
  });

  describe('renameChannel', () => {
    it('devrait renommer un channel existant', async () => {
      Channel.findOne.mockResolvedValueOnce(null);
      Channel.findOne.mockResolvedValueOnce({ name: 'OldChannel' });

      serverSocket.on('renameChannel', async (data) => {
        await renameChannel(io, serverSocket, data);
      });

      clientSocket.emit('renameChannel', { oldName: 'OldChannel', newName: 'NewChannel' });

      serverSocket.on('channelRenamed', (channel) => {
        expect(channel.name).toBe('NewChannel');
      });
    });

    it('devrait retourner une erreur si le nouveau nom est déjà pris', async () => {
      Channel.findOne.mockResolvedValue({ name: 'NewChannel' });

      serverSocket.on('renameChannel', async (data) => {
        await renameChannel(io, serverSocket, data);
      });

      clientSocket.emit('renameChannel', { oldName: 'OldChannel', newName: 'NewChannel' });

      serverSocket.on('error', (error) => {
        expect(error).toBe('Ce nom existe déjà.');
      });
    });
  });

  describe('setUsername', () => {
    it('devrait définir le nom d\'utilisateur pour une socket', async () => {
      serverSocket.on('setUsername', async (username) => {
        await setUsername(serverSocket, username);
      });

      clientSocket.emit('setUsername', 'TestUser');

      serverSocket.on('connected', (response) => {
        expect(response.username).toBe('TestUser');
        expect(response.message).toContain('Bienvenue, TestUser');
      });
    });

    it('devrait retourner une erreur si le nom d\'utilisateur est invalide', async () => {
      serverSocket.on('setUsername', async (username) => {
        await setUsername(serverSocket, username);
      });

      clientSocket.emit('setUsername', '');

      serverSocket.on('error', (error) => {
        expect(error).toBe('Nom d\'utilisateur invalide.');
      });
    });
  });

});
