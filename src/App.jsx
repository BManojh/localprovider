import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth'; // Your auth component
import CustomerDashboard from './pages/CustomerDashboard'; // Your customer dashboard
import ProviderDashboard from './pages/providerRegistration'; // Your provider dashboard (if you have one)

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default route redirects to auth/login */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          
          {/* Auth routes */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Dashboard routes */}
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          
          {/* Catch all route - redirects to auth */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;