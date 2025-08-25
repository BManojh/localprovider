import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Circle, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import './CustomerDashboard.css';
import L from 'leaflet';

// Fix for default marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Enhanced custom marker icons for different service types
const serviceIcons = {
  Plumbing: L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTEiIGZpbGw9IiMzMTgyY2UiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMTJsMy0zIDMgMyIvPgo8L3N2Zz4KPC9zdmc+',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  }),
  Electrical: L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTEiIGZpbGw9IiNmNTY1NjUiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMTJsMy0zIDMgMyIvPgo8L3N2Zz4KPC9zdmc+',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  }),
  Carpentry: L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTEiIGZpbGw9IiMzOGExNjkiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMTJsMy0zIDMgMyIvPgo8L3N2Zz4KPC9zdmc+',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  }),
  default: L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTEiIGZpbGw9IiM3MTgwOTYiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMTJsMy0zIDMgMyIvPgo8L3N2Zz4KPC9zdmc+',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  })
};

// User location icon
const userLocationIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTEiIGZpbGw9IiNmNTk1MDAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Map control component for centering on user location
const MapControls = ({ userLocation, onLocationUpdate }) => {
  const map = useMap();

  const centerOnUser = () => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          onLocationUpdate(newLocation);
          map.setView([newLocation.lat, newLocation.lng], 14);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please check your browser settings.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  useEffect(() => {
    // Add custom controls
    const locationControl = L.control({ position: 'topright' });
    locationControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      div.innerHTML = `
        <button title="Center on my location" class="center-btn">
          📍
        </button>
        <button title="Get current location" class="location-btn">
          🎯
        </button>
      `;
      
      const buttons = div.querySelectorAll('button');
      buttons[0].onclick = centerOnUser;
      buttons[1].onclick = getCurrentLocation;
      
      return div;
    };
    
    locationControl.addTo(map);
    
    return () => {
      map.removeControl(locationControl);
    };
  }, [map, userLocation, onLocationUpdate]);

  return null;
};

// Map click handler component
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    }
  });
  return null;
};

const CustomerDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    serviceType: '',
    description: '',
    date: '',
    time: '',
    estimatedHours: 1,
    address: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [mapFilterService, setMapFilterService] = useState('all');
  const [userLocation, setUserLocation] = useState({ lat: 11.3410, lng: 77.7172 });
  const [mapView, setMapView] = useState('list');
  const [nearbyProviders, setNearbyProviders] = useState([]);
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [selectedProvider2, setSelectedProvider2] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [mapHeight, setMapHeight] = useState('500px');
  const [mapTileLayer, setMapTileLayer] = useState('street');
  const [sortBy, setSortBy] = useState('distance');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [ratingForm, setRatingForm] = useState({ rating: 0, comment: '' });
  const [showBookingDetails, setShowBookingDetails] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    address: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const providersPerPage = 6;
  const mapRef = useRef(null);

  const navigate = useNavigate();

  const serviceTypes = [
    'Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Painting',
    'Gardening', 'AC Repair', 'Appliance Repair', 'Home Maintenance', 'Other'
  ];

  // Enhanced tile layer options
  const tileLayerOptions = {
    street: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      name: "Street View"
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      name: "Satellite"
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
      name: "Terrain"
    }
  };

  // Enhanced geolocation with high accuracy
  const getUserLocation = useCallback((highAccuracy = false) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocationLoading(true);
    
    const options = {
      enableHighAccuracy: highAccuracy,
      timeout: highAccuracy ? 10000 : 5000,
      maximumAge: highAccuracy ? 0 : 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setLocationAccuracy(position.coords.accuracy);
        setIsLocationLoading(false);
        
        if (mapRef.current) {
          mapRef.current.setView([location.lat, location.lng], 14);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocationLoading(false);
        
        const defaultLocation = { lat: 11.3410, lng: 77.7172 };
        setUserLocation(defaultLocation);
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied. Using default location.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information unavailable. Using default location.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out. Using default location.');
            break;
          default:
            setError('Unknown location error. Using default location.');
            break;
        }
      },
      options
    );
  }, []);

  // Fetch user data and dashboard data
  useEffect(() => {
    fetchUserData();
    fetchProviders();
    fetchBookings();
    getUserLocation();
  }, [getUserLocation]);

  // Update profile form when user data is fetched
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
        phone: user.phone || ''
      });
      setBookingForm(prev => ({
        ...prev,
        address: user.address || ''
      }));
    }
  }, [user]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Enhanced nearby providers finder
  const findNearbyProviders = useCallback((userLoc, radius = selectedRadius, serviceFilter = mapFilterService) => {
    if (!userLoc || !providers.length) return;

    const nearby = providers
      .map(provider => {
        const providerCoordinates = provider.coordinates;
        const distance = calculateDistance(
          userLoc.lat, userLoc.lng,
          providerCoordinates.lat, providerCoordinates.lng
        );

        return {
          ...provider,
          distance: distance
        };
      })
      .filter(provider => {
        const matchesDistance = provider.distance <= radius;
        const matchesService = serviceFilter === 'all' || provider.serviceType === serviceFilter;
        const matchesSearch = !searchTerm || 
          provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAvailability = !availabilityFilter || 
          (provider.availability && provider.availability.includes(availabilityFilter));
        return matchesDistance && matchesService && matchesSearch && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price') return a.hourlyRate - b.hourlyRate;
        return a.distance - b.distance;
      });

    setNearbyProviders(nearby);
  }, [providers, selectedRadius, mapFilterService, searchTerm, availabilityFilter, sortBy, calculateDistance]);

  useEffect(() => {
    if (userLocation && providers.length) {
      findNearbyProviders(userLocation);
    }
  }, [userLocation, providers, findNearbyProviders]);

  // Handle map click for setting custom location
  const handleMapClick = useCallback((latlng) => {
    if (window.confirm('Set this location as your current position?')) {
      setUserLocation(latlng);
      setLocationAccuracy(null);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/auth');
      } else {
        setError(error.response?.data?.message || 'Error fetching user data');
      }
    } finally {
      setLoading(false);
    }
  };

 // Replace the fetchProviders function with this corrected version

const fetchProviders = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/providers', {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Define accurate coordinates for different cities
    const cityCoordinates = {
      'Tiruppur': { lat: 11.1085, lng: 77.3411 },
      'Coimbatore': { lat: 11.0168, lng: 76.9558 },
      'Erode': { lat: 11.3410, lng: 77.7172 },
      'Salem': { lat: 11.6643, lng: 78.1460 },
      'Karur': { lat: 10.9601, lng: 78.0766 },
      'Namakkal': { lat: 11.2189, lng: 78.1677 },
      'Dindigul': { lat: 10.3673, lng: 77.9803 },
      'Madurai': { lat: 9.9252, lng: 78.1198 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Kanchipuram': { lat: 12.8185, lng: 79.7009 },
      'Vellore': { lat: 12.9165, lng: 79.1325 },
      'Hosur': { lat: 12.7409, lng: 77.8253 },
      'Krishnagiri': { lat: 12.5186, lng: 78.2137 },
      'Dharmapuri': { lat: 12.1271, lng: 78.1590 }
    };

    // Array of cities to randomly assign to providers
    const cities = Object.keys(cityCoordinates);

    const providersWithCoords = response.data.providers.map((provider, index) => {
      // Assign cities in a more distributed way
      let cityName;
      
      // You can modify this logic based on your actual provider data
      // For now, I'm using a simple rotation through cities
      if (provider.location) {
        // If provider already has a location field, use it
        cityName = provider.location;
      } else {
        // Otherwise, assign cities in rotation
        cityName = cities[index % cities.length];
      }

      // Get base coordinates for the city
      const baseCoords = cityCoordinates[cityName] || cityCoordinates['Erode']; // Default to Erode

      // Add small random offset to avoid exact overlap (within ~2km radius)
      const latOffset = (Math.random() - 0.5) * 0.02; // ~1km variation
      const lngOffset = (Math.random() - 0.5) * 0.02; // ~1km variation

      return {
        ...provider,
        location: cityName, // Add location name
        coordinates: {
          lat: baseCoords.lat + latOffset,
          lng: baseCoords.lng + lngOffset
        },
        availability: ['2025-08-07', '2025-08-08', '2025-08-09']
      };
    });

    setProviders(providersWithCoords);
  } catch (error) {
    console.error('Error fetching providers:', error);
    setError(error.response?.data?.message || 'Error fetching providers');
  }
};

// Alternative approach if you want to assign specific cities to specific providers
const fetchProvidersWithSpecificCities = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/providers', {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Define accurate coordinates for cities
    const cityCoordinates = {
      'Tiruppur': { lat: 11.1085, lng: 77.3411 },
      'Coimbatore': { lat: 11.0168, lng: 76.9558 },
      'Erode': { lat: 11.3410, lng: 77.7172 },
      'Salem': { lat: 11.6643, lng: 78.1460 },
      'Karur': { lat: 10.9601, lng: 78.0766 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Madurai': { lat: 9.9252, lng: 78.1198 },
      'Namakkal': { lat: 11.2189, lng: 78.1677 },
      
      // Small regions/towns near Erode
      'Perundurai': { lat: 11.2760, lng: 77.5831 }, // 25km from Erode
      'Bhavani': { lat: 11.4485, lng: 77.6794 }, // 15km from Erode
      'Gobichettipalayam': { lat: 11.4583, lng: 77.4333 }, // 30km from Erode
      'Sathyamangalam': { lat: 11.5050, lng: 77.2378 }, // 45km from Erode
      'Anthiyur': { lat: 11.5769, lng: 77.5964 }, // 35km from Erode
      'Modakurichi': { lat: 11.4242, lng: 77.6242 }, // 20km from Erode
      
      // Small regions/towns near Tiruppur
      'Avinashi': { lat: 11.1925, lng: 77.2686 }, // 15km from Tiruppur
      'Palladam': { lat: 11.1554, lng: 77.2864 }, // 10km from Tiruppur
      'Dharapuram': { lat: 10.7383, lng: 77.5281 }, // 45km from Tiruppur
      'Kangeyam': { lat: 11.0080, lng: 77.5619 }, // 25km from Tiruppur
      'Uthukuli': { lat: 11.0889, lng: 77.3608 }, // 8km from Tiruppur
      'Vedasandur': { lat: 10.5311, lng: 77.9486 }, // 60km from Tiruppur
      
      // Small regions/towns near Salem
      'Mettur': { lat: 11.7883, lng: 77.8017 }, // 25km from Salem
      'Sankari': { lat: 11.4650, lng: 78.2036 }, // 25km from Salem
      'Omalur': { lat: 11.7350, lng: 78.0597 }, // 15km from Salem
      'Attur': { lat: 11.5928, lng: 78.6033 }, // 45km from Salem
      'Vazhapadi': { lat: 11.6450, lng: 78.3464 }, // 20km from Salem
      'Yercaud': { lat: 11.7747, lng: 78.2036 }, // 30km from Salem (Hill station)
      'Edappadi': { lat: 11.5564, lng: 77.8581 }, // 35km from Salem
      
      // Additional nearby towns
      'Sivakasi': { lat: 9.4584, lng: 77.8081 },
      'Pollachi': { lat: 10.6581, lng: 77.0089 }, // Near Coimbatore
      'Udumalaipettai': { lat: 10.5833, lng: 77.2667 }, // Near Tiruppur/Coimbatore
      'Rasipuram': { lat: 11.4633, lng: 78.1817 }, // Near Salem/Namakkal
      'Tiruchengode': { lat: 11.3833, lng: 77.8833 }, // Between Erode and Salem
      'Kumarapalayam': { lat: 11.4244, lng: 77.7681 }
    };

    // Assign specific cities based on service type or other criteria
    const providersWithCoords = response.data.providers.map((provider, index) => {
      let cityName;
      
      // Assign cities based on service type for better distribution
      switch (provider.serviceType) {
        case 'Plumbing':
          cityName = ['Tiruppur', 'Coimbatore', 'Erode'][index % 3];
          break;
        case 'Electrical':
          cityName = ['Salem', 'Karur', 'Erode'][index % 3];
          break;
        case 'Carpentry':
          cityName = ['Chennai', 'Madurai', 'Coimbatore'][index % 3];
          break;
        case 'Cleaning':
          cityName = ['Tiruppur', 'Salem', 'Karur'][index % 3];
          break;
        case 'Painting':
          cityName = ['Coimbatore', 'Chennai', 'Erode'][index % 3];
          break;
        default:
          cityName = Object.keys(cityCoordinates)[index % Object.keys(cityCoordinates).length];
      }

      const baseCoords = cityCoordinates[cityName];
      
      // Add small random offset for variation within the city
      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;

      return {
        ...provider,
        location: cityName,
        coordinates: {
          lat: baseCoords.lat + latOffset,
          lng: baseCoords.lng + lngOffset
        },
        availability: ['2025-08-07', '2025-08-08', '2025-08-09']
      };
    });

    setProviders(providersWithCoords);
  } catch (error) {
    console.error('Error fetching providers:', error);
    setError(error.response?.data?.message || 'Error fetching providers');
  }
};

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bookings/customer', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.response?.data?.message || 'Error fetching bookings');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      navigate('/auth');
    }
  };

  const handleBookService = (provider) => {
    setSelectedProvider(provider);
    setBookingForm({
      ...bookingForm,
      serviceType: provider.serviceType
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const bookingData = {
        providerId: selectedProvider._id,
        serviceType: bookingForm.serviceType,
        description: bookingForm.description,
        scheduledDate: bookingForm.date,
        scheduledTime: bookingForm.time,
        estimatedHours: bookingForm.estimatedHours,
        address: bookingForm.address,
        totalCost: selectedProvider.hourlyRate * bookingForm.estimatedHours,
        // Add customer details for notification
        customerName: user.name,
        customerPhone: user.phone,
        customerEmail: user.email
      };
  
      const response = await axios.post('http://localhost:5000/api/bookings', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (response.status === 201) {
        setShowBookingModal(false);
        setBookingForm({
          serviceType: '',
          description: '',
          date: '',
          time: '',
          estimatedHours: 1,
          address: user?.address || ''
        });
        fetchBookings();
        
        // Show success message with notification info
        alert('Service booked successfully! The provider has been notified and will contact you soon.');
      }
    } catch (error) {
      console.error('Error booking service:', error);
      setError(error.response?.data?.message || 'Error booking service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 200) {
          fetchBookings();
          alert('Booking cancelled successfully');
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        setError(error.response?.data?.message || 'Error cancelling booking');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (ratingForm.rating < 1 || ratingForm.rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/bookings/${selectedBooking._id}/rate`,
        {
          rating: ratingForm.rating,
          comment: ratingForm.comment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.status === 200) {
        setShowRatingModal(false);
        setRatingForm({ rating: 0, comment: '' });
        fetchBookings();
        alert('Rating submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError(error.response?.data?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    if (!selectedBooking) {
      setError('No booking selected for rescheduling.');
      return;
    }

    const today = new Date();
    const selectedDateTime = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`);
    
    // Validate date and time
    if (!rescheduleForm.date || !rescheduleForm.time) {
      setError('Please provide both date and time.');
      return;
    }

    if (selectedDateTime < today) {
      setError('Cannot reschedule to a past date and time.');
      return;
    }

    // Validate time format (ensure it's in HH:mm format)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(rescheduleForm.time)) {
      setError('Please enter a valid time in HH:mm format.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/bookings/${selectedBooking._id}/reschedule`,
        {
          scheduledDate: rescheduleForm.date,
          scheduledTime: rescheduleForm.time
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.status === 200) {
        setShowRescheduleModal(false);
        setRescheduleForm({ date: '', time: '' });
        setSelectedBooking(null);
        fetchBookings();
        alert('Booking rescheduled successfully!');
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reschedule booking. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/auth/profile',
        profileForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.status === 200) {
        setUser(response.data.user);
        setIsEditingProfile(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportBookings = () => {
    const csvContent = [
      ['Booking ID', 'Service Type', 'Provider', 'Date', 'Time', 'Status', 'Cost'],
      ...bookings.map(booking => [
        booking._id,
        booking.serviceType,
        booking.providerName,
        formatDate(booking.scheduledDate),
        formatTime(booking.scheduledTime),
        booking.status,
        booking.totalCost
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bookings_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const formatDistance = (distance) => {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const filteredProviders = providers
    .map(provider => ({
      ...provider,
      distance: userLocation ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        provider.coordinates.lat,
        provider.coordinates.lng
      ) : 0
    }))
    .filter(provider => {
      const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterService === 'all' || provider.serviceType === filterService;
      const matchesAvailability = !availabilityFilter || 
        (provider.availability && provider.availability.includes(availabilityFilter));
      return matchesSearch && matchesFilter && matchesAvailability;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price') return a.hourlyRate - b.hourlyRate;
      return a.distance - b.distance;
    });

  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * providersPerPage,
    currentPage * providersPerPage
  );

  const totalPages = Math.ceil(filteredProviders.length / providersPerPage);

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
    const matchesDateRange = (!dateRange.start || new Date(booking.scheduledDate) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(booking.scheduledDate) <= new Date(dateRange.end));
    return matchesStatus && matchesDateRange;
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
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="customer-dashboard">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="user-profile">
              <div className="avatar">
                {user?.name?.charAt(0) || 'C'}
              </div>
              <div className="user-info">
                <h3>{user?.name || 'Customer'}</h3>
                <p>{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span>📊</span>
              Dashboard
            </button>
            <button
              className={`nav-item ${activeTab === 'book-service' ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab('book-service')}
            >
              <span>🔧</span>
              Book a Service
            </button>
            <button
              className={`nav-item ${activeTab === 'nearby-providers' ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab('nearby-providers')}
            >
              <span>📍</span>
              Nearby Providers
            </button>
            <button
              className={`nav-item ${activeTab === 'my-bookings' ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab('my-bookings')}
            >
              <span>📅</span>
              My Bookings
            </button>
            <button
              className={`nav-item ${activeTab === 'providers' ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab('providers')}
            >
              <span>👔</span>
              All Providers
            </button>
            <button
              className={`nav-item ${activeTab === 'profile' ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span>⚙️</span>
              My Profile
            </button>
            <button
              className="nav-item nav-item-logout"
              onClick={handleLogout}
            >
              <span>🚪</span>
              Logout
            </button>
          </nav>

          <div className="sidebar-footer">
            <p>Need help?</p>
            <a href="mailto:support@homeservices.com">
              <span>📧</span> Contact Support
            </a>
          </div>
        </aside>

        <main className="dashboard-content">
          <header className="content-header">
            <h1>
              {activeTab === 'dashboard' && 'My Dashboard'}
              {activeTab === 'book-service' && 'Book a Service'}
              {activeTab === 'nearby-providers' && 'Nearby Providers'}
              {activeTab === 'my-bookings' && 'My Bookings'}
              {activeTab === 'providers' && 'All Service Providers'}
              {activeTab === 'profile' && 'My Profile'}
            </h1>
            <div className="header-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              <button className="notification-btn">
                <span>🔔</span>
                <span className="badge">3</span>
              </button>
              <img src="/Fixitup1.png" alt="FixItUp Logo" className="logo" />
            </div>
          </header>

          <div className="content-area">
            {error && <div className="error-message">{error}</div>}

            {activeTab === 'dashboard' && (
              <div>
                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">🔧</div>
                    <div className="stat-info">
                      <h3>{upcomingBookings.length}</h3>
                      <p>Upcoming Services</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon stat-icon-success">✅</div>
                    <div className="stat-info">
                      <h3>{pastBookings.filter(b => b.status === 'completed').length}</h3>
                      <p>Completed Services</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon stat-icon-warning">📍</div>
                    <div className="stat-info">
                      <h3>{nearbyProviders.length}</h3>
                      <p>Nearby Providers</p>
                    </div>
                  </div>
                </div>

                <div className="dashboard-sections">
                  <div className="section-card">
                    <div className="section-header">
                      <h2>Ongoing Services</h2>
                    </div>
                    <div className="section-content">
                      {upcomingBookings.length > 0 ? (
                        <div>
                          {upcomingBookings.slice(0, 3).map(booking => (
                            <div key={booking._id} className="service-item">
                              <div className="service-info">
                                <h4>{booking.serviceType}</h4>
                                <p>With {booking.providerName}</p>
                                <div className="service-meta">
                                  <span>📅 {formatDate(booking.scheduledDate)}</span>
                                  <span>🕐 {formatTime(booking.scheduledTime)}</span>
                                  <span>₹ {booking.totalCost}</span>
                                </div>
                              </div>
                              <div className="service-status">
                                <span
                                  className="status-badge"
                                  style={{ backgroundColor: getStatusColor(booking.status) }}
                                >
                                  {booking.status}
                                </span>
                                <button
                                  className="cancel-btn"
                                  style={{
                                    opacity: booking.status !== 'pending' ? 0.5 : 1,
                                    cursor: booking.status !== 'pending' ? 'not-allowed' : 'pointer'
                                  }}
                                  onClick={() => booking.status === 'pending' && cancelBooking(booking._id)}
                                  disabled={booking.status !== 'pending' || isSubmitting}
                                >
                                  {isSubmitting ? 'Cancelling...' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          ))}
                          {upcomingBookings.length > 3 && (
                            <button
                              className="secondary-btn"
                              onClick={() => setActiveTab('my-bookings')}
                            >
                              View All ({upcomingBookings.length})
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <div className="empty-state-icon">📅</div>
                          <h3>No upcoming services</h3>
                          <p>Book a service to see it here</p>
                          <button
                            className="primary-btn"
                            onClick={() => setActiveTab('book-service')}
                          >
                            Book Service
                          </button>
                        </div>
                      )}
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
                          onClick={() => setActiveTab('book-service')}
                        >
                          <span>🔧</span>
                          <div>
                            <strong>Book a Service</strong>
                            <p>Find and book local services</p>
                          </div>
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => setActiveTab('nearby-providers')}
                        >
                          <span>📍</span>
                          <div>
                            <strong>Find Nearby Providers</strong>
                            <p>View providers on map</p>
                          </div>
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => setActiveTab('my-bookings')}
                        >
                          <span>📅</span>
                          <div>
                            <strong>Manage Bookings</strong>
                            <p>View and manage your bookings</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'nearby-providers' && (
              <div>
                <div className="map-container">
                  <div className="map-header">
                    <h3>Service Providers Near You</h3>
                    <div className="map-controls">
                      <div className="map-control-group">
                        <label>Service:</label>
                        <select
                          value={mapFilterService}
                          onChange={(e) => setMapFilterService(e.target.value)}
                          className="map-filter-select"
                        >
                          <option value="all">All Services</option>
                          {serviceTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="map-control-group">
                        <label>Radius:</label>
                        <div className="radius-selector">
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={selectedRadius}
                            onChange={(e) => setSelectedRadius(parseInt(e.target.value))}
                            className="radius-input"
                          />
                          <span className="radius-value">{selectedRadius}km</span>
                        </div>
                      </div>
                      <div className="view-toggle">
                        <button
                          className={`view-toggle-btn ${mapView === 'map' ? 'view-toggle-btn-active' : ''}`}
                          onClick={() => setMapView('map')}
                        >
                          🗺️ Map
                        </button>
                        <button
                          className={`view-toggle-btn ${mapView === 'list' ? 'view-toggle-btn-active' : ''}`}
                          onClick={() => setMapView('list')}
                        >
                          📋 List
                        </button>
                      </div>
                      <div className="map-toolbar">
                        <button
                          className={`map-toolbar-btn ${mapTileLayer === 'street' ? 'map-toolbar-btn-active' : ''}`}
                          onClick={() => setMapTileLayer('street')}
                          title="Street View"
                        >
                          🛣️
                        </button>
                        <button
                          className={`map-toolbar-btn ${mapTileLayer === 'satellite' ? 'map-toolbar-btn-active' : ''}`}
                          onClick={() => setMapTileLayer('satellite')}
                          title="Satellite View"
                        >
                          🛰️
                        </button>
                        <button
                          className={`map-toolbar-btn ${mapTileLayer === 'terrain' ? 'map-toolbar-btn-active' : ''}`}
                          onClick={() => setMapTileLayer('terrain')}
                          title="Terrain View"
                        >
                          🏔️
                        </button>
                        <button
                          className={`map-toolbar-btn ${mapHeight === '400px' ? '' : 'map-toolbar-btn-active'}`}
                          onClick={() => setMapHeight(mapHeight === '400px' ? '600px' : '400px')}
                          title="Toggle Map Height"
                        >
                          📏
                        </button>
                      </div>
                    </div>
                  </div>

                  {mapView === 'map' ? (
                    <div className="map-canvas" style={{ height: mapHeight }}>
                      <MapContainer
                        center={[userLocation.lat, userLocation.lng]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        ref={mapRef}
                      >
                        <TileLayer
                          url={tileLayerOptions[mapTileLayer].url}
                          attribution={tileLayerOptions[mapTileLayer].attribution}
                        />
                        <ZoomControl position="bottomright" />
                        <MapControls
                          userLocation={userLocation}
                          onLocationUpdate={setUserLocation}
                        />
                        <MapClickHandler onMapClick={handleMapClick} />
                        <Marker
                          position={[userLocation.lat, userLocation.lng]}
                          icon={userLocationIcon}
                        >
                          <Popup>
                            <div className="provider-popup">
                              <div className="popup-header">
                                <strong>📍 Your Location</strong>
                              </div>
                              <p>
                                Lat: {userLocation.lat.toFixed(6)}<br/>
                                Lng: {userLocation.lng.toFixed(6)}
                              </p>
                              {locationAccuracy && (
                                <p className="accuracy-text">
                                  Accuracy: ±{Math.round(locationAccuracy)}m
                                </p>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        <Circle
                          center={[userLocation.lat, userLocation.lng]}
                          radius={selectedRadius * 1000}
                          pathOptions={{
                            color: '#3182ce',
                            fillColor: '#3182ce',
                            fillOpacity: 0.1,
                            weight: 2,
                            dashArray: '5, 5'
                          }}
                        />
                        <MarkerClusterGroup>
                          {nearbyProviders.map(provider => (
                            <Marker
                              key={provider._id}
                              position={[provider.coordinates.lat, provider.coordinates.lng]}
                              icon={serviceIcons[provider.serviceType] || serviceIcons.default}
                              eventHandlers={{
                                click: () => setSelectedProvider2(provider),
                                mouseover: (e) => e.target.openPopup(),
                                mouseout: (e) => e.target.closePopup()
                              }}
                            >
                              <Popup>
                                <div className="provider-popup">
                                  <div className="popup-header">
                                    <strong>{provider.name}</strong>
                                  </div>
                                  <p>
                                    Service: {provider.serviceType}<br/>
                                    Distance: {formatDistance(provider.distance)}<br/>
                                    Rating: {'★'.repeat(Math.round(provider.rating))} ({provider.rating})
                                  </p>
                                  <div className="popup-actions">
                                    <button
                                      className="popup-btn primary-btn"
                                      onClick={() => handleBookService(provider)}
                                    >
                                      Book Now
                                    </button>
                                    <button
                                      className="popup-btn secondary-btn"
                                      onClick={() => setSelectedProvider2(provider)}
                                    >
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </Popup>
                            </Marker>
                          ))}
                        </MarkerClusterGroup>
                      </MapContainer>

                      {selectedProvider2 && (
                        <div className="selected-provider-card">
                          <div className="provider-card-header">
                            <div className="provider-avatar">
                              {selectedProvider2.name.charAt(0)}
                            </div>
                            <div className="provider-title">
                              <h3>{selectedProvider2.name}</h3>
                              <p className="service-type">{selectedProvider2.serviceType}</p>
                              <div className="provider-rating">
                                {'★'.repeat(Math.round(selectedProvider2.rating))} ({selectedProvider2.rating})
                              </div>
                            </div>
                          </div>
                          <div className="provider-details">
                            <p>
                              Distance: {formatDistance(selectedProvider2.distance)}<br/>
                              Rate: ₹{selectedProvider2.hourlyRate}/hr<br/>
                              Availability: {selectedProvider2.availability?.join(', ') || 'Check with provider'}
                            </p>
                          </div>
                          <div className="provider-actions">
                            <button
                              className="primary-btn"
                              onClick={() => handleBookService(selectedProvider2)}
                            >
                              Book Now
                            </button>
                            <button
                              className="secondary-btn"
                              onClick={() => setSelectedProvider2(null)}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="section-content">
                      <div className="nearby-providers">
                        {nearbyProviders.map(provider => (
                          <div
                            key={provider._id}
                            className="nearby-provider"
                            onClick={() => handleBookService(provider)}
                          >
                            <div className="provider-avatar">
                              {provider.name.charAt(0)}
                            </div>
                            <div>
                              <h4>{provider.name}</h4>
                              <p className="service-type">{provider.serviceType}</p>
                              <p>
                                Rating: {'★'.repeat(Math.round(provider.rating))} ({provider.rating})
                              </p>
                              <p className="provider-rate">
                                Rate: ₹{provider.hourlyRate}/hr
                              </p>
                            </div>
                            <span className="distance-badge">
                              {formatDistance(provider.distance)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {nearbyProviders.length === 0 && (
                        <div className="empty-state">
                          <div className="empty-state-icon">📍</div>
                          <h3>No providers found</h3>
                          <p>Try adjusting the radius or service filter</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="location-info">
                    <div className="location-status">
                      {isLocationLoading ? (
                        <>
                          <span className="loading-spinner"></span>
                          Getting location...
                        </>
                      ) : (
                        <>
                          <span>📍</span>
                          {locationAccuracy ? (
                            <>Accuracy: ±{Math.round(locationAccuracy)}m</>
                          ) : (
                            <>Custom location</>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      className="location-btn"
                      onClick={() => getUserLocation(true)}
                      disabled={isLocationLoading}
                    >
                      <span>🎯</span> Update Location
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'book-service' && (
              <div className="section-card">
                <div className="section-header">
                  <h2>Available Services</h2>
                  <div className="filter-container">
                    <select
                      value={filterService}
                      onChange={(e) => setFilterService(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Services</option>
                      {serviceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="filter-select"
                    >
                      <option value="distance">Sort by Distance</option>
                      <option value="rating">Sort by Rating</option>
                      <option value="price">Sort by Price</option>
                    </select>
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Availability</option>
                      <option value="2025-08-07">Tomorrow</option>
                      <option value="2025-08-08">Day After Tomorrow</option>
                      <option value="2025-08-09">This Weekend</option>
                    </select>
                  </div>
                </div>
                <div className="section-content">
                  <div className="providers-grid">
                    {paginatedProviders.map(provider => (
                      <div
                        key={provider._id}
                        className="provider-card"
                      >
                        <div className="provider-card-header">
                          <div className="provider-avatar">
                            {provider.name.charAt(0)}
                          </div>
                          <div className="provider-title">
                            <h3>{provider.name}</h3>
                            <p className="service-type">{provider.serviceType}</p>
                            <div className="provider-rating">
                              {'★'.repeat(Math.round(provider.rating))} ({provider.rating})
                            </div>
                          </div>
                        </div>
                        <div className="provider-details">
                          <p>
                            Distance: {formatDistance(provider.distance)}<br/>
                            Rate: ₹{provider.hourlyRate}/hr<br/>
                            Availability: {provider.availability?.join(', ') || 'Check with provider'}
                          </p>
                        </div>
                        <div className="provider-actions">
                          <button
                            className="primary-btn"
                            onClick={() => handleBookService(provider)}
                          >
                            Book Now
                          </button>
                          <button
                            className="secondary-btn"
                            onClick={() => setSelectedProvider2(provider)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {paginatedProviders.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-state-icon">👔</div>
                      <h3>No providers found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  )}
                  {totalPages > 1 && (
                    <div className="pagination">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          className={`page-button ${currentPage === page ? 'page-button-active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'my-bookings' && (
              <div className="section-card">
                <div className="section-header">
                  <h2>My Bookings</h2>
                  <div className="filter-container">
                    <select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Date</label>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                    </div>
                    <button
                      className="primary-btn"
                      onClick={exportBookings}
                    >
                      <span>📤</span> Export Bookings
                    </button>
                  </div>
                </div>
                <div className="section-content">
                  <div className="bookings-container">
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map(booking => (
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
                            <div className="booking-info">
                              <p>
                                <strong>Provider:</strong> {booking.providerName}<br/>
                                <strong>Date:</strong> {formatDate(booking.scheduledDate)}<br/>
                                <strong>Time:</strong> {formatTime(booking.scheduledTime)}<br/>
                                <strong>Address:</strong> {booking.address}<br/>
                                <strong>Description:</strong> {booking.description || 'No description provided'}
                              </p>
                              {booking.rating && (
                                <p>
                                  <strong>Your Rating:</strong> {'★'.repeat(booking.rating)} ({booking.rating})
                                  {booking.comment && <><br/><strong>Comment:</strong> {booking.comment}</>}
                                </p>
                              )}
                            </div>
                            <div className="booking-payment">
                              <span>₹{booking.totalCost}</span>
                              <div className="provider-actions">
                                {booking.status === 'pending' && (
                                  <button
                                    className="cancel-btn"
                                    onClick={() => cancelBooking(booking._id)}
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? 'Cancelling...' : 'Cancel Booking'}
                                  </button>
                                )}
                                {['pending', 'confirmed'].includes(booking.status) && (
                                  <button
                                    className="secondary-btn"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setRescheduleForm({
                                        date: booking.scheduledDate,
                                        time: booking.scheduledTime
                                      });
                                      setShowRescheduleModal(true);
                                    }}
                                    disabled={isSubmitting}
                                  >
                                    Reschedule
                                  </button>
                                )}
                                {booking.status === 'completed' && !booking.rating && (
                                  <button
                                    className="primary-btn"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowRatingModal(true);
                                    }}
                                    disabled={isSubmitting}
                                  >
                                    Rate Service
                                  </button>
                                )}
                                <button
                                  className="secondary-btn"
                                  onClick={() => setShowBookingDetails(booking)}
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <h3>No bookings found</h3>
                        <p>Book a service to see it here</p>
                        <button
                          className="primary-btn"
                          onClick={() => setActiveTab('book-service')}
                        >
                          Book Service
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'providers' && (
              <div className="section-card">
                <div className="section-header">
                  <h2>All Service Providers</h2>
                  <div className="filter-container">
                    <select
                      value={filterService}
                      onChange={(e) => setFilterService(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Services</option>
                      {serviceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="filter-select"
                    >
                      <option value="distance">Sort by Distance</option>
                      <option value="rating">Sort by Rating</option>
                      <option value="price">Sort by Price</option>
                    </select>
                  </div>
                </div>
                <div className="section-content">
                  <div className="providers-grid">
                    {paginatedProviders.map(provider => (
                      <div
                        key={provider._id}
                        className="provider-card"
                      >
                        <div className="provider-card-header">
                          <div className="provider-avatar">
                            {provider.name.charAt(0)}
                          </div>
                          <div className="provider-title">
                            <h3>{provider.name}</h3>
                            <p className="service-type">{provider.serviceType}</p>
                            <div className="provider-rating">
                              {'★'.repeat(Math.round(provider.rating))} ({provider.rating})
                            </div>
                          </div>
                        </div>
                        <div className="provider-details">
                          <p>
                            Distance: {formatDistance(provider.distance)}<br/>
                            Rate: ₹{provider.hourlyRate}/hr<br/>
                            Availability: {provider.availability?.join(', ') || 'Check with provider'}
                          </p>
                        </div>
                        <div className="provider-actions">
                          <button
                            className="primary-btn"
                            onClick={() => handleBookService(provider)}
                          >
                            Book Now
                          </button>
                          <button
                            className="secondary-btn"
                            onClick={() => setSelectedProvider2(provider)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {paginatedProviders.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-state-icon">👔</div>
                      <h3>No providers found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  )}
                  {totalPages > 1 && (
                    <div className="pagination">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          className={`page-button ${currentPage === page ? 'page-button-active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="section-card">
                <div className="section-header">
                  <h2>My Profile</h2>
                </div>
                <div className="section-content">
                  {isEditingProfile ? (
                    <form onSubmit={handleProfileSubmit} className="profile-form">
                      <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          className="form-textarea"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="form-input"
                          pattern="[0-9]{10}"
                          title="Please enter a valid 10-digit phone number"
                        />
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => setIsEditingProfile(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="primary-btn"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Saving...' : 'Save Profile'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          value={user?.name || ''}
                          readOnly
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          readOnly
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea
                          value={user?.address || ''}
                          readOnly
                          className="form-textarea"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          value={user?.phone || ''}
                          readOnly
                          className="form-input"
                        />
                      </div>
                      <button
                        className="primary-btn"
                        onClick={() => setIsEditingProfile(true)}
                        disabled={isSubmitting}
                      >
                        Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {showBookingModal && (
              <div className="modal-overlay">
                <div className="booking-modal">
                  <div className="modal-header">
                    <h2>Book Service with {selectedProvider.name}</h2>
                    <button
                      className="close-btn"
                      onClick={() => setShowBookingModal(false)}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleBookingSubmit} className="booking-form">
                    <div className="form-group">
                      <label className="form-label">Service Type</label>
                      <select
                        value={bookingForm.serviceType}
                        onChange={(e) => setBookingForm({ ...bookingForm, serviceType: e.target.value })}
                        className="form-input"
                        required
                      >
                        <option value="">Select a service</option>
                        {serviceTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        value={bookingForm.description}
                        onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                        className="form-textarea"
                        placeholder="Describe the service you need..."
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          value={bookingForm.date}
                          onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                          className="form-input"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Time</label>
                        <input
                          type="time"
                          value={bookingForm.time}
                          onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estimated Hours</label>
                      <input
                        type="number"
                        value={bookingForm.estimatedHours}
                        onChange={(e) => setBookingForm({ ...bookingForm, estimatedHours: parseInt(e.target.value) })}
                        className="form-input"
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <textarea
                        value={bookingForm.address}
                        onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                        className="form-textarea"
                        required
                      />
                    </div>
                    <div className="cost-summary">
                      <h4>Cost Summary</h4>
                      <div className="cost-details">
                        <div className="cost-item">
                          <span>Hourly Rate</span>
                          <span>₹{selectedProvider.hourlyRate}/hr</span>
                        </div>
                        <div className="cost-item">
                          <span>Estimated Hours</span>
                          <span>{bookingForm.estimatedHours} hr{bookingForm.estimatedHours > 1 ? 's' : ''}</span>
                        </div>
                        <div className="cost-total">
                          <span>Total</span>
                          <span>₹{selectedProvider.hourlyRate * bookingForm.estimatedHours}</span>
                        </div>
                      </div>
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setShowBookingModal(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="primary-btn"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showRatingModal && (
              <div className="modal-overlay">
                <div className="booking-modal">
                  <div className="modal-header">
                    <h2>Rate Service</h2>
                    <button
                      className="close-btn"
                      onClick={() => setShowRatingModal(false)}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleRatingSubmit} className="booking-form">
                    <div className="form-group">
                      <label className="form-label">Rating</label>
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span
                            key={star}
                            className={`star ${star <= ratingForm.rating ? 'star-active' : ''}`}
                            onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Comment</label>
                      <textarea
                        value={ratingForm.comment}
                        onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                        className="form-textarea"
                        placeholder="Share your experience..."
                      />
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setShowRatingModal(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="primary-btn"
                        disabled={ratingForm.rating === 0 || isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showRescheduleModal && (
              <div className="modal-overlay">
                <div className="booking-modal">
                  <div className="modal-header">
                    <h2>Reschedule Booking</h2>
                    <button
                      className="close-btn"
                      onClick={() => {
                        setShowRescheduleModal(false);
                        setError('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleRescheduleSubmit} className="booking-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">New Date</label>
                        <input
                          type="date"
                          value={rescheduleForm.date}
                          onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                          className="form-input"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">New Time</label>
                        <input
                          type="time"
                          value={rescheduleForm.time}
                          onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          setShowRescheduleModal(false);
                          setError('');
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="primary-btn"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showBookingDetails && (
              <div className="modal-overlay">
                <div className="booking-modal">
                  <div className="modal-header">
                    <h2>Booking Details</h2>
                    <button
                      className="close-btn"
                      onClick={() => setShowBookingDetails(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="booking-form">
                    <div className="booking-details">
                      <h3>{showBookingDetails.serviceType}</h3>
                      <p>
                        <strong>Provider:</strong> {showBookingDetails.providerName}<br/>
                        <strong>Status:</strong> <span style={{ color: getStatusColor(showBookingDetails.status) }}>
                          {showBookingDetails.status}
                        </span><br/>
                        <strong>Date:</strong> {formatDate(showBookingDetails.scheduledDate)}<br/>
                        <strong>Time:</strong> {formatTime(showBookingDetails.scheduledTime)}<br/>
                        <strong>Address:</strong> {showBookingDetails.address}<br/>
                        <strong>Description:</strong> {showBookingDetails.description || 'No description provided'}<br/>
                        <strong>Total Cost:</strong> ₹{showBookingDetails.totalCost}
                      </p>
                      {showBookingDetails.rating && (
                        <p>
                          <strong>Your Rating:</strong> {'★'.repeat(showBookingDetails.rating)} ({showBookingDetails.rating})
                          {showBookingDetails.comment && <><br/><strong>Comment:</strong> {showBookingDetails.comment}</>}
                        </p>
                      )}
                    </div>
                    <div className="modal-actions">
                      <button
                        className="secondary-btn"
                        onClick={() => setShowBookingDetails(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default CustomerDashboard;