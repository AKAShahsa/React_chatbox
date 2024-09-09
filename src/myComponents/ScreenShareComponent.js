import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure you have Firebase initialized and exported from firebaseConfig.js
import HeaderTwo from './HeaderTwo';

const ScreenShareComponent = () => {
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();

    const createRoom = async () => {
        const id = uuidv4().slice(0, 8); // Generate 8-letter room ID
        const roomRef = doc(collection(db, 'rooms'), id);
        await setDoc(roomRef, {}); // Create a new room in Firestore
        navigate(`/sharescreen/${id}`); // Redirect to the room
    };

    const joinRoom = async () => {
        const roomRef = doc(db, 'rooms', roomId);
        const docSnap = await getDoc(roomRef);
        if (docSnap.exists()) {
            navigate(`/sharescreen/${roomId}`); // Redirect to the room if it exists
        } else {
            alert('Room does not exist.');
        }
    };

    return (
      <>
      <HeaderTwo/>
        <div className='container mx-auto py-5 text-center bg-dark text-white' style={{ height: '100vh' }}>
        
            
            <button onClick={createRoom} className='btn btn-success my-4'>
                Create Room
            </button>

            <p className='display-5 my-5 fw-bold shadow-sm'>OR</p>

            <input 
                className='form-control mb-2' // Simplified class for Bootstrap input
                type="text" 
                value={roomId} 
                onChange={(e) => setRoomId(e.target.value)} 
                placeholder="Enter room ID to join ..." 
            />
            <button onClick={joinRoom} className='btn btn-primary'>
                Join Room
            </button>
        </div>
        </>
    );
};

export default ScreenShareComponent;
