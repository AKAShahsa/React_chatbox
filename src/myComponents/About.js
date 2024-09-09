import React, { useState } from 'react';
import HeaderTwo from './HeaderTwo';
import TypingEffect from 'react-typing-effect';
import './about.css';

function About() {
  const [typingDone, setTypingDone] = useState(false);

  return (
    <>
      <HeaderTwo />
      <div className='about'></div>
      <div className='display-6 text-primary text-center'>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <TypingEffect
            text={["Developed By Syed Taha . React Developer"]}
            speed={100}
            eraseDelay={2000}
            typingDelay={500}
            onTypingDone={() => setTypingDone(true)} // Ensure TypingEffect calls this callback when done
            className="custom-typing-effect about-text"
          />
          <div
            className="underline-animation"
            style={{ 
              position: 'ab',
              bottom: 0,
              left: 0,
              height: '2px',
              backgroundColor: 'black',
              width: '100%',
              transform: `scaleX(${typingDone ? 1 : 0})`,
              transformOrigin: 'left',
              transition: 'transform 0.5s ease'
            }}
          />
        </div>
      </div>
    </>
  );
}

export default About;
