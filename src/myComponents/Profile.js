import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebaseConfig'; // Import Firebase services
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import HeaderTwo from './HeaderTwo';

function Profile() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(''); // New state for username
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setDownloadURL(userDoc.data().profilePicture); // Load existing profile picture if available
            setUsername(userDoc.data().username); // Load the username
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePic(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!profilePic || !user) {
      setMessage('Please select a file and ensure you are logged in.');
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `profilePictures/${user.uid}`);
    try {
      await uploadBytes(storageRef, profilePic);
      const url = await getDownloadURL(storageRef);
      setDownloadURL(url);

      // Update Firestore with the new profile picture URL
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        profilePicture: url,
      });

      setMessage('Profile picture updated successfully!');
    } catch (error) {
      setMessage(`Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <HeaderTwo />
      <div className="profile container m-2">
        <h2 className='display-5 fw-bold text-center m-4 p-4 text-primary'>Upload Profile Picture</h2>
       
        <div className='input-group mb-3'>
          <input type="file" className='form-control' id="inputGroupFile02" onChange={handleFileChange} />
          <button className='input-group-text' onClick={handleUpload} disabled={uploading}>
            {uploading ? <div class="spinner-border" role="status">
  <span className="visually-hidden">Loading...</span>
</div> : 'Upload'}
          </button>
        </div>
        {message && <p>{message}</p>}
        {downloadURL && (
          <div>
            <p className='text-gray-500'>Current Profile Picture:</p>
            <img src={downloadURL} className='mt-2 mb-3' style={{ borderRadius: '50%' }} alt="Profile" width="100" height="100" />
            {username && <h3 className=' mb-2  bg-success-subtle inline p-2 rounded' style={{fontSize: '1.2rem' , fontFamily: 'Poppins' }}>{username}</h3>} {/* Display the username */}
          </div>
        )}
      </div>
    </>
  );
}

export default Profile;
