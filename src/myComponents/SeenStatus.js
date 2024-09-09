import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

function SeenStatus({ chatId, messageId, currentUserId }) {
  const [isSeen, setIsSeen] = useState(false);

  useEffect(() => {
    if (!chatId || !messageId || !currentUserId) {
      console.error('Missing required props for SeenStatus component');
      return;
    }

    // Firestore document reference for the message
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);

    // Listen for changes in the seenBy field
    const unsubscribe = onSnapshot(messageRef, (snapshot) => {
      const messageData = snapshot.data();
      if (messageData?.seenBy?.includes(currentUserId)) {
        setIsSeen(true);
      } else {
        setIsSeen(false);
      }
    });

    // Mark message as seen if it's currently unseen
    const markAsSeen = async () => {
      if (!isSeen) {
        try {
          await updateDoc(messageRef, {
            seenBy: arrayUnion(currentUserId),
          });
        } catch (error) {
          console.error('Error marking message as seen:', error);
        }
      }
    };

    // Call the markAsSeen function to update Firestore
    markAsSeen();

    // Cleanup the onSnapshot listener when the component is unmounted
    return () => unsubscribe();
  }, [chatId, messageId, currentUserId, isSeen]);

  return (
    <div className="seen-status">
      {isSeen ? (
        <span className="seen-text">Seen</span>
      ) : (
        <span className="unseen-text">Unseen</span>
      )}
    </div>
  );
}

export default SeenStatus;
