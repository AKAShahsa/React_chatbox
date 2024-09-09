import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faStopCircle } from '@fortawesome/free-solid-svg-icons';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import './ScreenSharing.css';

const ScreenSharingTwo = ({ currentUserId, selectedUserId }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [roomID, setRoomID] = useState(null);
  const [kitToken, setKitToken] = useState(null);
  const containerRef = useRef(null);
  const appID = 1251971854; // Replace with your actual App ID
  const serverSecret = "585175e1c5e155caa4c83a18727ab52a"; // Replace with your actual Server Secret

  useEffect(() => {
    // Generate Kit Token
    const token = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      currentUserId,
      selectedUserId
    );
    setKitToken(token);
  }, [roomID, currentUserId, selectedUserId]);

  useEffect(() => {
    if (kitToken && containerRef.current) {
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host, // You can change this to Audience if needed
          },
        },
        onJoinRoom: () => console.log('Joined Room'),
        onLeaveRoom: () => console.log('Left Room'),
        onUserJoin: (users) => console.log('User Joined:', users),
        onUserLeave: (users) => console.log('User Left:', users),
      });
    }
  }, [kitToken]);

  const startScreenShare = () => {
    if (containerRef.current && kitToken) {
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.startScreenShare(); // Start screen sharing
      setIsStreaming(true);
    }
  };

  const stopScreenShare = () => {
    if (containerRef.current && kitToken) {
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.stopScreenShare(); // Stop screen sharing
      setIsStreaming(false);
    }
  };

  const toggleStreamingOptions = () => {
    setIsStreaming(prev => !prev);
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
      {isStreaming ? (
        <div className="streaming-options bg-gray-800 p-3 rounded-lg shadow-lg mt-2">
          <button
            className="btn btn-danger w-full"
            onClick={stopScreenShare}
          >
            Stop Screen Share
          </button>
        </div>
      ) : (
        <div className="streaming-options bg-gray-800 p-3 rounded-lg shadow-lg mt-2">
          <button
            className="btn btn-primary w-full"
            onClick={startScreenShare}
          >
            Start Screen Share
          </button>
        </div>
      )}

      {/* Container for Zego UI */}
      <div
        className="zego-container absolute top-0"
        ref={containerRef}
        style={{ width: '100vw', height: '100vh' }}
      ></div>
    </div>
  );
};

export default ScreenSharingTwo;
