import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


window.process = {
  env: {
    NODE_ENV: 'development', // or 'production' depending on your environment
  },
};
// Lazy load components
const Login = React.lazy(() => import('./myComponents/Login'));
const Signup = React.lazy(() => import('./myComponents/Signup'));
const Dashboard = React.lazy(() => import('./myComponents/Dashboard'));
const Profile = React.lazy(() => import('./myComponents/Profile'));
const About = React.lazy(() => import('./myComponents/About'));
const ScreenShareComponent = React.lazy(() => import('./myComponents/ScreenShareComponent'));
const StreamPage = React.lazy(() => import('./myComponents/StreamPage'));
function App() {
  // Removed unnecessary useState and useEffect related to theme
  return (
    <div className={`App`}>
      <Router>
        {/* Add Suspense to handle loading state */}
        <Suspense fallback={<button class="btn btn-primary align-center center text-center m-auto" type="button" disabled>
  <span className="spinner-grow spinner-grow-sm" aria-hidden="true"></span>
  <span role="status">Loading...</span>
</button>}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/sharescreen" element={<ScreenShareComponent />} />
            <Route path="/sharescreen/:roomId" element={<StreamPage />} />
        
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}

export default App;