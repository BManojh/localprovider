import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

const AuthForm = () => {
  const [activeTab, setActiveTab] = useState('customer');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    phone: '',
    serviceType: '',
    location: '',
    hourlyRate: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare data based on user type
      const dataToSend = {
        email: formData.email,
        password: formData.password,
        ...(!isLogin && {
          name: formData.name,
          phone: formData.phone,
          role: activeTab,
          ...(activeTab === 'provider' && {
            serviceType: formData.serviceType,
            location: formData.location,
            hourlyRate: formData.hourlyRate
          })
        })
      };

      const endpoint = isLogin ? 'login' : 'register';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
        credentials: 'include'
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      // Store user data and redirect
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('token', result.token);
      navigate(result.user.role === 'provider' ? '/provider-dashboard' : '/');
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Tab Navigation */}
      <div className="tab-buttons">
        <button 
          className={activeTab === 'customer' ? 'active' : ''}
          onClick={() => setActiveTab('customer')}
        >
          Customer
        </button>
        <button
          className={activeTab === 'provider' ? 'active' : ''}
          onClick={() => setActiveTab('provider')}
        >
          Provider
        </button>
      </div>

      {/* Form Toggle */}
      <div className="form-toggle">
        <button 
          className={isLogin ? 'active' : ''}
          onClick={() => setIsLogin(true)}
        >
          Sign In
        </button>
        <button
          className={!isLogin ? 'active' : ''}
          onClick={() => setIsLogin(false)}
        >
          Sign Up
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Common Fields */}
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />

        {/* Registration Fields */}
        {!isLogin && (
          <>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
            />

            {/* Provider-specific Fields */}
            {activeTab === 'provider' && (
              <>
                <input
                  type="text"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  placeholder="Service Type"
                  required
                />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Location"
                  required
                />
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  placeholder="Hourly Rate"
                  required
                />
              </>
            )}
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;