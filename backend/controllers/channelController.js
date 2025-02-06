const Channel = require('../models/Channel');

const listChannels = async (req, res) => {
  try {
    const channels = await Channel.find();
    res.status(200).json(channels);
  } catch (error) {
    console.error('Erreur lors de la récupération des channels :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createChannel = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Le nom du channel est requis' });
  }

  try {
    const newChannel = new Channel({ name: name.trim() });
    await newChannel.save();
    res.status(201).json(newChannel);
  } catch (error) {
    console.error('Erreur lors de la création du channel :', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Un channel avec ce nom existe déjà' });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

const deleteChannel = async (req, res) => {
  const { id } = req.params;

  try {
    const channel = await Channel.findByIdAndDelete(id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel non trouvé' });
    }
    res.status(200).json({ message: 'Channel supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du channel :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Utilisez findOneAndUpdate avec les bonnes conditions
const renameChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;

    const existingChannel = await Channel.findOne({ name: newName });
    if (existingChannel) {
      return res.status(400).json({ error: 'Ce nom existe déjà' });
    }

    const updatedChannel = await Channel.findOneAndUpdate(
      { _id: id },
      { name: newName },
      { new: true, runValidators: true }
    );

    if (!updatedChannel) {
      return res.status(404).json({ error: 'Channel non trouvé' });
    }

    res.status(200).json(updatedChannel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};







module.exports = {
  listChannels,
  createChannel,
  deleteChannel,
  renameChannel
};
