// App.jsx
import React from 'react';
import DashPlayer from './components/DashPlayer';

const App = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">My Packetized DASH Player</h2>
      <DashPlayer />
    </div>
  );
};

export default App;