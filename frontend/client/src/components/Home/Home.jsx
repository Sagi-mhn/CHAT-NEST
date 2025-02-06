import React, { useEffect, useState } from 'react';
import Notification from '../Notification/Notification';
import ChannelList from '../ChannelList/ChannelList';
import Chat from '../Chat/Chat';
import {
  Grid,
  Paper,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import './Home.css';

function Home({ nickname, setNickname, socket, handleLogout }) {
  const [channels, setChannels] = useState([]);
  const [openChannels, setOpenChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const addNotification = (text) => {
    const newNotification = { id: Date.now(), text };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  useEffect(() => {
    fetch('http://localhost:6569/channels')
      .then((res) => res.json())
      .then((data) => setChannels(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const savedOpenChannels = JSON.parse(localStorage.getItem('openChannels')) || [];
    const savedActiveChannel = localStorage.getItem('activeChannel') || null;
    if (savedOpenChannels.length > 0) {
      setOpenChannels(savedOpenChannels);
      setActiveChannel(savedActiveChannel || savedOpenChannels[0]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('openChannels', JSON.stringify(openChannels));
    localStorage.setItem('activeChannel', activeChannel);
  }, [openChannels, activeChannel]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => console.log('Socket connecté dans Home'));
    socket.on('nicknameChanged', (newNickname) => {
      setNickname(newNickname);
      addNotification(`Votre pseudo a été changé en ${newNickname}`);
    });
    socket.on('channelCreated', (newChannel) => {
      setChannels((prevChannels) =>
        prevChannels.some((channel) => channel.name === newChannel.name)
          ? prevChannels
          : [...prevChannels, newChannel]
      );
      addNotification(`Nouveau channel créé : ${newChannel.name}`);
    });
    socket.on('joinConfirmed', (response) => {
      if (response.success) {
        setOpenChannels((prevOpenChannels) =>
          prevOpenChannels.includes(response.channel)
            ? prevOpenChannels
            : [...prevOpenChannels, response.channel]
        );
        setActiveChannel(response.channel);
        addNotification(`Vous avez rejoint le channel ${response.channel}`);
      } else {
        alert('Erreur de connexion : ' + response.error);
      }
    });
    socket.on('channelDeleted', (deletedChannel) => {
      setChannels((prevChannels) =>
        prevChannels.filter((channel) => channel.name !== deletedChannel.name)
      );
      addNotification(`Le channel ${deletedChannel.name} a été supprimé`);
    });
    socket.on('leaveConfirmed', (channel) => {
      handleCloseChannel(channel);
    });
    socket.on('notification', (message) => {
      addNotification(message);
    });

    socket.on('channelRenamed', (updatedChannel) => {
      setChannels(prevChannels =>
        prevChannels.map(ch =>
          ch._id === updatedChannel._id ? updatedChannel : ch
        )
      );
    });

    return () => {
      socket.off('connect');
      socket.off('nicknameChanged');
      socket.off('channelCreated');
      socket.off('channelDeleted');
      socket.off('leaveConfirmed');
      socket.off('joinConfirmed');
      socket.off('notification');
      socket.off('channelRenamed');
    };
  }, [socket, setNickname]);

  const handleJoinChannel = (channelName) => {
    if (!openChannels.includes(channelName)) {
      socket.emit('joinChannel', { channel: channelName });
      setOpenChannels((prev) => [...prev, channelName]);
    }
    setActiveChannel(channelName);
    addNotification(`Vous avez rejoint le channel ${channelName}`);
    if (isMobile) setMobileOpen(false);
  };

  const handleCloseChannel = (channelName) => {
    setOpenChannels((prevOpenChannels) => {
      const updatedOpenChannels = prevOpenChannels.filter((ch) => ch !== channelName);
      localStorage.setItem('openChannels', JSON.stringify(updatedOpenChannels));
      if (activeChannel === channelName) {
        const newActiveChannel = updatedOpenChannels.length > 0 ? updatedOpenChannels[0] : null;
        setActiveChannel(newActiveChannel);
        localStorage.setItem('activeChannel', newActiveChannel);
      }
      return updatedOpenChannels;
    });
    addNotification(`Vous avez quitté le channel ${channelName}`);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: 250, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
      <Box>
        <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
          Channels
        </Typography>
        <ChannelList
          channels={channels}
          setChannels={setChannels}
          currentChannel={activeChannel}
          onSelectChannel={handleJoinChannel}
          setOpenChannels={setOpenChannels}
          socket={socket}
        />
      </Box>
      <Button variant="contained" color="error" onClick={handleLogout} fullWidth>
        LOGOUT
      </Button>
    </Box>
  );

  return (
    <div className="app">
      <Notification messages={notifications} removeMessage={removeNotification} />
      <Box sx={{ padding: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" align="center" sx={{ color: '#555', fontWeight: 'bold' }}>
            CHAT'NEST
          </Typography>
          {isMobile ? (
            <IconButton onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
          ) : (
            <Button variant="contained" color="error" onClick={handleLogout}>
              LOGOUT
            </Button>
          )}
        </Box>

        <Grid container spacing={2} sx={{ flex: 1 }}>
          {!isMobile && (
            <Grid item xs={12} sm={3}>
              <Paper
                sx={{
                  height: '600px',
                  padding: 4,
                  borderRadius: 1.2,
                  overflow: 'auto',
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Channels
                </Typography>
                <ChannelList
                  channels={channels}
                  setChannels={setChannels}
                  currentChannel={activeChannel}
                  onSelectChannel={handleJoinChannel}
                  setOpenChannels={setOpenChannels}
                  socket={socket}
                />
              </Paper>
            </Grid>
          )}

          <Grid item xs={12} sm={isMobile ? 12 : 9}>
            <Paper
              sx={{
                height: '600px',
                padding: 4,
                borderRadius: 1.2,
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Tabs
                value={activeChannel || false}
                onChange={(e, value) => setActiveChannel(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {openChannels.map((channelName) => (
                  <Tab
                    key={channelName}
                    value={channelName}
                    label={
                      <span>
                        {channelName}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseChannel(channelName);
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </span>
                    }
                  />
                ))}
                <Tab
                  value="Messages privés"
                  label="Messages privés"
                />
              </Tabs>

              {activeChannel ? (
                <Chat currentChannel={activeChannel} username={nickname} socket={socket} onCloseChannel={handleCloseChannel} />
              ) : (
                <Typography align="center" sx={{ mt: 4 }}>
                  Sélectionnez un channel pour commencer à chatter.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Drawer pour mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 291, backgroundColor: '#ffffffde' },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </div>
  );
}

export default Home;
