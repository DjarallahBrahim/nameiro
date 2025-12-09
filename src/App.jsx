import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SalesTicker from './components/SalesTicker';
import TrustSection from './components/TrustSection';
import SellerProfile from './components/SellerProfile';
import DomainGrid from './components/DomainGrid';
import Contact from './components/Contact';
import Login from './pages/Login';
import Admin from './pages/Admin';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

const HomePage = () => (
  <>
    <Navbar />
    <Hero />
    <SalesTicker />
    <TrustSection />
    <DomainGrid />
    <SellerProfile />
    <Contact />
  </>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
