const Message = require('../models/Message');

const getMessages = async (req, res) => {
  const { channel } = req.query;

  if (!channel) {
    return res.status(400).json({ error: 'Le nom du channel est requis' });
  }
  try {
    const messages = await Message.find({ channel });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createMessage = async (req, res) => {
  const { username, channel, content } = req.body;
  if (!username || !channel || !content) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  console.log('Requête reçue pour la création de message :', req.body);

  try {
    const newMessage = new Message({ username, channel, content });
    await newMessage.save();
    console.log('Message créé avec succès :', newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Erreur lors de la création du message :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }

};

module.exports = {
  getMessages,
  createMessage
};
