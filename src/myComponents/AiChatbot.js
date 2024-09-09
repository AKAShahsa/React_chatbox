import React, { useState } from 'react';
import request from 'superagent';


function AiChatbot({ input, onAiResponse }) {
    const [response, setResponse] = useState(null);

    async function generateAnswer() {
        try {
            const res = await request
                .post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY')
                .send({
                    contents: [
                        { parts: [{ text: input }] },
                    ],
                });

            const aiResponseText = res.body.candidates[0].content.parts[0].text;
            setResponse(aiResponseText);

            // Send the AI response back to the Dashboard
            if (onAiResponse) {
                onAiResponse(aiResponseText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    return (
        <div className='bg-light container'>
            Ai Chatbox
            <button onClick={generateAnswer} className="btn btn-success">Ask Ai</button>
            
            {response && <div className="response-output text-white">{response}</div>}
        </div>
    );
}

export default AiChatbot;
