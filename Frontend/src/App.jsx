import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './Navbar';
import SignIn from './components/Signin';
import LogIn from './components/Login';
import Home from './components/Home';
import Room from './components/Room';
import PageNotFound from './components/PageNotFound';
import Lobby from './components/Lobby';
import Features from './components/Landing_Page/Features.jsx';
import History from './components/History.jsx';
function Layout() {
  const location = useLocation();
  const isHistoryRoute = location.pathname === "/history"; // Check if the current route is /history

  return (
    <div className={`max-w-7xl mx-auto px-6 ${isHistoryRoute ? "" : "py-20"}`}>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/features" element={<Features />} />

        <Route path="/Room" element={<Room />} />
        <Route path="/Room/:url" element={<Lobby />} />
        <Route path="/history" element={<History />} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Layout /> {/* Now Layout is correctly inside BrowserRouter */}
    </BrowserRouter>
  );
}

export default App;
