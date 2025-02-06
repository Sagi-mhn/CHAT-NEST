import React, { useState } from 'react';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, IconButton, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import './ChannelList.css';

function ChannelList({ channels, setChannels, currentChannel, onSelectChannel, socket }) {
  const [newChannel, setNewChannel] = useState('');
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [editedChannelName, setEditedChannelName] = useState('');

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (newChannel.trim()) {
      socket.emit('createChannel', { name: newChannel.trim() });
      setNewChannel('');
    }
  };

  const handleDeleteChannel = (channelName) => {
    socket.emit('deleteChannel', { name: channelName });
  };

  const handleRenameChannel = (channel) => {
    setEditingChannelId(channel._id);
    setEditedChannelName(channel.name);
  };
  
const submitRename = async (channel) => {
  if (editedChannelName.trim() && editedChannelName.trim() !== channel.name) {
    try {
      const response = await fetch(`http://localhost:6569/channels/${channel._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: editedChannelName.trim() })
      });

      if (!response.ok) throw await response.json();

      const updatedChannel = await response.json();
      setChannels(prev => prev.map(ch => ch._id === channel._id ? updatedChannel : ch));
      
    } catch (error) {
      console.error('Erreur de renommage :', error);
      socket.emit('renameError', { error: error.message || 'Erreur serveur' });
    } finally {
      setEditingChannelId(null);
      setEditedChannelName('');
    }
  }
};


  

  return (
    <>
      <List>
        {channels.map((channel) => (
          <ListItem
            key={channel._id || channel.name}
            button
            selected={currentChannel === channel.name}
            onClick={() => onSelectChannel(channel.name)}
            className="channel-list-item"
          >
            <ListItemAvatar>
              <Avatar>{channel.name[0].toUpperCase()}</Avatar>
            </ListItemAvatar>
            {editingChannelId === channel._id ? (
              <TextField
                value={editedChannelName}
                onChange={(e) => setEditedChannelName(e.target.value)}
                onBlur={() => submitRename(channel)}
                onKeyPress={(e) => { if (e.key === 'Enter') submitRename(channel); }}
                variant="standard"
                autoFocus
                className="rename-input"
              />
            ) : (
              <ListItemText primary={channel.name} />
            )}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleRenameChannel(channel);
              }}
              color="primary"
              className="rename-button"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteChannel(channel.name);
              }}
              color="error"
              className="delete-button"
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>

      <form onSubmit={handleCreateChannel} className="create-channel-container">
        <textarea
          className="create-channel-input"
          placeholder="Nouveau Channel..."
          value={newChannel}
          onChange={(e) => setNewChannel(e.target.value)}
          rows="2"
        />
        <button type="submit" className="buttonClass">
          CREATE
        </button>
      </form>
    </>
  );
}

export default ChannelList;
