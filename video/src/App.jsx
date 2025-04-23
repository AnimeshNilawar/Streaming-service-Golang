// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import DashPlayer from './components/DashPlayer';
import UploadPage from './components/UploadPage';
import VideoPage from './components/VideoPage';
import HomePage from './components/HomePage';
import './styles/AppDark.css';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <nav className="main-navigation">
          <ul className="nav-list">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/upload" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                Upload Video
              </NavLink>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/video/:videoId" element={<VideoPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;