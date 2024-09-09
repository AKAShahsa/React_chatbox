import React, { useEffect, useState, useRef  , memo } from 'react';
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs,setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import HeaderTwo from './HeaderTwo';
import './Dashboard.css'; // Ensure this file contains the necessary styles
import defaultProfilePic from './img/default-profile.png'; 
import MusicPlayer from './MusicPlayer';
import { Link} from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
// import ScreenSharing from './ScreenSharing';
// import ScreenShareComponent from './ScreenShareComponent';

import { getDatabase, ref, onValue, set, onDisconnect } from "firebase/database";
import { format } from 'date-fns'; // Import date-fns
import request, { LINK } from 'superagent';

// import AIChatbot from './AiChatbot';
// import SeenStatus from './SeenStatus';

// Sidebar Component
const Sidebar = ({ users, selectedUserId, handleUserClick, show, handleToggle }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter users based on exact match
  const filteredUsers = searchTerm
    ? users.filter(user =>
        user.username.toLowerCase() === searchTerm.toLowerCase()
      )
    : []; // Show no users if the search term is empty

  return (
    <div
      className={`offcanvas sidebar offcanvas-start ${show ? 'show' : ''}`}
      style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#f8f9fa',
        transform: show ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        height: '100vh'
      }}
      aria-labelledby="offcanvasSidebarLabel"
    >
      <div className="offcanvas-header">
        <h5 id="offcanvasSidebarLabel">Users</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={handleToggle}></button>
      </div>
      <div className="offcanvas-body">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          className="form-control mb-3"
          placeholder="Search by username..."
        />
        <div className="bg-gray-100 rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <ul className="list-unstyled">
            {searchTerm && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <li
                  key={user.id}
                  className={`p-2 mb-2 rounded cursor-pointer ${
                    user.id === selectedUserId ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-black'
                  }`}
                  onClick={() => handleUserClick(user.id)}
                >
                  {user.username}
                </li>
              ))
            ) : (
              searchTerm && <li className="p-2 mb-2 rounded text-gray-500">No users found</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

function Dashboard() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(""); // For private messaging
  const [users, setUsers] = useState([]); // List of users for the sidebar
  const [show, setShow] = useState(false); // Sidebar visibility state
  const confettiRef = useRef(null);
  const chatboxEndRef = useRef(null);
  const [usersPresence, setUsersPresence] = useState({});
  const chatId = [currentUserId, selectedUserId].sort().join("_");
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const db = getDatabase();
  
    if (currentUserId) {
      // Reference to the presence node for the current user
      const userPresenceRef = ref(db, `presence/${currentUserId}`);
      const isOnline = {
        online: true,
        lastOnline: null
      };
    
      const isOffline = {
        online: false,
        lastOnline: Date.now()
      };
    
      // Set the user's status to online
      set(userPresenceRef, isOnline);
    
      // Handle user disconnection
      onDisconnect(userPresenceRef).set(isOffline);
    
      return () => {
        // Cleanup on unmount
        set(userPresenceRef, isOffline);
      };
    }
  }, [currentUserId]);

  useEffect(() => {
    const db = getDatabase();
    
    const usersPresenceRef = ref(db, 'presence');
    
    const handlePresenceChange = (snapshot) => {
      const presenceData = snapshot.val();
      
      // Convert presence data to a format you can use
      const usersWithPresence = {};
      for (const [userId, status] of Object.entries(presenceData)) {
        usersWithPresence[userId] = status;
      }
      
      setUsersPresence(usersWithPresence); // Assume you have a state to manage this
    };
    
    const unsubscribe = onValue(usersPresenceRef, handlePresenceChange);
  
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  useEffect(() => {
    const fetchUserData = async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
          setCurrentUserId(uid);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error.message);
      } finally {
        setLoading(false);
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user.uid);
        fetchAllUsers();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      setUsers(usersList); // Assume you have a state to manage this
    };
  
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUserId && selectedUserId) {
      const chatId = [currentUserId, selectedUserId].sort().join("_"); // Generate a consistent chat ID
      const messagesCollection = collection(db, `chats/${chatId}/messages`);
      const q = query(messagesCollection, orderBy("timestamp"));
      const unsubscribeMessages = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id, // Ensure the message ID is included
            ...data
          };
        });
        console.log("Fetched Messages:", fetchedMessages);
        setMessages(fetchedMessages);
  
        // Update read status for messages
        fetchedMessages.forEach((msg) => {
          const messageRef = doc(db, `chats/${chatId}/messages`, msg.id);
          if (!msg.readBy || !Array.isArray(msg.readBy) || !msg.readBy.includes(currentUserId)) {
            setDoc(messageRef, { readBy: [...(msg.readBy || []), currentUserId] }, { merge: true });
          }
        });
      });
  
      return () => unsubscribeMessages();
    }
  }, [currentUserId, selectedUserId]);
  

  
  
  

  useEffect(() => {
    if (chatboxEndRef.current) {
      chatboxEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUsers(usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching users:", error.message);
    }
  };

  const handleUserClick = (userId) => {
    setSelectedUserId(userId);
    setShow(false); // Hide the sidebar when a user is selected
  };
  const parseMarkdown = (text) => {
    if (!text) return text;
  
    // Replace **bold** with <strong>bold</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace ## heading with <h2>heading</h2>
    text = text.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    
    // Add more parsing rules as needed
  
    return text;
  };
  const handleSend = async () => {
    if (input.trim() && selectedUserId) {
      try {
        const chatId = [currentUserId, selectedUserId].sort().join("_"); // Generate a consistent chat ID
        await addDoc(collection(db, `chats/${chatId}/messages`), {
          senderId: currentUserId,
          receiverId: selectedUserId,
          message: input,
          timestamp: serverTimestamp(),
          readBy: [currentUserId] // Initialize with the current user
        });
        setInput(""); // Clear the input field
      } catch (error) {
        console.error("Error sending message:", error.message);
      }
    }
  // Check if the input contains '@Ai' anywhere in the message
  if (input.trim().includes('@Ai') || input.trim().includes('@ai')) {
    handleAskAi();
  }
  };
 


  const handleToggle = () => {
    setShow((prevShow) => !prevShow);
  };

  const handleCongratulationsClick = () => {
    if (confettiRef.current) {
      confettiRef.current.classList.add('show');
      setTimeout(() => {
        confettiRef.current.classList.remove('show');
      }, 3000); // Adjust the time based on your animation duration
    }
  };

 
  
    const textareaRef = useRef(null);
  
    const handleInputChange = (event) => {
      setInput(event.target.value);
      adjustHeight();
    }
    const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px'; // reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      if (scrollHeight < 200) {
        textareaRef.current.style.height = scrollHeight + 'px';
      } else {
        textareaRef.current.style.height = '200px';
      }
    }
  };
    // Function to generate AI response
  // Function to generate AI response
async function generateAnswer() {
  try {
    const res = await request
      .post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyASMQEgsih4DRcLUssiDWLylc6p8ABKYjY')
      .send({
        contents: [
          { parts: [{ text: input }] },
        ],
      });

    const aiResponseText = res.body.candidates[0].content.parts[0].text;
    setResponse(aiResponseText);

    // Send the AI response to Firestore
    const newMessage = {
      senderId: 'ai',
      message: aiResponseText,
      timestamp: serverTimestamp(), // Add timestamp
      readBy: [] // Initialize with an empty array if needed
    };

    // Ensure Firestore collection path is correct
    await addDoc(collection(db, `chats/${chatId}/messages`), newMessage);

  } catch (error) {
    console.error('Error:', error);
  }
}


  // Handle sending AI message when button is clicked
  const handleAskAi = async () => {

      generateAnswer();
  };

  const renderMessage = (messageText, senderId) => {
    if (!messageText || typeof messageText !== 'string') return messageText;
  
    // Replace keyword with clickable span
    const keyword = "Congratulations";
    const parts = messageText.split(keyword);
  
    // Apply styles for AI messages
    const aiMessageStyle = senderId === 'ai' ? 'ai-message-style' : '';
  
    // Parse Markdown-like syntax
    const parsedText = parseMarkdown(parts.join(keyword));
  
    return (
      <span className={aiMessageStyle}>
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <span className="congrats fw-bold" onClick={handleCongratulationsClick}>
              {keyword}
            </span>
            {parts.slice(1).join(keyword)}
          </>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: parsedText }} />
        )}
      </span>
    );
  };
  
  
  
  

  const formatTimestamp = (timestamp) => {
    return format(new Date(timestamp.seconds * 1000), 'HH:mm'); // Format to 'HH:mm' (24-hour format)
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevents new line on Enter key
      handleSend();
    }
  };
  const formatLastOnline = (timestamp) => {
    if (!timestamp) return "Unknown";
  
    const date = new Date(timestamp);
    return format(date, 'MMM d,  h:mm a'); // Format to 'Month day, year h:mm am/pm'
  };
  
  const chatboxStyle = { height: '70vh', width: '100%' };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-grow text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <>
      <HeaderTwo username = {username}  />
      <div className="container mainDiv mx-auto p-4" style={{ maxWidth: '1200px', height: '100vh' }}>
      

       
   
        <div className="d-flex flex-column flex-md-row">
          {/* Sidebar Toggle Button */}
          <button className="btn btn-dark shadow mb-2 mb-md-0" type="button" onClick={handleToggle}>
            <i className="fas fa-search"></i> Search User
          </button>
  
          {/* Sidebar Component */}
          <Sidebar
            users={users}
            selectedUserId={selectedUserId}
            handleUserClick={handleUserClick}
            show={show}
            handleToggle={handleToggle}
          />
  
          {/* Chatbox */}
          <div className="flex-1 rounded-lg shadow-md ">
            {selectedUser ? (
              <>
                {/* Chat Header */}
             
                <div className="flex items-center mb-4">
                  <img src={selectedUser.profilePicture || defaultProfilePic}
                    alt={selectedUser.username}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <h2 className="text-xl font-semibold text-white" style={{fontSize : '1rem'}}>{selectedUser.username}</h2>
                  <p className='text-gray-300'>&nbsp; | &nbsp;</p>
                  <p>
                    {usersPresence[selectedUserId]?.online ? (
                      <span className='text-success online-last-seen fw-bold'>Online</span>
                    ) : (
                      <span className='text-danger online-last-seen' >
                         {formatLastOnline(usersPresence[selectedUserId]?.lastOnline)}
                      </span>
                    )}
                  </p>
                  <MusicPlayer currentUserId={currentUserId} selectedUserId={selectedUserId} />
                <Link to='/sharescreen'>  <FontAwesomeIcon className='text-white' icon={faDesktop}  /></Link> {/* Use the imported icon */}
                  {/* <button className='btn btn-primary'><Link className={getLinkClass('/sharescreen')} style= {{color:'white'}} to="/sharescreen">ShareScreen</Link></button> */}
                  
                </div>
  
                {/* Chat Window */}
                <div className="chat-window overflow-y-auto  " style={chatboxStyle}>
                  {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`message p-2 mesgDiv rounded mb-2 ${
                        message.senderId === currentUserId ? 'text-white bg-success' : 
                        message.senderId === 'ai' ? 'ai-message-style' : 
                        'text-white bg-primary'
                      } ${message.readBy && Array.isArray(message.readBy) && message.readBy.includes(currentUserId) ? 'read' : 'unread'}`}
                      style={{
                       
                        alignSelf: message.senderId === currentUserId ? 'flex-end' : 'flex-start',
                        padding: '5px',
                        borderRadius: '15px',
                        marginBottom: '10px',
                        fontFamily: 'Poppins',
                        display: 'flex',
                        fontSize: '0.6rem',
                        flexDirection: 'column',
                        justifyContent: message.senderId === currentUserId ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ padding: '2px', whiteSpace: 'pre-wrap' }}>
                        {renderMessage(message.message, message.senderId)}
                      </div>
                      <div className="text-gray-300 text-xs mt-1" style={{fontSize : '0.4rem'}}>
                        {message.timestamp && formatTimestamp(message.timestamp)}
                      </div>
                      <div id="confetti" ref={confettiRef} className="confetti-animation"></div>
                      <div id="confetti" ref={confettiRef} className="confetti-animation confetti-two"></div>
                    </div>
                  ))
                  
                  
                  ) : (
                    <div className="text-center text-gray-500">
                      {selectedUserId ? 'No messages yet' : 'Select a user to start chatting'}
                    </div>
                  )}
                  <div ref={chatboxEndRef}></div>
                </div>
  
                {/* Message Input */}
                <div className="input-group mt-4 flex">
        
                <textarea
      ref={textareaRef}
      value={input}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      style={{
        minHeight: '50px',
        maxHeight: '200px',
        overflowY: input.length > 200 ? 'auto' : 'hidden',
        resize: 'none', // Prevents manual resizing
      }}
      className="form-control w-full p-2 inputMesg border rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      placeholder="Use @Ai to Ask Ai ... "
    ></textarea>
  
                  <button
                    onClick={handleSend}
                    className="btn btn-primary  bg-indigo-600 text-white rounded-r-md px-6 py-2"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                  
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">
                {users.length === 0 ? 'No users available' : 'Select a user to start chatting'}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
