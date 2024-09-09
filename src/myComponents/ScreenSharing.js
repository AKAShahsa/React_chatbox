import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faStopCircle } from '@fortawesome/free-solid-svg-icons';
import SimplePeer from 'simple-peer';
import './ScreenSharing.css'; 
import { addDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from '../firebaseConfig';

const ScreenSharing = ({ currentUserId, selectedUserId }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState(null);
  const [isStreamAvailable, setIsStreamAvailable] = useState(false); // For the selected user to know a stream is available
  const localVideoRef = useRef(null);  // For local stream
  const remoteVideoRef = useRef(null); // For remote stream
  const peerRef = useRef(null);

  useEffect(() => {
    // Check if a stream is available for the selected user
    listenForSignal();
  }, []);

  // Function to handle starting screen sharing
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,  // Optionally share audio
      });
      setStream(screenStream);
  
      // Delay setting srcObject to ensure videoRef is available
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
      }, 100);
  
      // Initiate Simple-Peer connection
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: screenStream
      });
  
      peer.on('signal', async (data) => {
        // Send signaling data to Firestore
        const chatId = [currentUserId, selectedUserId].sort().join('_');
        await addDoc(collection(db, `chats/${chatId}/signals`), {
          senderId: currentUserId,
          receiverId: selectedUserId,
          signal: data,
          timestamp: serverTimestamp(),
        });
      });
  
      peer.on('stream', (remoteStream) => {
        // Handle remote stream
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
  
      peerRef.current = peer;
  
      // Listen for incoming signaling data from Firestore
      listenForSignal();
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  // Function to listen for stream availability and signals from Firestore
  const listenForSignal = () => {
    const chatId = [currentUserId, selectedUserId].sort().join('_');

    // Check if a stream is available
    onSnapshot(collection(db, `chats/${chatId}/streamAvailable`), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          setIsStreamAvailable(true);  // Selected user gets notified of stream availability
        }
      });
    });

    // Listen for incoming signaling data
    onSnapshot(collection(db, `chats/${chatId}/signals`), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && change.doc.data().receiverId === currentUserId) {
          const signal = change.doc.data().signal;
          if (peerRef.current) {
            peerRef.current.signal(signal);  // Send the signal data to Simple-Peer
          } else {
            // Create peer if selected user clicks "Watch Stream"
            const peer = new SimplePeer({
              initiator: false,
              trickle: false,
            });

            peer.on('signal', async (data) => {
              await addDoc(collection(db, `chats/${chatId}/signals`), {
                senderId: currentUserId,
                receiverId: selectedUserId,
                signal: data,
                timestamp: serverTimestamp(),
              });
            });

            peer.on('stream', (remoteStream) => {
              remoteVideoRef.current.srcObject = remoteStream; // Show the selected user's video
            });

            peerRef.current = peer;
            peer.signal(signal);  // Send the signal data to Simple-Peer
          }
        }
      });
    });
  };

  // Function to handle stopping screen sharing
  const stopScreenShare = () => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);

      if (peerRef.current) {
        peerRef.current.destroy();  // Destroy the peer connection
        peerRef.current = null;
      }
    }
  };

  const toggleStreamingOptions = () => {
    setIsStreaming((prev) => !prev);
  };

  return (
    <div className="screen-sharing-component">
      {/* Streaming Icon to toggle screen sharing options */}
      <button
        className="streaming-toggle-btn"
        onClick={toggleStreamingOptions}
        aria-label="Toggle Screen Sharing Options"
      >
        <FontAwesomeIcon icon={isStreaming ? faStopCircle : faVideo} className="text-white" />
      </button>

      {/* Screen sharing options - shown when user clicks the streaming icon */}
      {isStreaming && (
        <div className="streaming-options bg-gray-800 p-3 rounded-lg shadow-lg mt-2">
          <button
            className="btn btn-primary mb-2 w-full"
            onClick={startScreenShare}
            disabled={stream !== null}
          >
            Start Screen Share
          </button>
          <button
            className="btn btn-danger w-full"
            onClick={stopScreenShare}
            disabled={stream === null}
          >
            Stop Screen Share
          </button>
        </div>
      )}

      {/* Video element to show your local stream */}
      {stream && (
        <div className="screen-stream bg-black mt-4 p-2 rounded-lg">
          <h3>Your Screen</h3>
          <video ref={localVideoRef} autoPlay playsInline className="w-full h-64 rounded"></video>
        </div>
      )}

      {/* Option for the selected user to watch the stream */}
      {isStreamAvailable && !stream && (
        <button
          className="btn btn-primary mb-2 w-full"
          onClick={() => listenForSignal()}
        >
          Watch Stream
        </button>
      )}

      {/* Video element for the remote user to see the stream */}
      <div className="screen-stream bg-black mt-4 p-2 rounded-lg">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-64 rounded ${!stream ? 'hidden' : ''}`}
        ></video>
      </div>
    </div>
  );
};

export default ScreenSharing;
