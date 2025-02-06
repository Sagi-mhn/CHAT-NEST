const User = require('../models/User');

const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des messages :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const createUser = async (req, res) => {
    const { username } = req.body;
    console.log(req.query, username);
    if (!username) {
        return res.status(400).json({ error: "Le nom d'utilisateur est requis " });
    }

    try {
        const newUser = new User({ username: username });
        console.log(newUser);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error("Erreur lors de la création de l'utilisateur :", error);
        res.status(500).json({ error: 'Erreur serveur' });
    }

};

module.exports = {
    getUsers,
    createUser
};

