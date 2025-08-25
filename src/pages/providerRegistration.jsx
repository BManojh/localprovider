import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './providerRegistration.css';

// Add styles for the receipt modal
const receiptStyles = `
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.receipt-modal {
  width: 800px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.receipt-content {
  padding: 30px;
  font-family: 'Arial', sans-serif;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.company-info h1 {
  color: #2563eb;
  margin: 0 0 10px 0;
  font-size: 32px;
}

.company-info p {
  margin: 5px 0;
  color: #666;
}

.receipt-info {
  text-align: right;
}

.receipt-info h3 {
  color: #333;
  font-size: 24px;
  margin: 0 0 15px 0;
}

.receipt-info p {
  margin: 5px 0;
  color: #666;
}

.status.completed {
  background-color: #10b981;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.receipt-divider {
  height: 2px;
  background-color: #e5e7eb;
  margin: 25px 0;
}

.receipt-details {
  margin-bottom: 30px;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section h4 {
  color: #374151;
  margin: 0 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 18px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  padding: 5px 0;
}

.detail-row span:first-child {
  color: #6b7280;
  font-weight: 500;
}

.detail-row span:last-child {
  color: #374151;
  font-weight: 600;
}

.payment-summary {
  background-color: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.payment-summary h4 {
  color: #374151;
  margin: 0 0 15px 0;
  font-size: 18px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  padding: 5px 0;
}

.summary-row.total {
  border-top: 2px solid #d1d5db;
  margin-top: 15px;
  padding-top: 15px;
  font-size: 18px;
}

.summary-row.payment-method {
  border-top: 1px solid #e5e7eb;
  margin-top: 15px;
  padding-top: 10px;
  color: #6b7280;
}

.service-description {
  background-color: #f3f4f6;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.service-description h4 {
  color: #374151;
  margin: 0 0 10px 0;
}

.service-description p {
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.receipt-footer {
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
}

.receipt-footer p {
  margin: 5px 0;
}

.receipt-actions {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.receipt-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.primary-btn {
  background-color: #2563eb;
  color: white;
}

.primary-btn:hover {
  background-color: #1d4ed8;
}

.secondary-btn {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.secondary-btn:hover {
  background-color: #e5e7eb;
}

@media print {
  .modal-overlay {
    position: static;
    background: none;
  }
  
  .modal-content {
    box-shadow: none;
    max-width: none;
    max-height: none;
  }
  
  .modal-header, .receipt-actions {
    display: none;
  }
  
  .receipt-content {
    padding: 0;
  }
  
  body {
    margin: 0;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .receipt-modal {
    width: 95vw;
    margin: 10px;
  }
  
  .receipt-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .receipt-info {
    text-align: left;
  }
  
  .receipt-actions {
    flex-direction: column;
  }
  
  .receipt-actions button {
    width: 100%;
    justify-content: center;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = receiptStyles;
  document.head.appendChild(styleSheet);
}

const ProviderRegistration = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, thisMonth: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Provider Profile States
  const [providerProfile, setProviderProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    serviceType: '',
    description: '',
    experience: '',
    hourlyRate: '',
    location: '',
    city: '',
    pincode: '',
    address: '',
    availability: {
      monday: { available: false, startTime: '09:00', endTime: '18:00' },
      tuesday: { available: false, startTime: '09:00', endTime: '18:00' },
      wednesday: { available: false, startTime: '09:00', endTime: '18:00' },
      thursday: { available: false, startTime: '09:00', endTime: '18:00' },
      friday: { available: false, startTime: '09:00', endTime: '18:00' },
      saturday: { available: false, startTime: '09:00', endTime: '18:00' },
      sunday: { available: false, startTime: '09:00', endTime: '18:00' }
    },
    skills: [],
    certifications: [],
    profileImage: null
  });

  // Registration Form States
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    serviceType: '',
    experience: '',
    hourlyRate: '',
    location: '',
    city: '',
    pincode: '',
    address: '',
    description: '',
    skills: '',
    certifications: ''
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const navigate = useNavigate();

  const serviceTypes = [
    'Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Painting', 
    'Gardening', 'AC Repair', 'Appliance Repair', 'Home Maintenance', 'Other'
  ];

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProviderData();
      fetchBookings();
      fetchEarnings();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProviderData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      if (response.data.user.role === 'provider') {
        setProviderProfile(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/auth');
      }
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bookings/provider', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Error fetching bookings');
    }
  };

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/earnings/provider', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEarnings(response.data.earnings || { total: 0, thisMonth: 0, pending: 0 });
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setError('Error fetching earnings');
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (registrationForm.password !== registrationForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsRegistering(true);
    try {
      const registrationData = {
        ...registrationForm,
        role: 'provider',
        skills: registrationForm.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        certifications: registrationForm.certifications.split(',').map(cert => cert.trim()).filter(cert => cert)
      };

      const response = await axios.post('http://localhost:5000/api/auth/register', registrationData);
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setProviderProfile(response.data.user);
      setActiveTab('dashboard');
      setError('');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate required fields
    const { name, email, phoneNumber, serviceType, experience, hourlyRate, city, pincode, location, address, description } = providerProfile;
    if (!name || !email || !phoneNumber || !serviceType || !experience || !hourlyRate || !city || !pincode || !location || !address || !description) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // Prepare data for submission
    const profileData = {
      ...providerProfile,
      skills: Array.isArray(providerProfile.skills) ? providerProfile.skills : providerProfile.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
      certifications: Array.isArray(providerProfile.certifications) ? providerProfile.certifications : providerProfile.certifications.split(',').map(cert => cert.trim()).filter(cert => cert)
    };

    try {
      const token = localStorage.getItem('token');
      console.log('Updating profile with data:', profileData); // Debug log
      const response = await axios.put('http://localhost:5000/api/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Profile update response:', response.data); // Debug log
      setUser(response.data.user);
      setProviderProfile(response.data.user);
      setIsEditing(false);
      setError('');
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingStatusUpdate = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/bookings/${bookingId}/status`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
      fetchEarnings();
      setShowBookingModal(false);
      alert(`Booking ${status} successfully!`);
    } catch (error) {
      console.error('Error updating booking:', error);
      setError('Error updating booking status');
    }
  };

  const handleAvailabilityUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/providers/availability', 
        { availability: providerProfile.availability }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAvailabilityModal(false);
      alert('Availability updated successfully!');
    } catch (error) {
      console.error('Error updating availability:', error);
      setError('Error updating availability');
    }
  };

  const handleViewReceipt = (booking) => {
    setSelectedReceipt(booking);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    // Create a simple text receipt
    const receiptText = `
RECEIPT
===============================
Receipt ID: RCP-${selectedReceipt._id.slice(-8).toUpperCase()}
Date: ${formatDate(selectedReceipt.scheduledDate)}

SERVICE DETAILS:
Service Type: ${selectedReceipt.serviceType}
Duration: ${selectedReceipt.estimatedHours} hour(s)
Hourly Rate: ₹${selectedReceipt.totalCost / selectedReceipt.estimatedHours}

CUSTOMER DETAILS:
Name: ${selectedReceipt.customerName}
Address: ${selectedReceipt.address}

PROVIDER DETAILS:
Name: ${providerProfile.name}
Service Type: ${providerProfile.serviceType}
Phone: ${providerProfile.phoneNumber}

PAYMENT SUMMARY:
Subtotal: ₹${selectedReceipt.totalCost}
Service Charge: ₹0
Total Amount: ₹${selectedReceipt.totalCost}
Status: Paid

===============================
Thank you for choosing our services!
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${selectedReceipt._id.slice(-8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/auth');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#d69e2e';
      case 'confirmed': return '#38a169';
      case 'in-progress': return '#3182ce';
      case 'completed': return '#2f855a';
      case 'cancelled': return '#e53e3e';
      default: return '#718096';
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    const matchesDateRange = !dateRange.start || !dateRange.end || 
                            (new Date(booking.scheduledDate) >= new Date(dateRange.start) && 
                             new Date(booking.scheduledDate) <= new Date(dateRange.end));
    return matchesSearch && matchesFilter && matchesDateRange;
  });

  const upcomingBookings = filteredBookings.filter(b => 
    ['pending', 'confirmed', 'in-progress'].includes(b.status)
  ).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  const pastBookings = filteredBookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status)
  ).sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Registration Form for new providers
  if (!user) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <div className="registration-header">
            <h1>Join as a Service Provider</h1>
            <p>Start earning by offering your professional services</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleRegistration} className="registration-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={registrationForm.name}
                    onChange={(e) => setRegistrationForm({...registrationForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={registrationForm.email}
                    onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={registrationForm.password}
                    onChange={(e) => setRegistrationForm({...registrationForm, password: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    value={registrationForm.confirmPassword}
                    onChange={(e) => setRegistrationForm({...registrationForm, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={registrationForm.phoneNumber}
                  onChange={(e) => setRegistrationForm({...registrationForm, phoneNumber: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Service Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Service Type *</label>
                  <select
                    value={registrationForm.serviceType}
                    onChange={(e) => setRegistrationForm({...registrationForm, serviceType: e.target.value})}
                    required
                  >
                    <option value="">Select Service Type</option>
                    {serviceTypes.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Experience (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    value={registrationForm.experience}
                    onChange={(e) => setRegistrationForm({...registrationForm, experience: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Hourly Rate (₹) *</label>
                <input
                  type="number"
                  min="100"
                  value={registrationForm.hourlyRate}
                  onChange={(e) => setRegistrationForm({...registrationForm, hourlyRate: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Service Description *</label>
                <textarea
                  value={registrationForm.description}
                  onChange={(e) => setRegistrationForm({...registrationForm, description: e.target.value})}
                  placeholder="Describe your services and expertise..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Skills (comma-separated)</label>
                <input
                  type="text"
                  value={registrationForm.skills}
                  onChange={(e) => setRegistrationForm({...registrationForm, skills: e.target.value})}
                  placeholder="e.g., Leak repair, Pipe installation, Bathroom fitting"
                />
              </div>

              <div className="form-group">
                <label>Certifications (comma-separated)</label>
                <input
                  type="text"
                  value={registrationForm.certifications}
                  onChange={(e) => setRegistrationForm({...registrationForm, certifications: e.target.value})}
                  placeholder="e.g., Licensed Plumber, Safety Certified"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Location Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={registrationForm.city}
                    onChange={(e) => setRegistrationForm({...registrationForm, city: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    value={registrationForm.pincode}
                    onChange={(e) => setRegistrationForm({...registrationForm, pincode: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Service Location *</label>
                <input
                  type="text"
                  value={registrationForm.location}
                  onChange={(e) => setRegistrationForm({...registrationForm, location: e.target.value})}
                  placeholder="Areas where you provide services"
                  required
                />
              </div>

              <div className="form-group">
                <label>Full Address *</label>
                <textarea
                  value={registrationForm.address}
                  onChange={(e) => setRegistrationForm({...registrationForm, address: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="registration-actions">
              <button type="submit" className="primary-btn" disabled={isRegistering}>
                {isRegistering ? 'Creating Account...' : 'Register as Provider'}
              </button>
              <p className="login-link">
                Already have an account? <a href="/auth">Login here</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main Provider Dashboard
  return (
    <div className="provider-dashboard">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="avatar">
              {providerProfile?.name?.charAt(0) || 'P'}
            </div>
            <div className="user-info">
              <h3>{providerProfile?.name || 'Provider'}</h3>
              <p>{providerProfile?.serviceType}</p>
              <div className="status-badge">
                ✅ Verified Provider
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span>📊</span>
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <span>📅</span>
            My Bookings
          </button>
          <button 
            className={`nav-item ${activeTab === 'earnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('earnings')}
          >
            <span>💰</span>
            Earnings
          </button>
          <button 
            className={`nav-item ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            <span>🕐</span>
            Availability
          </button>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span>👤</span>
            My Profile
          </button>
          <button 
            className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <span>⭐</span>
            Reviews
          </button>
          <button 
            className="nav-item logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            Logout
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>Need help?</p>
          <a href="mailto:provider-support@homeservices.com">
            📧 Contact Support
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content">
        <header className="content-header">
          <h1>
            {activeTab === 'dashboard' && 'Provider Dashboard'}
            {activeTab === 'bookings' && 'My Bookings'}
            {activeTab === 'earnings' && 'Earnings & Payments'}
            {activeTab === 'availability' && 'Manage Availability'}
            {activeTab === 'profile' && 'My Profile'}
            {activeTab === 'reviews' && 'Customer Reviews'}
          </h1>
          <div className="header-actions">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
            <button className="notification-btn">
              <span>🔔</span>
              <span className="badge">5</span>
            </button>
          </div>
        </header>

        <div className="content-area">
          {error && <div className="error-message">{error}</div>}

          {activeTab === 'dashboard' && (
            <div>
              {/* Stats Cards */}
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon primary">📅</div>
                  <div className="stat-info">
                    <h3>{upcomingBookings.length}</h3>
                    <p>Upcoming Bookings</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon success">✅</div>
                  <div className="stat-info">
                    <h3>{pastBookings.filter(b => b.status === 'completed').length}</h3>
                    <p>Completed Jobs</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon warning">💰</div>
                  <div className="stat-info">
                    <h3>₹{earnings.thisMonth}</h3>
                    <p>This Month's Earnings</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon info">⭐</div>
                  <div className="stat-info">
                    <h3>4.8</h3>
                    <p>Average Rating</p>
                  </div>
                </div>
              </div>

              {/* Dashboard Sections */}
              <div className="dashboard-sections">
                <div className="section-card">
                  <div className="section-header">
                    <h2>Today's Schedule</h2>
                    <button className="secondary-btn" onClick={() => setActiveTab('bookings')}>
                      View All
                    </button>
                  </div>
                  <div className="section-content">
                    {upcomingBookings.slice(0, 3).map(booking => (
                      <div key={booking._id} className="booking-item">
                        <div className="booking-info">
                          <h4>{booking.serviceType}</h4>
                          <p>Customer: {booking.customerName}</p>
                          <div className="booking-meta">
                            <span>📅 {formatDate(booking.scheduledDate)}</span>
                            <span>🕐 {formatTime(booking.scheduledTime)}</span>
                            <span>₹ {booking.totalCost}</span>
                          </div>
                        </div>
                        <div className="booking-status">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(booking.status) }}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="section-card">
                  <div className="section-header">
                    <h2>Quick Actions</h2>
                  </div>
                  <div className="section-content">
                    <div className="action-buttons">
                      <button 
                        className="action-btn"
                        onClick={() => setActiveTab('availability')}
                      >
                        <span>🕐</span>
                        Update Availability
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => setActiveTab('profile')}
                      >
                        <span>✏️</span>
                        Edit Profile
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => setActiveTab('earnings')}
                      >
                        <span>💰</span>
                        View Earnings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bookings-container">
              {/* Filters */}
              <div className="filters-row">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input 
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  placeholder="Start Date"
                />
                <input 
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  placeholder="End Date"
                />
              </div>

              {/* Upcoming Bookings */}
              <div className="bookings-section">
                <h2>Upcoming Bookings ({upcomingBookings.length})</h2>
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map(booking => (
                    <div key={booking._id} className="booking-card">
                      <div className="booking-card-header">
                        <h3>{booking.serviceType}</h3>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(booking.status) }}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <div className="booking-card-body">
                        <div className="booking-details">
                          <p><strong>Customer:</strong> {booking.customerName}</p>
                          <p><strong>Date:</strong> {formatDate(booking.scheduledDate)}</p>
                          <p><strong>Time:</strong> {formatTime(booking.scheduledTime)}</p>
                          <p><strong>Duration:</strong> {booking.estimatedHours} hour(s)</p>
                          <p><strong>Address:</strong> {booking.address}</p>
                          <p><strong>Description:</strong> {booking.description}</p>
                        </div>
                        <div className="booking-actions">
                          <p className="booking-cost">₹{booking.totalCost}</p>
                          <div className="action-buttons">
                            {booking.status === 'pending' && (
                              <>
                                <button 
                                  className="primary-btn"
                                  onClick={() => handleBookingStatusUpdate(booking._id, 'confirmed')}
                                  disabled={isSubmitting}
                                >
                                  Accept
                                </button>
                                <button 
                                  className="cancel-btn"
                                  onClick={() => handleBookingStatusUpdate(booking._id, 'cancelled')}
                                  disabled={isSubmitting}
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button 
                                className="primary-btn"
                                onClick={() => handleBookingStatusUpdate(booking._id, 'in-progress')}
                                disabled={isSubmitting}
                              >
                                Start Work
                              </button>
                            )}
                            {booking.status === 'in-progress' && (
                              <button 
                                className="success-btn"
                                onClick={() => handleBookingStatusUpdate(booking._id, 'completed')}
                                disabled={isSubmitting}
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <p>No upcoming bookings</p>
                  </div>
                )}
              </div>

              {/* Past Bookings */}
              <div className="bookings-section">
                <h2>Past Bookings ({pastBookings.length})</h2>
                {pastBookings.length > 0 ? (
                  pastBookings.slice(0, 10).map(booking => (
                    <div key={booking._id} className="booking-card">
                      <div className="booking-card-header">
                        <h3>{booking.serviceType}</h3>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(booking.status) }}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <div className="booking-card-body">
                        <div className="booking-details">
                          <p><strong>Customer:</strong> {booking.customerName}</p>
                          <p><strong>Date:</strong> {formatDate(booking.scheduledDate)}</p>
                          <p><strong>Duration:</strong> {booking.estimatedHours} hour(s)</p>
                        </div>
                        <div className="booking-actions">
                          <p className="booking-cost">₹{booking.totalCost}</p>
                          {booking.status === 'completed' && (
                            <div className="action-buttons">
                              <button 
                                className="secondary-btn"
                                onClick={() => handleViewReceipt(booking)}
                              >
                                View Receipt
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No past bookings</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="earnings-container">
              {/* Earnings Summary */}
              <div className="earnings-summary">
                <div className="earning-card">
                  <h3>Total Earnings</h3>
                  <p className="amount">₹{earnings.total || 0}</p>
                </div>
                <div className="earning-card">
                  <h3>This Month</h3>
                  <p className="amount">₹{earnings.thisMonth || 0}</p>
                </div>
                <div className="earning-card">
                  <h3>Pending Payments</h3>
                  <p className="amount">₹{earnings.pending || 0}</p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="transactions-section">
                <h2>Recent Transactions</h2>
                <div className="transaction-list">
                  {pastBookings.filter(b => b.status === 'completed').slice(0, 10).map(booking => (
                    <div key={booking._id} className="transaction-item">
                      <div className="transaction-info">
                        <h4>{booking.serviceType}</h4>
                        <p>Customer: {booking.customerName}</p>
                        <span className="transaction-date">{formatDate(booking.scheduledDate)}</span>
                      </div>
                      <div className="transaction-amount">
                        <span className="amount">₹{booking.totalCost}</span>
                        <span className="status completed">Paid</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="availability-container">
              <div className="availability-header">
                <h2>Manage Your Availability</h2>
                <p>Set your working hours for each day of the week</p>
              </div>

              <div className="availability-grid">
                {dayNames.map(day => (
                  <div key={day} className="day-availability">
                    <div className="day-header">
                      <h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={providerProfile.availability[day].available}
                          onChange={(e) => setProviderProfile({
                            ...providerProfile,
                            availability: {
                              ...providerProfile.availability,
                              [day]: {
                                ...providerProfile.availability[day],
                                available: e.target.checked
                              }
                            }
                          })}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    
                    {providerProfile.availability[day].available && (
                      <div className="time-inputs">
                        <div className="time-group">
                          <label>Start Time</label>
                          <input
                            type="time"
                            value={providerProfile.availability[day].startTime}
                            onChange={(e) => setProviderProfile({
                              ...providerProfile,
                              availability: {
                                ...providerProfile.availability,
                                [day]: {
                                  ...providerProfile.availability[day],
                                  startTime: e.target.value
                                }
                              }
                            })}
                          />
                        </div>
                        <div className="time-group">
                          <label>End Time</label>
                          <input
                            type="time"
                            value={providerProfile.availability[day].endTime}
                            onChange={(e) => setProviderProfile({
                              ...providerProfile,
                              availability: {
                                ...providerProfile.availability,
                                [day]: {
                                  ...providerProfile.availability[day],
                                  endTime: e.target.value
                                }
                              }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="availability-actions">
                <button className="primary-btn" onClick={handleAvailabilityUpdate} disabled={isSubmitting}>
                  Save Availability
                </button>
                <button className="secondary-btn" disabled={isSubmitting}>
                  Set All Days Same
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-container">
              <div className="profile-header">
                <h2>My Profile</h2>
                <button 
                  className={`edit-btn ${isEditing ? 'active' : ''}`}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSubmitting}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="profile-avatar">
                  <div className="avatar-large">
                    {providerProfile?.name?.charAt(0) || 'P'}
                  </div>
                  {isEditing && (
                    <button type="button" className="upload-btn" disabled={isSubmitting}>
                      📷 Upload Photo
                    </button>
                  )}
                </div>

                <div className="form-sections">
                  <div className="form-section">
                    <h3>Personal Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={providerProfile.name}
                          onChange={(e) => setProviderProfile({...providerProfile, name: e.target.value})}
                          disabled={!isEditing || isSubmitting}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={providerProfile.email}
                          onChange={(e) => setProviderProfile({...providerProfile, email: e.target.value})}
                          disabled={!isEditing || isSubmitting}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        value={providerProfile.phoneNumber}
                        onChange={(e) => setProviderProfile({...providerProfile, phoneNumber: e.target.value})}
                        disabled={!isEditing || isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Service Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Service Type *</label>
                        <select
                          value={providerProfile.serviceType}
                          onChange={(e) => setProviderProfile({...providerProfile, serviceType: e.target.value})}
                          disabled={!isEditing || isSubmitting}
                          required
                        >
                          <option value="">Select Service Type</option>
                          {serviceTypes.map(service => (
                            <option key={service} value={service}>{service}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Experience (Years) *</label>
                        <input
                          type="number"
                          min="0"
                          value={providerProfile.experience}
                          onChange={(e) => setProviderProfile({...providerProfile, experience: e.target.value})}
                          disabled={!isEditing || isSubmitting}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Hourly Rate (₹) *</label>
                      <input
                        type="number"
                        min="100"
                        value={providerProfile.hourlyRate}
                        onChange={(e) => setProviderProfile({...providerProfile, hourlyRate: e.target.value})}
                        disabled={!isEditing || isSubmitting}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Service Description *</label>
                      <textarea
                        value={providerProfile.description}
                        onChange={(e) => setProviderProfile({...providerProfile, description: e.target.value})}
                        disabled={!isEditing || isSubmitting}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Skills (comma-separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(providerProfile.skills) ? providerProfile.skills.join(', ') : providerProfile.skills}
                          onChange={(e) => setProviderProfile({
                            ...providerProfile, 
                            skills: e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill)
                          })}
                          disabled={!isEditing || isSubmitting}
                        />
                      </div>
                      <div className="form-group">
                        <label>Certifications (comma-separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(providerProfile.certifications) ? providerProfile.certifications.join(', ') : providerProfile.certifications}
                          onChange={(e) => setProviderProfile({
                            ...providerProfile, 
                            certifications: e.target.value.split(',').map(cert => cert.trim()).filter(cert => cert)
                          })}
                          disabled={!isEditing || isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Location Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City *</label>
                        <input
                          type="text"
                          value={providerProfile.city}
                          onChange={(e) => setProviderProfile({...providerProfile, city: e.target.value})}
                          disabled={!isEditing || isSubmitting}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Pincode *</label>
                        <input
                          type="text"
                          value={providerProfile.pincode}
                          onChange={(e) => setProviderProfile({...providerProfile, pincode: e.target.value})}
                          disabled={!isEditing || isSubmitting}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Service Location *</label>
                      <input
                        type="text"
                        value={providerProfile.location}
                        onChange={(e) => setProviderProfile({...providerProfile, location: e.target.value})}
                        disabled={!isEditing || isSubmitting}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Full Address *</label>
                      <textarea
                        value={providerProfile.address}
                        onChange={(e) => setProviderProfile({...providerProfile, address: e.target.value})}
                        disabled={!isEditing || isSubmitting}
                        required
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="profile-actions">
                    <button type="submit" className="primary-btn" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      className="secondary-btn" 
                      onClick={() => setIsEditing(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-container">
              <div className="reviews-header">
                <h2>Customer Reviews</h2>
                <div className="rating-summary">
                  <div className="overall-rating">
                    <span className="rating-number">4.8</span>
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>Based on 127 reviews</p>
                  </div>
                </div>
              </div>

              <div className="reviews-list">
                <div className="review-item">
                  <div className="review-header">
                    <div className="customer-info">
                      <div className="customer-avatar">R</div>
                      <div>
                        <h4>Raj Kumar</h4>
                        <div className="review-meta">
                          <span className="stars">⭐⭐⭐⭐⭐</span>
                          <span className="date">2 days ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="review-content">
                    <p>Excellent service! Very professional and completed the plumbing work efficiently. Highly recommended!</p>
                  </div>
                </div>

                <div className="review-item">
                  <div className="review-header">
                    <div className="customer-info">
                      <div className="customer-avatar">S</div>
                      <div>
                        <h4>Sunita Sharma</h4>
                        <div className="review-meta">
                          <span className="stars">⭐⭐⭐⭐⭐</span>
                          <span className="date">1 week ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="review-content">
                    <p>Great experience! Arrived on time and fixed the issue quickly. Very fair pricing too.</p>
                  </div>
                </div>

                <div className="review-item">
                  <div className="review-header">
                    <div className="customer-info">
                      <div className="customer-avatar">A</div>
                      <div>
                        <h4>Amit Patel</h4>
                        <div className="review-meta">
                          <span className="stars">⭐⭐⭐⭐</span>
                          <span className="date">2 weeks ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="review-content">
                    <p>Good work overall. Could have been a bit faster, but the quality was excellent.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Receipt</h2>
              <button 
                className="close-btn"
                onClick={() => setShowReceiptModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="receipt-content">
              <div className="receipt-header">
                <div className="company-info">
                  <h1>HomeServices</h1>
                  <p>Professional Home Services</p>
                  <p>📧 support@homeservices.com</p>
                  <p>📞 +91-1800-123-4567</p>
                </div>
                <div className="receipt-info">
                  <h3>RECEIPT</h3>
                  <p><strong>Receipt ID:</strong> RCP-{selectedReceipt._id.slice(-8).toUpperCase()}</p>
                  <p><strong>Date:</strong> {formatDate(selectedReceipt.scheduledDate)}</p>
                  <p><strong>Status:</strong> <span className="status completed">PAID</span></p>
                </div>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-details">
                <div className="detail-section">
                  <h4>Service Details</h4>
                  <div className="detail-row">
                    <span>Service Type:</span>
                    <span>{selectedReceipt.serviceType}</span>
                  </div>
                  <div className="detail-row">
                    <span>Duration:</span>
                    <span>{selectedReceipt.estimatedHours} hour(s)</span>
                  </div>
                  <div className="detail-row">
                    <span>Hourly Rate:</span>
                    <span>₹{(selectedReceipt.totalCost / selectedReceipt.estimatedHours).toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Scheduled Time:</span>
                    <span>{formatTime(selectedReceipt.scheduledTime)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Customer Details</h4>
                  <div className="detail-row">
                    <span>Name:</span>
                    <span>{selectedReceipt.customerName}</span>
                  </div>
                  <div className="detail-row">
                    <span>Address:</span>
                    <span>{selectedReceipt.address}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Provider Details</h4>
                  <div className="detail-row">
                    <span>Name:</span>
                    <span>{providerProfile.name}</span>
                  </div>
                  <div className="detail-row">
                    <span>Service Type:</span>
                    <span>{providerProfile.serviceType}</span>
                  </div>
                  <div className="detail-row">
                    <span>Phone:</span>
                    <span>{providerProfile.phoneNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span>Email:</span>
                    <span>{providerProfile.email}</span>
                  </div>
                </div>
              </div>

              <div className="receipt-divider"></div>

              <div className="payment-summary">
                <h4>Payment Summary</h4>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{selectedReceipt.totalCost}</span>
                </div>
                <div className="summary-row">
                  <span>Service Charge:</span>
                  <span>₹0</span>
                </div>
                <div className="summary-row">
                  <span>Tax (GST):</span>
                  <span>₹0</span>
                </div>
                <div className="summary-row total">
                  <span><strong>Total Amount:</strong></span>
                  <span><strong>₹{selectedReceipt.totalCost}</strong></span>
                </div>
                <div className="summary-row payment-method">
                  <span>Payment Method:</span>
                  <span>Online Payment</span>
                </div>
              </div>

              {selectedReceipt.description && (
                <div className="service-description">
                  <h4>Service Description</h4>
                  <p>{selectedReceipt.description}</p>
                </div>
              )}

              <div className="receipt-footer">
                <p>Thank you for choosing our services!</p>
                <p>For any queries, contact us at support@homeservices.com</p>
              </div>
            </div>

            <div className="receipt-actions">
              <button className="secondary-btn" onClick={handlePrintReceipt}>
                🖨️ Print Receipt
              </button>
              <button className="primary-btn" onClick={handleDownloadReceipt}>
                📥 Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderRegistration;