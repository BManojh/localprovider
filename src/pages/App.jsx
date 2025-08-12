import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ProviderDetails from './pages/ProviderDetails';
import AuthForm from './components/AuthForm';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home user={user} />} />
      <Route path="/providers/:id" element={<ProviderDetails user={user} />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" /> : <AuthForm />} 
      />
      <Route 
        path="/provider-dashboard" 
        element={
          user?.role === 'provider' ? 
          <div>Provider Dashboard</div> : 
          <Navigate to="/login" />
        } 
      />
    </Routes>
  );
}

export default App;