import React, { useEffect } from 'react';
import './Notification.css';

function Notification({ messages, removeMessage }) {
    useEffect(() => {
        messages.forEach((msg) => {
            const timer = setTimeout(() => removeMessage(msg.id), 5000);
            return () => clearTimeout(timer);
        });
    }, [messages, removeMessage]);

    return (
        <div className="notification-container">
            {messages.map((msg) => (
                <div key={msg.id} className="notification fade-in">
                    <p>{msg.text}</p>
                    <button className="close-btn" onClick={() => removeMessage(msg.id)}>✕</button>
                </div>
            ))}
        </div>
    );
}

export default Notification;
