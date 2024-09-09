import { useState, useRef, useEffect } from 'react';
import { storage, db } from '../firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, updateDoc, doc, onSnapshot, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faPlay, faPause, faMusic } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './style.css';

function MusicPlayer() {
  const [currentSong, setCurrentSong] = useState(null); // URL of the current song
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [songs, setSongs] = useState([]); // Songs data
  const [searchTerm, setSearchTerm] = useState(""); // Search keyword
  const audioRef = useRef(null);

  // Fetch and set state from Firestore
  const fetchMusicState = async () => {
    const docRef = doc(db, 'state sharing', 'musicState');
    onSnapshot(docRef, (doc) => {
      const data = doc.data();
      if (data) {
        setCurrentSong(data.currentSong);
        setIsPlaying(data.isPlaying);
        if (audioRef.current) {
          audioRef.current.src = data.currentSong;
          if (data.isPlaying) {
            audioRef.current.play();
          } else {
            audioRef.current.pause();
          }
        }
      }
    });
  };

  useEffect(() => {
    fetchMusicState();
    fetchSongs(); // Fetch all songs on component mount
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCurrentSong(file);
    }
  };

  const handleUpload = async () => {
    if (currentSong) {
      setUploading(true);
      const fileRef = storageRef(storage, `audio/${currentSong.name}`);
      try {
        await uploadBytes(fileRef, currentSong);
        const url = await getDownloadURL(fileRef);

        // Extracting the song title (assuming it's the filename without the extension)
        const title = currentSong.name.split('.').slice(0, -1).join('.');

        // Save song metadata in Firestore
        await addDoc(collection(db, 'songs'), {
          title: title.toLowerCase(), // Store title in lowercase
          url,
          uploadedAt: serverTimestamp(),
      });
      

        // Update Firestore with the new song URL
        await updateDoc(doc(db, 'state sharing', 'musicState'), {
          currentSong: url,
          isPlaying: false,
        });

        setUploading(false);
        setCurrentSong(url); // Set the URL instead of file object
        toast.success('Song uploaded successfully!');
      } catch (error) {
        console.error("Upload failed:", error);
        setUploading(false);
        toast.error('Upload failed. Please try again.');
      }
    }
  };

  const handlePlayPause = async () => {
    if (!currentSong) {
      toast.error('Please upload a song first.');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);

    // Update Firestore with the new playback state
    await updateDoc(doc(db, 'state sharing', 'musicState'), {
      isPlaying: !isPlaying,
    });
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const fetchSongs = async () => {
    try {
      const songsRef = collection(db, 'songs'); // Adjust collection name as needed
      const q = query(songsRef);
      const snapshot = await getDocs(q);
      const songsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSongs(songsList);
    } catch (error) {
      console.error("Error fetching songs:", error);
    }
  };

  const handlePlaySong = (songUrl) => {
    setCurrentSong(songUrl);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = songUrl;
      audioRef.current.play();
    }

    // Update Firestore with the new song URL and play state
    updateDoc(doc(db, 'state sharing', 'musicState'), {
      currentSong: songUrl,
      isPlaying: true,
    });
  };


  const handleSearch = async (event) => {
    const searchKeyword = event.target.value.toLowerCase(); // Convert search term to lowercase
    setSearchTerm(searchKeyword);

    try {
        const songsRef = collection(db, 'songs');
        const q = query(
            songsRef,
            where("title", ">=", searchKeyword),
            where("title", "<=", searchKeyword + '\uf8ff') // '\uf8ff' is the last possible UTF-8 character
        );

        const snapshot = await getDocs(q);
        const songsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setSongs(songsList);
    } catch (error) {
        console.error("Error searching songs:", error);
    }
};


  return (
    <>
    <FontAwesomeIcon onClick={toggleModal} className='text-large align-center mx-auto block music mb-2' style={{ fontSize: '1.5rem' }} icon={faMusic} />

    {/* Music Player Modal */}
    <div className={`modal ${showModal ? 'show' : ''}`} tabIndex="-1" style={{ display: showModal ? 'block' : 'none' }}>
      <div className="modal-dialog  modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Music Player</h5>
            <button type="button" className="btn-close" onClick={toggleModal}></button>
          </div>
          <div className="modal-body">
            <div className="music-player p-4 bg-light rounded shadow">
              <div className="mb-3">
                <input type="file" className="form-control p-2" onChange={handleFileChange} />
                <button className="btn btn-primary mt-2 w-100" onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : <FontAwesomeIcon icon={faUpload} />} 
                </button>
              </div>
              {currentSong && (
                <div className="audio-controls mt-4 text-center">
                  <audio ref={audioRef} controls className="d-none"></audio>
                  <button className="btn btn-success" onClick={handlePlayPause}>
                    {isPlaying ? <FontAwesomeIcon icon={faPause} /> : <FontAwesomeIcon icon={faPlay} />} {isPlaying ? 'Pause' : 'Play'}
                  </button>
                </div>
              )}

              {/* Search Component */}
              <div className="mt-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search songs..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <ul className="list-group mt max-h-40 overflow-scroll">
                  {songs.length > 0 ? (
                    songs.map(song => (
                      <li
                        key={song.id}
                        className="list-group-item"
                        onClick={() => handlePlaySong(song.url)} // Set song URL to play on click
                        style={{ cursor: 'pointer' }}
                      >
                        {song.title}
                      </li>
                    ))
                  ) : (
                    <li className="list-group-item">No songs found</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {showModal && <div className="modal-backdrop fade show"></div>}

    <ToastContainer />
  </>
  );
}

export default MusicPlayer;
