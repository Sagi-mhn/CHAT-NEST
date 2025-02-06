import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../../services/socket';
import './Login.css';

function Login({ setNickname }) {
  const [nicknameInput, setNicknameInput] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (nicknameInput.trim()) {
      setNickname(nicknameInput.trim());
      localStorage.setItem('nickname', nicknameInput.trim());
      navigate('/home');
    } else {
      alert('Veuillez entrer un pseudonyme !');
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h3>WELCOME</h3>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Pseudonyme"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            className="inputField"
          />
          <button type="submit" className="buttonClass">
            LOGIN
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

