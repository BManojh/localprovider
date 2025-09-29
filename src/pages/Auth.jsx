import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [activeTab, setActiveTab] = useState('customer');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');
  const navigate = useNavigate();

  const [customerForm, setCustomerForm] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    city: '',
    pincode: ''
  });

  const [providerForm, setProviderForm] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    phoneNumber: '',
    serviceType: '',
    location: '',
    hourlyRate: '',
    experience: '',
    description: '',
    workingHours: '',
    emergencyService: false,
    serviceRadius: ''
  });

  const serviceTypes = [
    'Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Painting',
    'Gardening', 'AC Repair', 'Appliance Repair', 'Home Maintenance',
    'Pest Control', 'Interior Design', 'Security Systems', 'Solar Installation',
    'CCTV Installation', 'Water Purifier Service', 'Locksmith', 'Other'
  ];

  const localServiceStats = [
    { icon: '👥', number: '10,000+', label: 'Verified Providers' },
    { icon: '⭐', number: '4.8', label: 'Average Rating' },
    { icon: '🏘️', number: '500+', label: 'Cities Covered' },
    { icon: '⚡', number: '24/7', label: 'Emergency Services' }
  ];

  const popularServices = [
    { name: 'Plumbing', demand: '95%', avgRate: '₹300/hr' },
    { name: 'Electrical', demand: '90%', avgRate: '₹350/hr' },
    { name: 'Cleaning', demand: '85%', avgRate: '₹250/hr' },
    { name: 'AC Repair', demand: '80%', avgRate: '₹400/hr' },
    { name: 'Painting', demand: '75%', avgRate: '₹200/hr' },
    { name: 'Carpentry', demand: '70%', avgRate: '₹280/hr' }
  ];

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    const serverUrls = [
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];

    for (const baseUrl of serverUrls) {
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          setServerStatus('connected');
          localStorage.setItem('serverBaseUrl', baseUrl);
          return;
        }
      } catch (error) {
        console.warn(`Failed to connect to ${baseUrl}:`, error.message);
      }
    }

    setServerStatus('disconnected');
    setError('Cannot connect to server. Please make sure the backend server is running on port 5000.');
  };

  const getApiUrl = () => {
    const savedUrl = localStorage.getItem('serverBaseUrl');
    return savedUrl || 'http://localhost:5000';
  };

  const handleCustomerChange = (e) => {
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });
    setError('');
  };

  const handleProviderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProviderForm({ 
      ...providerForm, 
      [name]: type === 'checkbox' ? checked : value 
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = activeTab === 'customer' ? customerForm : providerForm;

      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required');
      }
      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (!formData.name || !formData.phoneNumber) {
          throw new Error('Name and phone number are required');
        }
        if (activeTab === 'provider' && (!formData.serviceType || !formData.location || !formData.hourlyRate)) {
          throw new Error('Service type, location, and hourly rate are required for providers');
        }
      }

      const dataToSend = {
        ...formData,
        role: activeTab
      };
      delete dataToSend.confirmPassword;

      const endpoint = isLogin ? '/login' : '/register';
      const baseUrl = getApiUrl();
      const API_URL = `${baseUrl}/api/auth${endpoint}`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(dataToSend),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }

      localStorage.setItem('token', result.token);
      localStorage.setItem('userData', JSON.stringify({
        ...result.user,
        email: result.user.email,
        name: result.user.name,
        phoneNumber: result.user.phoneNumber,
        address: result.user.address || '',
        city: result.user.city || '',
        pincode: result.user.pincode || '',
        ...(result.user.serviceType && { serviceType: result.user.serviceType }),
        ...(result.user.location && { location: result.user.location }),
        ...(result.user.hourlyRate && { hourlyRate: result.user.hourlyRate }),
        ...(result.user.experience && { experience: result.user.experience }),
        ...(result.user.description && { description: result.user.description }),
        ...(result.user.workingHours && { workingHours: result.user.workingHours }),
        ...(result.user.emergencyService && { emergencyService: result.user.emergencyService }),
        ...(result.user.serviceRadius && { serviceRadius: result.user.serviceRadius })
      }));

      if (result.user.role === 'provider' || activeTab === 'provider') {
        navigate('/provider-dashboard');
      } else {
        navigate('/customer-dashboard');
      }

    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error.name === 'AbortError') {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (error.message.includes('fetch')) {
        setError('Cannot connect to server. Please ensure the backend server is running and try again.');
        setServerStatus('disconnected');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="url(#gradient)" />
                <path d="M12 12L18 15L12 18L6 15L12 12Z" fill="#FFD700" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#26A69A' }} />
                    <stop offset="100%" style={{ stopColor: '#FFD700' }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="logo-text">HomeServices</h1>
          </div>
          <button className="back-button" onClick={() => navigate('/')}>
            <span>←</span>
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      <div className="auth-main">
        <div className="stats-banner">
          <div className="stats-grid">
            {localServiceStats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {serverStatus !== 'connected' && (
          <div className={`server-status ${serverStatus}`}>
            {serverStatus === 'checking' ? '🔄 Checking server connection...' : '⚠️ Server disconnected. Please start the backend server.'}
          </div>
        )}

        <div className="tab-container">
          <div className="tab-navigation">
            <div className="tab-buttons">
              <button
                onClick={() => setActiveTab('customer')}
                className={`tab-button ${activeTab === 'customer' ? 'active customer' : ''}`}
              >
                <span className="mobile-text">Customer</span>
                <span className="desktop-text">I need a service</span>
              </button>
              <button
                onClick={() => setActiveTab('provider')}
                className={`tab-button ${activeTab === 'provider' ? 'active provider' : ''}`}
              >
                <span className="mobile-text">Provider</span>
                <span className="desktop-text">I provide services</span>
              </button>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className={`info-card ${activeTab}`}>
            <div className="info-header">
              <div className={`info-icon ${activeTab}`}>
                {activeTab === 'customer' ? (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v2m0 0V5a2 2 0 012-2h6.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2H5a2 2 0 01-2-2v-2" />
                  </svg>
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className={`info-title ${activeTab}`}>
                  {activeTab === 'customer' ? 'Find Local Services' : 'Grow Your Local Business'}
                </h3>
                <p className={`info-description ${activeTab}`}>
                  {activeTab === 'customer'
                    ? 'Connect with trusted local service providers in your neighborhood. From emergency repairs to regular maintenance, find the right professional for every home service need.'
                    : 'Join thousands of local service professionals earning more with our platform. Set your rates, choose your area, and build lasting customer relationships in your community.'}
                </p>
              </div>
            </div>

            {activeTab === 'customer' ? (
              <div className="customer-benefits">
                <div className="benefits-section">
                  <h4 className="benefits-title">Why Choose Local Providers?</h4>
                  <div className="benefits-grid">
                    <div className="benefit-item">
                      <div className="benefit-icon">🚀</div>
                      <div>
                        <div className="benefit-label">Quick Response</div>
                        <div className="benefit-desc">Same-day service available</div>
                      </div>
                    </div>
                    <div className="benefit-item">
                      <div className="benefit-icon">🛡️</div>
                      <div>
                        <div className="benefit-label">Verified Professionals</div>
                        <div className="benefit-desc">Background checked & insured</div>
                      </div>
                    </div>
                    <div className="benefit-item">
                      <div className="benefit-icon">💰</div>
                      <div>
                        <div className="benefit-label">Competitive Rates</div>
                        <div className="benefit-desc">Fair pricing with no hidden fees</div>
                      </div>
                    </div>
                    <div className="benefit-item">
                      <div className="benefit-icon">⭐</div>
                      <div>
                        <div className="benefit-label">Quality Guaranteed</div>
                        <div className="benefit-desc">Satisfaction guaranteed or money back</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="popular-services-section">
                  <h4 className="services-title">Most Requested Services</h4>
                  <div className="services-list">
                    {popularServices.slice(0, 4).map((service, index) => (
                      <div key={index} className="service-item">
                        <div className="service-info">
                          <span className="service-name">{service.name}</span>
                          <span className="service-rate">{service.avgRate}</span>
                        </div>
                        <div className="demand-bar">
                          <div 
                            className="demand-fill" 
                            style={{ width: service.demand }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="testimonials-section">
                  <h4 className="testimonials-title">What Our Customers Say</h4>
                  <div className="testimonials-grid">
                    <div className="testimonial-item">
                      <p className="testimonial-text">"Fast and reliable plumbing service! Saved my weekend!" - Priya S.</p>
                    </div>
                    <div className="testimonial-item">
                      <p className="testimonial-text">"Great platform for finding local electricians. Highly recommend!" - Ravi K.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="provider-benefits">
                <div className="earnings-section">
                  <h4 className="earnings-title">Maximize Your Earnings</h4>
                  <div className="earnings-grid">
                    <div className="earning-card">
                      <div className="earning-icon">📈</div>
                      <div className="earning-amount">₹25,000+</div>
                      <div className="earning-label">Average Monthly Earnings</div>
                    </div>
                    <div className="earning-card">
                      <div className="earning-icon">⏰</div>
                      <div className="earning-amount">Flexible</div>
                      <div className="earning-label">Work Schedule</div>
                    </div>
                  </div>
                </div>

                <div className="provider-features">
                  <h4 className="features-title">Provider Benefits</h4>
                  <div className="features-list">
                    <div className="feature-item">
                      <div className="feature-dot provider"></div>
                      <span className="feature-text provider">Zero commission for first 30 days</span>
                    </div>
                    <div className="feature-item">
                      <div className="feature-dot provider"></div>
                      <span className="feature-text provider">Free marketing & customer acquisition</span>
                    </div>
                    <div className="feature-item">
                      <div className="feature-dot provider"></div>
                      <span className="feature-text provider">Professional training & certification</span>
                    </div>
                    <div className="feature-item">
                      <div className="feature-dot provider"></div>
                      <span className="feature-text provider">24/7 support & dispute resolution</span>
                    </div>
                    <div className="feature-item">
                      <div className="feature-dot provider"></div>
                      <span className="feature-text provider">Insurance coverage for all jobs</span>
                    </div>
                  </div>
                </div>

                <div className="market-demand">
                  <h4 className="demand-title">High Demand Services</h4>
                  <div className="demand-grid">
                    {popularServices.slice(0, 3).map((service, index) => (
                      <div key={index} className="demand-card">
                        <div className="demand-service">{service.name}</div>
                        <div className="demand-rate">{service.avgRate}</div>
                        <div className="demand-percentage">{service.demand} demand</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="testimonials-section">
                  <h4 className="testimonials-title">What Our Providers Say</h4>
                  <div className="testimonials-grid">
                    <div className="testimonial-item">
                      <p className="testimonial-text">"Easy to sign up and get clients. Great support!" - Anil P.</p>
                    </div>
                    <div className="testimonial-item">
                      <p className="testimonial-text">"Flexible hours and good earnings. Highly satisfied!" - Meena R.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="faq-section">
              <h4 className="faq-title">Frequently Asked Questions</h4>
              <div className="faq-grid">
                <div className="faq-item">
                  <h5 className="faq-question">How do I sign up as a provider?</h5>
                  <p className="faq-answer">Select the 'Provider' tab, click 'Sign Up', and fill in your service details.</p>
                </div>
                <div className="faq-item">
                  <h5 className="faq-question">What if I forget my password?</h5>
                  <p className="faq-answer">Use the 'Forgot Password' link on the login page to reset it.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-container">
            <div className="form-toggle">
              <button
                onClick={() => setIsLogin(true)}
                className={`toggle-button ${isLogin ? 'active' : ''}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`toggle-button ${!isLogin ? 'active' : ''}`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
                {serverStatus === 'disconnected' && (
                  <button 
                    onClick={checkServerConnection}
                    style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-content">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={activeTab === 'customer' ? customerForm.email : providerForm.email}
                  onChange={activeTab === 'customer' ? handleCustomerChange : handleProviderChange}
                  required
                  className={`form-input ${activeTab}`}
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={activeTab === 'customer' ? customerForm.password : providerForm.password}
                  onChange={activeTab === 'customer' ? handleCustomerChange : handleProviderChange}
                  required
                  minLength="6"
                  className={`form-input ${activeTab}`}
                  placeholder="Enter password"
                />
              </div>

              {!isLogin && (
                <>
                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={activeTab === 'customer' ? customerForm.confirmPassword : providerForm.confirmPassword}
                      onChange={activeTab === 'customer' ? handleCustomerChange : handleProviderChange}
                      required
                      className={`form-input ${activeTab}`}
                      placeholder="Confirm password"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={activeTab === 'customer' ? customerForm.name : providerForm.name}
                      onChange={activeTab === 'customer' ? handleCustomerChange : handleProviderChange}
                      required
                      className={`form-input ${activeTab}`}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={activeTab === 'customer' ? customerForm.phoneNumber : providerForm.phoneNumber}
                      onChange={activeTab === 'customer' ? handleCustomerChange : handleProviderChange}
                      required
                      className={`form-input ${activeTab}`}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {activeTab === 'customer' && (
                    <>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">City</label>
                          <input
                            type="text"
                            name="city"
                            value={customerForm.city}
                            onChange={handleCustomerChange}
                            className="form-input customer"
                            placeholder="Your city"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Pincode</label>
                          <input
                            type="text"
                            name="pincode"
                            value={customerForm.pincode}
                            onChange={handleCustomerChange}
                            className="form-input customer"
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea
                          name="address"
                          value={customerForm.address}
                          onChange={handleCustomerChange}
                          className="form-textarea customer"
                          placeholder="Your address"
                          rows="2"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'provider' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Service Type *</label>
                        <select
                          name="serviceType"
                          value={providerForm.serviceType}
                          onChange={handleProviderChange}
                          required
                          className="form-select provider"
                        >
                          <option value="">Select Service Type</option>
                          {serviceTypes.map(service => (
                            <option key={service} value={service}>{service}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Service Location *</label>
                          <input
                            type="text"
                            name="location"
                            value={providerForm.location}
                            onChange={handleProviderChange}
                            required
                            className="form-input provider"
                            placeholder="Service area"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Service Radius (km)</label>
                          <input
                            type="number"
                            name="serviceRadius"
                            value={providerForm.serviceRadius}
                            onChange={handleProviderChange}
                            min="1"
                            max="50"
                            className="form-input provider"
                            placeholder="10"
                          />
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Hourly Rate (₹) *</label>
                          <input
                            type="number"
                            name="hourlyRate"
                            value={providerForm.hourlyRate}
                            onChange={handleProviderChange}
                            required
                            min="1"
                            className="form-input provider"
                            placeholder="Rate per hour"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Experience (Years)</label>
                          <input
                            type="number"
                            name="experience"
                            value={providerForm.experience}
                            onChange={handleProviderChange}
                            min="0"
                            className="form-input provider"
                            placeholder="Experience"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Working Hours</label>
                        <select
                          name="workingHours"
                          value={providerForm.workingHours}
                          onChange={handleProviderChange}
                          className="form-select provider"
                        >
                          <option value="">Select Working Hours</option>
                          <option value="9am-5pm">9 AM - 5 PM</option>
                          <option value="8am-6pm">8 AM - 6 PM</option>
                          <option value="7am-7pm">7 AM - 7 PM</option>
                          <option value="24/7">24/7 Available</option>
                          <option value="flexible">Flexible Hours</option>
                        </select>
                      </div>

                      <div className="checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="emergencyService"
                            checked={providerForm.emergencyService}
                            onChange={handleProviderChange}
                            className="checkbox-input"
                          />
                          <span className="checkbox-text">Available for emergency services</span>
                        </label>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Service Description</label>
                        <textarea
                          name="description"
                          value={providerForm.description}
                          onChange={handleProviderChange}
                          className="form-textarea provider"
                          placeholder="Describe your services, specializations, and what makes you unique..."
                          rows="3"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading || serverStatus === 'disconnected'}
                className={`submit-button ${activeTab} ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Processing...
                  </>
                ) : (
                  isLogin ? 'Sign In' : `Join as ${activeTab === 'customer' ? 'Customer' : 'Service Provider'}`
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="auth-footer">
          <div className="footer-content">
            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span>SSL Encrypted</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🛡️</span>
                <span>Data Protected</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
                <span>Instant Verification</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">📞</span>
                <span>24/7 Support</span>
              </div>
            </div>
            <p className="footer-text">
              Need help? Contact us at{' '}
              <a href="mailto:support@homeservices.com" className="footer-link">
                support@homeservices.com
              </a>
              {' '}or follow us on{' '}
              <a href="https://facebook.com/homeservices" className="footer-link">Facebook</a>,{' '}
              <a href="https://twitter.com/homeservices" className="footer-link">Twitter</a>,{' '}
              <a href="https://instagram.com/homeservices" className="footer-link">Instagram</a>.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .auth-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #E0F2F1 0%, #FFFDE7 25%, #FCE4EC 50%, #FFF3E0 75%, #E0F7FA 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .auth-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(38, 166, 154, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 215, 0, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .auth-header {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border-bottom: 1px solid rgba(224, 242, 241, 0.3);
          position: sticky;
          top: 0;
          z-index: 100;
          transition: all 0.3s ease;
        }

        .header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .header-left:hover {
          transform: scale(1.02);
        }

        .logo-icon {
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(38, 166, 154, 0.3);
        }

        .logo-text {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #26A69A, #FFD700);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        .back-button {
          color: #6B7280;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }

        .back-button:hover {
          color: #111827;
          background: rgba(224, 242, 241, 0.8);
        }

        .auth-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          position: relative;
          z-index: 1;
        }

        .stats-banner {
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(224, 242, 241, 0.2);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-item {
          text-align: center;
          padding: 1rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, rgba(38, 166, 154, 0.1), rgba(255, 215, 0, 0.1));
          transition: transform 0.2s ease;
        }

        .stat-item:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #6B7280;
          font-weight: 500;
        }

        .server-status {
          background: #FFFDE7;
          color: #7D6608;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          text-align: center;
          font-weight: 500;
        }

        .server-status.checking {
          background: #E0F2F1;
          color: #00695C;
        }

        .tab-container {
          max-width: 32rem;
          margin: 0 auto 2.5rem;
        }

        .tab-navigation {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 1rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          border: 1px solid rgba(224, 242, 241, 0.2);
        }

        .tab-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .tab-button {
          padding: 1rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          background: transparent;
          position: relative;
          overflow: hidden;
        }

        .tab-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .tab-button:hover::before {
          opacity: 1;
        }

        .tab-button.active.customer {
          background: linear-gradient(135deg, #26A69A, #00695C);
          color: white;
          box-shadow: 0 8px 25px rgba(38, 166, 154, 0.4);
          transform: translateY(-1px);
        }

        .tab-button.active.provider {
          background: linear-gradient(135deg, #FFD700, #FFC107);
          color: #1F2937;
          box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
          transform: translateY(-1px);
        }

        .tab-button:not(.active) {
          color: #6B7280;
        }

        .tab-button:not(.active):hover {
          color: #111827;
          background: rgba(224, 242, 241, 0.8);
        }

        .content-grid {
          display: grid;
          gap: 2.5rem;
          align-items: start;
        }

        .info-card {
          border-radius: 1.25rem;
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 1px solid rgba(224, 242, 241, 0.2);
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
        }

        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
          pointer-events: none;
        }

        .info-card.customer {
          background: linear-gradient(135deg, rgba(224, 242, 241, 0.8), rgba(224, 247, 250, 0.8));
          border-color: rgba(38, 166, 154, 0.2);
        }

        .info-card.provider {
          background: linear-gradient(135deg, rgba(255, 253, 231, 0.8), rgba(255, 245, 224, 0.8));
          border-color: rgba(255, 215, 0, 0.2);
        }

        .info-header {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .info-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .info-icon.customer {
          background: linear-gradient(135deg, #26A69A, #00695C);
        }

        .info-icon.provider {
          background: linear-gradient(135deg, #FFD700, #FFC107);
        }

        .info-icon svg {
          width: 1.75rem;
          height: 1.75rem;
          color: white;
        }

        .info-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .info-title.customer {
          color: #00695C;
        }

        .info-title.provider {
          color: #7D6608;
        }

        .info-description {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #374151;
        }

        .customer-benefits, .provider-benefits {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .benefits-section, .popular-services-section, .earnings-section, .provider-features, .market-demand, .testimonials-section, .faq-section {
          background: rgba(255, 255, 255, 0.6);
          border-radius: 1rem;
          padding: 1.5rem;
          border: 1px solid rgba(38, 166, 154, 0.1);
        }

        .benefits-title, .services-title, .earnings-title, .features-title, .demand-title, .testimonials-title, .faq-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .benefits-title, .services-title {
          color: #00695C;
        }

        .earnings-title, .features-title, .demand-title, .testimonials-title {
          color: #7D6608;
        }

        .faq-title {
          color: #374151;
        }

        .benefits-grid, .testimonials-grid, .faq-grid {
          display: grid;
          gap: 1rem;
        }

        .benefit-item, .testimonial-item, .faq-item {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.75rem;
          border: 1px solid rgba(38, 166, 154, 0.1);
        }

        .benefit-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .benefit-label {
          font-weight: 600;
          color: #00695C;
          font-size: 0.875rem;
        }

        .benefit-desc {
          font-size: 0.75rem;
          color: #6B7280;
        }

        .services-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .service-item {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.75rem;
          border: 1px solid rgba(38, 166, 154, 0.1);
        }

        .service-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .service-name {
          font-weight: 600;
          color: #00695C;
        }

        .service-rate {
          font-size: 0.875rem;
          color: #2E7D32;
          font-weight: 500;
        }

        .demand-bar {
          height: 4px;
          background: #E0F2F1;
          border-radius: 2px;
          overflow: hidden;
        }

        .demand-fill {
          height: 100%;
          background: linear-gradient(90deg, #26A69A, #00695C);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .earnings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .earning-card {
          text-align: center;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 215, 0, 0.1);
        }

        .earning-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .earning-amount {
          font-size: 1.25rem;
          font-weight: 700;
          color: #7D6608;
          margin-bottom: 0.25rem;
        }

        .earning-label {
          font-size: 0.75rem;
          color: #6B7280;
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 215, 0, 0.1);
        }

        .feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .feature-dot.provider {
          background: #FFD700;
        }

        .feature-text {
          font-size: 0.875rem;
          color: #374151;
        }

        .demand-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }

        .demand-card {
          text-align: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 215, 0, 0.1);
        }

        .demand-service {
          font-weight: 600;
          color: #7D6608;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .demand-rate {
          font-size: 0.75rem;
          color: #2E7D32;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .demand-percentage {
          font-size: 0.75rem;
          color: #6B7280;
        }

        .testimonials-grid {
          display: grid;
          gap: 1rem;
        }

        .testimonial-text {
          font-size: 0.875rem;
          color: #374151;
          line-height: 1.5;
        }

        .faq-grid {
          display: grid;
          gap: 1rem;
        }

        .faq-question {
          font-size: 1rem;
          font-weight: 600;
          color: #00695C;
          margin-bottom: 0.5rem;
        }

        .faq-answer {
          font-size: 0.875rem;
          color: #6B7280;
        }

        .form-container {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 1.25rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          padding: 2.5rem;
          border: 1px solid rgba(224, 242, 241, 0.2);
          position: relative;
          overflow: hidden;
        }

        .form-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
          pointer-events: none;
        }

        .form-toggle {
          display: flex;
          background: #E0F2F1;
          border-radius: 0.75rem;
          padding: 0.5rem;
          margin-bottom: 2rem;
          border: 1px solid #B2DFDB;
        }

        .toggle-button {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
          background: transparent;
        }

        .toggle-button.active {
          background: white;
          color: #111827;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .toggle-button:not(.active) {
          color: #6B7280;
        }

        .toggle-button:not(.active):hover {
          color: #111827;
        }

        .form-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        /* FIXED: Form inputs now have visible text */
        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid #E0F2F1;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          color: #111827; /* CRITICAL: Makes text visible */
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: #6B7280; /* Makes placeholder text visible */
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #26A69A;
          box-shadow: 0 0 0 3px rgba(38, 166, 154, 0.1);
          background: rgba(255, 255, 255, 0.95);
          color: #111827; /* Ensure text stays visible on focus */
        }

        .form-input.provider:focus, .form-select.provider:focus, .form-textarea.provider:focus {
          border-color: #FFD700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .checkbox-group {
          margin: 0.5rem 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 0.75rem;
          border: 2px solid #E0F2F1;
          transition: all 0.2s ease;
        }

        .checkbox-label:hover {
          background: rgba(255, 255, 255, 0.8);
          border-color: #B2DFDB;
        }

        .checkbox-input {
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 0.25rem;
          border: 2px solid #B2DFDB;
          background: white;
          cursor: pointer;
        }

        .checkbox-input:checked {
          background: #FFD700;
          border-color: #FFD700;
        }

        .checkbox-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .submit-button {
          width: 100%;
          padding: 1rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          color: white;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          position: relative;
          overflow: hidden;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .submit-button:hover::before {
          left: 100%;
        }

        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .submit-button.customer {
          background: linear-gradient(135deg, #26A69A, #00695C);
        }

        .submit-button.provider {
          background: linear-gradient(135deg, #FFD700, #FFC107);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          background: #FFEBEE;
          color: #C62828;
          padding: 1rem;
          border-radius: 0.75rem;
          border: 1px solid #EF9A9A;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .auth-footer {
          margin-top: 3rem;
        }

        .footer-content {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 1rem;
          padding: 2rem;
          border: 1px solid rgba(224, 242, 241, 0.2);
          text-align: center;
        }

        .trust-indicators {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .trust-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .trust-icon {
          font-size: 1.25rem;
        }

        .footer-text {
          font-size: 0.875rem;
          color: #6B7280;
        }

        .footer-link {
          color: #26A69A;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #00695C;
        }

        @media (min-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .tab-button .mobile-text {
            display: none;
          }
          
          .tab-button .desktop-text {
            display: inline;
          }
          
          .benefits-grid, .testimonials-grid, .faq-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
          }
          
          .info-card {
            position: sticky;
            top: 2rem;
          }
        }

        @media (max-width: 639px) {
          .tab-button .desktop-text {
            display: none;
          }
          
          .tab-button .mobile-text {
            display: inline;
          }
          
          .header-content {
            padding: 1rem;
          }
          
          .auth-main {
            padding: 1.5rem 1rem;
          }
          
          .form-container, .info-card {
            padding: 1.5rem;
          }
          
          .earnings-grid {
            grid-template-columns: 1fr;
          }
          
          .stats-grid, .trust-indicators {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .benefits-grid, .testimonials-grid, .faq-grid {
            grid-template-columns: 1fr;
          }
        }

        .tab-button:focus-visible,
        .toggle-button:focus-visible,
        .submit-button:focus-visible,
        .back-button:focus-visible {
          outline: 2px solid #26A69A;
          outline-offset: 2px;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-container, .info-card {
          animation: fadeInUp 0.6s ease-out;
        }

        .stats-banner {
          animation: fadeInUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Auth;