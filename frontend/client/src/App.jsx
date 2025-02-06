import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Home from './components/Home/Home';
import './App.css';
import './global.css';

const App = () => {
  const [nickname, setNickname] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.clear();
    if (!socketRef.current) {
      //socket unique seulement si aucun n'existe déjà
      socketRef.current = io('http://localhost:6569', { transports: ['websocket'] });


      socketRef.current.on('connected', (response) => {
        if (response.success) {
          console.log("Authentification réussie !");
          setIsAuthenticated(true);
        } else {
          alert('Erreur de connexion : ' + response.error);
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('Déconnecté du serveur WebSocket');
        setIsAuthenticated(false);
      });
    }

    return () => {
      //éviter des duplications
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('connected');
        socketRef.current.off('disconnect');
      }
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() && socketRef.current) {
      console.log("Envoi du pseudo :", username.trim());
      socketRef.current.emit('setUsername', username.trim());
      setNickname(username.trim());
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    if (socketRef.current) {
      console.log("Déconnexion demandée");
      socketRef.current.emit('disconnectUser', { nickname });
      socketRef.current.disconnect();
      socketRef.current = null; // éviter une reconnexion automatique
      localStorage.clear();
    }

    // Réinitialisation de l'état
    setNickname('');
    setUsername('');
    setIsAuthenticated(false);

    //Recréation d'un nouveau socket après déconnexion
    setTimeout(() => {
      console.log("Recréation d'un nouveau socket après déconnexion");
      socketRef.current = io('http://localhost:6569', { transports: ['websocket'] });
    }, 500);
  };

  return (
    <div className="app">
      {!isAuthenticated ? (
        <form onSubmit={handleLogin} className="login-form">
          <h2 className='enter-username'>Enter your username</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            className='username-area'
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit" className='buttonClass'>Login</button>
        </form>
      ) : (
        <Home nickname={nickname} setNickname={setNickname} socket={socketRef.current} handleLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
