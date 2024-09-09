// TypingIndicator.js
import React from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseConfig'; // Adjust the import path as necessary

const TypingIndicator = ({ currentUserId, selectedUserId }) => {
  const [typingUsers, setTypingUsers] = React.useState([]);

  React.useEffect(() => {
    if (currentUserId && selectedUserId) {
      const chatId = [currentUserId, selectedUserId].sort().join("_");
      const typingRef = ref(db, `typing/${chatId}`);

      const handleTypingStatusChange = (snapshot) => {
        const typingData = snapshot.val();
        if (typingData) {
          const typingUsersList = Object.keys(typingData).filter(userId => typingData[userId].typing);
          setTypingUsers(typingUsersList);
        } else {
          setTypingUsers([]);
        }
      };

      const unsubscribe = onValue(typingRef, handleTypingStatusChange);

      return () => unsubscribe();
    }
  }, [currentUserId, selectedUserId]);

  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <div className="typing-indicator">
      {typingUsers.map(userId => (
        <div key={userId}>{`${userId} is typing...`}</div>
      ))}
    </div>
  );
};

export default TypingIndicator;
