import { ref, set, onValue, push } from "firebase/database";
import { database } from './firebaseConfig'; // Correct import for the database

// Write SDP Offer
export const writeSDPOffer = async (userId, offer) => {
    const offerRef = ref(database, `signaling/${userId}/offer`);
    await set(offerRef, offer);
};

// Listen for SDP Offer
export const listenForSDPOffer = (userId, callback) => {
    const offerRef = ref(database, `signaling/${userId}/offer`);
    onValue(offerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        }
    });
};

// Write SDP Answer
export const writeSDPAnswer = async (userId, answer) => {
    const answerRef = ref(database, `signaling/${userId}/answer`);
    await set(answerRef, answer);
};

// Listen for SDP Answer
export const listenForSDPAnswer = (userId, callback) => {
    const answerRef = ref(database, `signaling/${userId}/answer`);
    onValue(answerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        }
    });
};

// Write ICE Candidate
export const writeICECandidate = async (userId, candidate) => {
    const candidatesRef = ref(database, `signaling/${userId}/iceCandidates`);
    await set(push(candidatesRef), candidate);
};

// Listen for ICE Candidates
export const listenForICECandidates = (userId, callback) => {
    const candidatesRef = ref(database, `signaling/${userId}/iceCandidates`);
    onValue(candidatesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.values(data).forEach(candidate => callback(candidate));
        }
    });
};
