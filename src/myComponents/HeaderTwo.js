import TypingEffect from 'react-typing-effect';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import React, { useState, useEffect } from "react";
import logo2 from './img/logo2.png'

function HeaderTwo(props) {
  let logoStyle = {
    background: "linear-gradient(to right, red , green)",
    fontFamily: "Poppins, sans-serif",
    fontWeight: "500",
    color: "transparent",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState('light');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleToggle = () => {
    setDarkMode(!darkMode);
    setMode(darkMode ? 'light' : 'dark');
  };

  const location = useLocation();

  const getLinkClass = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <div>
      <nav className={`navbar z-index-3 navbar-${mode} shadow-sm bg-${mode} `}>
        <div className="container-fluid">
          <Link className="navbar-brand flex" to="/">
            <img src={logo2} alt= 'logo' className='flex' height={'50px'} width={'40px'} />
            <h2 className="text-white flex inline text-2xl font-extrabold logo" style={logoStyle}>
              <TypingEffect
                text={props.username}
                speed={100}
                eraseDelay={2000}
                typingDelay={500}
                className="custom-typing-effect"
              />
            </h2>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasDarkNavbar"
            aria-controls="offcanvasDarkNavbar"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className="offcanvas offcanvas-end text-bg-dark"
            tabIndex="-1"
            id="offcanvasDarkNavbar"
            aria-labelledby="offcanvasDarkNavbarLabel"
          >
            <div className="offcanvas-header">
            <img src={logo2} alt= 'logo' height={'50px'} width={'50px'} />
              <h5
                className="offcanvas-title"
                id="offcanvasDarkNavbarLabel"
                style={logoStyle}
              >
                <TypingEffect
                  text={["ChitChat" ]}
                  speed={100}
                  eraseDelay={2000}
                  typingDelay={500}
                  className="custom-typing-effect"
                />
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>
            <div className="offcanvas-body">
              <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
                <li className="nav-item">
                  <button
                    onClick={handleToggle}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <FontAwesomeIcon
                      icon={darkMode ? faSun : faMoon}
                      className="text-yellow-500 dark:text-gray-300 transition-transform duration-500 transform rotate-0 dark:rotate-180"
                    />
                  </button>
                </li>
                <li className="nav-item">
                  <Link className={getLinkClass('/profile')} style= {{color:'white'}} to="/profile"> Profile</Link>
                </li>
                <li className="nav-item text-white">
                  <Link className={getLinkClass('/profile')} style= {{color:'white'}} to="/dashboard">Chating</Link>
                </li>
                <li className="nav-item">
                  <Link className={getLinkClass('/about')} style= {{color:'white'}} to="/about">About</Link>
                </li>
                <li className="nav-item">
                  <Link className={getLinkClass('/sharescreen')} style= {{color:'white'}} to="/sharescreen">ShareScreen</Link>
                </li>
          
                <li className="nav-item">
                  <Link className={getLinkClass('/')} to="/">
                    <button className="btn btn-danger">Log Out</button>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default HeaderTwo;
