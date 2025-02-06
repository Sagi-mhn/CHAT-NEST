import React, { useState, useEffect, useRef } from 'react';
import { timeSince } from '../../utils/timeUtils';
import './Chat.css';

function Chat({ socket, username, currentChannel }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [privateChat, setPrivateChat] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentChannel === "Messages privés") {
      // Fetch private messages if needed
    } else {
      fetch(`http://localhost:6569/messages?channel=${currentChannel}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch messages');
          return res.json();
        })
        .then((data) => setMessages(data))
        .catch((err) => console.error(`Error fetching messages: ${err.message}`));
    }

    // Ecoute des messages
    socket.on('message', (newMsg) => {
      if (newMsg.channel === currentChannel) {
        setMessages((prev) => [...prev, newMsg]);
      }
    });

    // Ecoute des messages privés
    socket.on('privateMessage', (pm) => {
      if (pm.to === username || pm.from === username) {
        setPrivateChat((prev) => [...prev, pm]);
      }
    });

    return () => {
      socket.off('message');
      socket.off('privateMessage');
    };
  }, [socket, currentChannel]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit('message', {
        username,
        content: message.trim(),
        channel: currentChannel,
      });
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      {currentChannel === "Messages privés" ? (
        <div className="private-chat chat-container">
          <div className='messages'>
            <h4>Messages privés</h4>
            {privateChat.map((pmsg, index) => (
              <div key={index} className="message">
                <strong>{pmsg.from}</strong>{' '}
                <span>({timeSince(pmsg.lastActive)})</span> : {pmsg.content}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <strong>{msg.username}</strong>: {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="input">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          rows="2"
        />
        <button onClick={handleSendMessage} disabled={!message.trim()} className='buttonClass'>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
