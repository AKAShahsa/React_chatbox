import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, onSnapshot, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HeaderTwo from './HeaderTwo';

const StreamPage = () => {
    const { roomId } = useParams();
    const [streamStarted, setStreamStarted] = useState(false);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);

    const handleCopy = () => {
        const textToCopy = roomId; // Use the dynamic roomId for copying
        navigator.clipboard.writeText(textToCopy).then(() => {
            toast.success('Room Id Copied');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    useEffect(() => {
        const initStream = async () => {
            const config = {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            };
            peerConnectionRef.current = new RTCPeerConnection(config);
    
            // Handle ICE candidates
            const candidatesRef = collection(doc(db, 'rooms', roomId), 'candidates');
            onSnapshot(candidatesRef, snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const candidate = change.doc.data();
                        if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
                            if (peerConnectionRef.current.remoteDescription) {
                                peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                            }
                        }
                    }
                });
            });
    
            // Handle incoming offer
            const roomRef = doc(db, 'rooms', roomId);
            onSnapshot(roomRef, async snapshot => {
                const data = snapshot.data();
                if (data) {
                    if (data.offer && !peerConnectionRef.current.localDescription) {
                        try {
                            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                            const answer = await peerConnectionRef.current.createAnswer();
                            await peerConnectionRef.current.setLocalDescription(answer);
                            await setDoc(roomRef, { answer: { type: answer.type, sdp: answer.sdp } }, { merge: true });
                        } catch (error) {
                            console.error('Error handling offer:', error);
                        }
                    }
    
                    if (data.answer && peerConnectionRef.current.remoteDescription) {
                        try {
                            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                        } catch (error) {
                            console.error('Error handling answer:', error);
                        }
                    }
                }
            });
    
            // Handle incoming remote stream
            peerConnectionRef.current.addEventListener('track', (event) => {
                console.log('Track event received:', event);
    
                // Check if event.streams[0] is defined
                if (event.streams && event.streams[0]) {
                    if (remoteStreamRef.current) {
                        remoteStreamRef.current.srcObject = event.streams[0];
                    }
                } else {
                    console.error('No streams available for the received track');
                }
            });
    
            // Handle ICE candidate collection
            peerConnectionRef.current.addEventListener('icecandidate', (event) => {
                if (event.candidate) {
                    const candidate = event.candidate;
                    const candidatesRef = collection(doc(db, 'rooms', roomId), 'candidates');
                    addDoc(candidatesRef, candidate.toJSON());
                }
            });
        };
    
        initStream();
    
        // Cleanup on unmount
        return () => {
            const stream = localStreamRef.current?.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
    
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        };
    }, [roomId]);
    
    const startStream = async () => {
        if (streamStarted) return;
    
        try {
            // Capture both video and audio
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true // Add this line to capture audio
            });
    
            // Ensure stream is defined
            if (stream) {
                localStreamRef.current.srcObject = stream;
    
                // Add both video and audio tracks to the peer connection
                stream.getTracks().forEach(track => {
                    peerConnectionRef.current.addTrack(track, stream);
                });
    
                const offer = await peerConnectionRef.current.createOffer();
                await peerConnectionRef.current.setLocalDescription(offer);
    
                const roomRef = doc(db, 'rooms', roomId);
                await setDoc(roomRef, { offer: { type: offer.type, sdp: offer.sdp } });
    
                setStreamStarted(true);
            } else {
                console.error('Error: Media stream is undefined');
            }
        } catch (error) {
            console.error('Error starting stream:', error);
        }
    };
    
    return (
        <>
        <HeaderTwo/>
        <div className='bg-dark' style={{ height: 'auto', width: '100vw' }}>
            <div className="alert alert-warning alert-dismissible fade show top-0 absolute" role="alert">
                <strong>Note:</strong> Streaming is only for desktop devices.
                <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
            <div className='flex center align-center py-6 bg-dark '>
                <button onClick={handleCopy} className="btn btn-success block mx-auto ">
                    <span className="badge text-bg-secondary p-3 mx-2">Copy Room Id</span>
                    {roomId} {/* Display the roomId on the button */}
                </button>
                <ToastContainer />
            </div>

            <video ref={localStreamRef} autoPlay muted></video>
            <video ref={remoteStreamRef} autoPlay></video>
            <button onClick={startStream} className='btn btn-success center text-center mx-auto block' disabled={streamStarted}>
                {streamStarted ? 'Streaming...' : 'Start Stream'}
            </button>
        </div>
        </>
    );
};

export default StreamPage;
