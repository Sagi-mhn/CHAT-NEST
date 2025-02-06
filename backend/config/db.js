const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log("Tentative de connexion à MongoDB avec URI:", process.env.DB_URI);

    if (mongoose.connection.readyState === 1) {
      console.log("Connexion MongoDB déjà active.");
      return mongoose.connection;
    }

    const connection = await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: 5000 // ⏳ Timeout réduit pour éviter un blocage de Jest
    });

    if (!connection || mongoose.connection.readyState !== 1) {
      throw new Error('Échec de la connexion à MongoDB');
    }

    console.log('Connexion à MongoDB réussie !');
    return mongoose.connection;
  } catch (error) {
    console.error('Erreur de connexion à MongoDB :', error);
    throw new Error('Échec de la connexion à MongoDB'); // ✅ Lève une erreur explicite
  }
};

module.exports = connectDB;