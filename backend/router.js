const express = require('express');
const { getMessages, createMessage } = require('./controllers/messageController');
const { listChannels, createChannel, deleteChannel, renameChannel } = require('./controllers/channelController');
const { getUsers, createUser } = require('./controllers/userController');


const router = express.Router();

router.get('/messages', getMessages);
router.post('/messages', createMessage);


router.get('/users', getUsers);
router.post('/users', createUser);


router.get('/channels', listChannels);
router.post('/channels', createChannel);
router.delete('/channels/:id', deleteChannel);
router.put('/channels/:id', renameChannel);


module.exports = router;
