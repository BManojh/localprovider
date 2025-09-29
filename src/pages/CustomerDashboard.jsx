import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Circle, useMap, useMapEvents, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import './CustomerDashboard.css';
import L from 'leaflet';
import io from 'socket.io-client';

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

// Special icon for the provider being tracked
const providerTrackingIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzI1NjNlYiIgd2lkdGg9IjM2cHgiIGhlaWdodD0iMzZweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTIxIDMuMDVjLTEuODYtMS44Ni00LjQxLTIuOTYtNy4xNy0zLjA0QzYuNzMgLS4wNyAzLjA5IDIuNzIgMy4wNSA5LjgyYy0uMDQgMi43NiAxLjA2IDUuMzEgMi45MSA3LjE3bDYuMDYgNi4wNi4wMS0uMDFMOSAxOS4xN1Y0LjA1YzAtLjU1LjQ1LTEgMS0xaDQuNWMxLjg0IDAgMy40NS45NyA0LjM0IDIuNTJMOC45NiAxMy45bDEwLjYxLTEwLjYxYy4zOC0uMzggMS4wMi0uMzggMS40MSAwbC4wMS4wMWMuMzkuMzkuMzkgMS4wMyAwIDEuNDJMMTMuNDYgMTkuMDJsMi4xMiAyLjEyYzEuNTgtMS41OCAyLjYxLTMuNzQgMi4xNC02LjE0IDAtMy4wOS0xLjQ0LTUuODctMy43OC03Ljd6bS05LjI0IDguMjJsNC4yNC00LjI0Yy0uNzctMS4xOS0yLjA3LTEuOTgtMy40OS0xLjk4aC0zLjAxdjMuMDFjMCAxLjQyLjc5IDIuNzIgMS45OCAzLjQ5eiIvPjwvc3ZnPg==',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Component to smoothly move the marker on the map
const AnimatedMarker = ({ position, icon }) => {
    const markerRef = useRef(null);
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setLatLng(position);
        }
    }, [position]);

    return <Marker position={position} icon={icon} ref={markerRef} />;
};


// Map Geocoder component for address search
const MapGeocoder = ({ onLocationSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const map = useMap();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (query.length < 3) return;

        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
                headers: { 'User-Agent': 'HomeServiceApp/1.0' }
            });
            setResults(response.data);
        } catch (error) {
            console.error("Error fetching geocoding results:", error);
            alert("Could not search for the address. Please try again.");
        }
    };

    const handleSelectResult = (result) => {
        const latlng = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        map.flyTo(latlng, 15);
        onLocationSelect(latlng);
        setQuery('');
        setResults([]);
    };

    return (
        <div className="leaflet-top leaflet-right">
            <div className="leaflet-control leaflet-bar geocoder-container">
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for an address..."
                        className="geocoder-input"
                    />
                    <button type="submit" className="geocoder-button">Search</button>
                </form>
                {results.length > 0 && (
                    <ul className="geocoder-results">
                        {results.map(result => (
                            <li key={result.place_id} onClick={() => handleSelectResult(result)}>
                                {result.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

// Map control component for centering on user location
const MapControls = ({ userLocation, onLocationUpdate }) => {
    const map = useMap();

    const centerOnUser = () => {
        if (userLocation) {
            map.flyTo([userLocation.lat, userLocation.lng], 14);
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
                    map.flyTo([newLocation.lat, newLocation.lng], 14);
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

// Map click handler component with reverse geocoding
const MapClickHandler = ({ onMapClick }) => {
    const [clickedPos, setClickedPos] = useState(null);
    const [address, setAddress] = useState('');

    useMapEvents({
        click: async (e) => {
            setClickedPos(e.latlng);
            try {
                const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`, {
                    headers: { 'User-Agent': 'HomeServiceApp/1.0' }
                });
                const fetchedAddress = response.data.display_name || 'Unknown address';
                setAddress(fetchedAddress);

                if (window.confirm(`Set this location as your current position?\n\n${fetchedAddress}`)) {
                    onMapClick(e.latlng);
                }
            } catch (error) {
                console.error('Error fetching reverse geocoding:', error);
                if (window.confirm('Could not fetch address. Set this location anyway?')) {
                    onMapClick(e.latlng);
                }
            } finally {
               // Reset after a delay to allow the popup to be seen
               setTimeout(() => {
                   setClickedPos(null);
                   setAddress('');
               }, 3000);
            }
        }
    });

    return clickedPos ? (
        <Popup position={clickedPos}>
            {address || "Fetching address..."}
        </Popup>
    ) : null;
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
    address: '',
    files: []
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
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // State for chat feature
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // States for tracking
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [bookingToTrack, setBookingToTrack] = useState(null);
  const [providerLiveLocation, setProviderLiveLocation] = useState(null);

  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const chatMessagesEndRef = useRef(null); // Ref to auto-scroll chat
  const navigate = useNavigate();

  const serviceTypes = [
    'Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Painting',
    'Gardening', 'AC Repair', 'Appliance Repair', 'Home Maintenance', 'Other'
  ];

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

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
   
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    const socket = socketRef.current;
    if (user?._id) {
        socket.emit('joinRoom', user._id);
    }
    socket.on('notification', (data) => {
      const newNotification = {
        ...data,
        id: Date.now(),
        isRead: false,
        timestamp: new Date()
      };
      setNotifications(prev => [newNotification, ...prev]);
      if (Notification.permission === 'granted') {
        new Notification(data.title, { body: data.message });
      }
    });

    socket.on('receiveMessage', (receivedMessage) => {
      if (chatBooking?._id === receivedMessage.bookingId) {
        setMessages(prev => [...prev, receivedMessage]);
      }
    });

    // SOCKET LISTENER FOR LIVE LOCATION
    socket.on('liveLocationUpdate', (data) => {
        if (bookingToTrack?._id === data.bookingId) {
            setProviderLiveLocation(data.coords);
        }
    });

    return () => {
      if (user?._id) {
        socket.emit('leaveRoom', user._id);
      }
      socket.off('notification');
      socket.off('receiveMessage');
      socket.off('liveLocationUpdate'); // Cleanup listener
      socket.disconnect();
    };
  }, [user, chatBooking, bookingToTrack]);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
        chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchProviders();
    fetchBookings();
    getUserLocation();
  }, [getUserLocation]);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
  };

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

  const findNearbyProviders = useCallback((userLoc, radius = selectedRadius, serviceFilter = mapFilterService) => {
    if (!userLoc || !providers.length) return;

    const nearby = providers
      .map(provider => ({
        ...provider,
        distance: calculateDistance(
          userLoc.lat, userLoc.lng,
          provider.coordinates.lat, provider.coordinates.lng
        )
      }))
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

  const handleMapClick = useCallback((latlng) => {
    setUserLocation(latlng);
    setLocationAccuracy(null);
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

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/providers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cityCoordinates = {
        'Tiruppur': { lat: 11.1085, lng: 77.3411 }, 'Coimbatore': { lat: 11.0168, lng: 76.9558 },
        'Erode': { lat: 11.3410, lng: 77.7172 }, 'Salem': { lat: 11.6643, lng: 78.1460 },
        'Karur': { lat: 10.9601, lng: 78.0766 }, 'Namakkal': { lat: 11.2189, lng: 78.1677 },
        'Dindigul': { lat: 10.3673, lng: 77.9803 }, 'Madurai': { lat: 9.9252, lng: 78.1198 },
        'Chennai': { lat: 13.0827, lng: 80.2707 }, 'Kanchipuram': { lat: 12.8185, lng: 79.7009 },
        'Vellore': { lat: 12.9165, lng: 79.1325 }, 'Hosur': { lat: 12.7409, lng: 77.8253 },
        'Krishnagiri': { lat: 12.5186, lng: 78.2137 }, 'Dharmapuri': { lat: 12.1271, lng: 78.1590 }
      };
      const cities = Object.keys(cityCoordinates);
      const providersWithCoords = response.data.providers.map((provider, index) => {
        const cityName = provider.location || cities[index % cities.length];
        const baseCoords = cityCoordinates[cityName] || cityCoordinates['Erode'];
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lngOffset = (Math.random() - 0.5) * 0.02;
        return {
          ...provider,
          location: cityName,
          coordinates: { lat: baseCoords.lat + latOffset, lng: baseCoords.lng + lngOffset },
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
      const bookingsWithPaymentStatus = response.data.bookings.map(b => ({
          ...b,
          paymentStatus: b.paymentStatus || 'pending'
      }));
      setBookings(bookingsWithPaymentStatus || []);
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
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/auth');
    }
  };

  const handleBookService = (provider) => {
    setSelectedProvider(provider);
    setBookingForm({
      ...bookingForm,
      serviceType: provider.serviceType,
      address: user?.address || '',
      files: []
    });
    setShowBookingModal(true);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const MAX_FILES = 5;
    const MAX_SIZE_MB = 10;
    let errorFound = false;

    if (bookingForm.files.length + selectedFiles.length > MAX_FILES) {
        alert(`You can only upload a maximum of ${MAX_FILES} files.`);
        return;
    }

    const newFiles = selectedFiles.filter(file => {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alert(`File "${file.name}" is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
            errorFound = true;
            return false;
        }
        return true;
    });

    if (!errorFound) {
        setBookingForm(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };
 
  const removeFile = (fileToRemove) => {
    setBookingForm(prev => ({
      ...prev,
      files: prev.files.filter(file => file !== fileToRemove)
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    const formData = new FormData();

    formData.append('providerId', selectedProvider._id);
    formData.append('serviceType', bookingForm.serviceType);
    formData.append('description', bookingForm.description);
    formData.append('scheduledDate', bookingForm.date);
    formData.append('scheduledTime', bookingForm.time);
    formData.append('estimatedHours', bookingForm.estimatedHours);
    formData.append('address', bookingForm.address);
    formData.append('totalCost', selectedProvider.hourlyRate * bookingForm.estimatedHours);
   
    bookingForm.files.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/bookings', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.status === 201) {
        setShowBookingModal(false);
        setBookingForm({
          serviceType: '', description: '', date: '', time: '',
          estimatedHours: 1, address: user?.address || '', files: []
        });
        fetchBookings(); 
        alert('Booking created successfully! The provider has been notified.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.response?.data?.message || 'Error creating booking. Please try again.');
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
 
  const handlePayment = async (booking) => {
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
   
    try {
      const orderResponse = await axios.post('http://localhost:5000/api/payment/create-order', 
        { 
          amount: booking.totalCost * 100, // Amount in paisa
          currency: 'INR',
          bookingId: booking._id 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order } = orderResponse.data;

      const options = {
        key: 'rzp_test_RMvbnplOP4FFVk', // Your provided Test Key ID
        amount: order.amount,
        currency: order.currency,
        name: 'FixItUp Services',
        description: `Payment for Booking #${booking._id}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verificationResponse = await axios.post('http://localhost:5000/api/payment/verify-payment', 
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: booking._id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verificationResponse.data.success) {
              alert('Payment successful!');
              fetchBookings();
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            setError(verifyError.response?.data?.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        notes: {
          address: booking.address,
          booking_id: booking._id
        },
        theme: {
          color: '#3182ce'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        setError(`Payment failed: ${response.error.description}. Please try again.`);
        console.error('Razorpay payment failed:', response.error);
      });
      rzp.open();

    } catch (error) {
      console.error('Error creating payment order:', error);
      setError(error.response?.data?.message || 'Could not initiate payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (ratingForm.rating === 0) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/bookings/${selectedBooking._id}/rate`,
        {
          rating: ratingForm.rating,
          comment: ratingForm.comment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        alert('Thank you for your feedback!');
        setShowRatingModal(false);
        setRatingForm({ rating: 0, comment: '' });
        fetchBookings();
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      setError(error.response?.data?.message || "Failed to submit rating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedBooking) {
      setError('No booking selected for rescheduling.');
      return;
    }
    const today = new Date();
    const selectedDateTime = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`);
    if (!rescheduleForm.date || !rescheduleForm.time) {
      setError('Please provide both date and time.');
      return;
    }
    if (selectedDateTime < today) {
      setError('Cannot reschedule to a past date and time.');
      return;
    }
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
        { scheduledDate: rescheduleForm.date, scheduledTime: rescheduleForm.time },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        if (socketRef.current) {
          socketRef.current.emit('bookingRescheduled', {
            providerId: selectedBooking.providerId,
            bookingId: selectedBooking._id,
            customerName: user?.name || 'A customer',
            newDate: rescheduleForm.date,
            newTime: rescheduleForm.time
          });
        }
        setShowRescheduleModal(false);
        setRescheduleForm({ date: '', time: '' });
        setSelectedBooking(null);
        fetchBookings();
        alert('Booking rescheduled successfully! The provider has been notified.');
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
        { headers: { Authorization: `Bearer ${token}` } }
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

  const handleOpenChat = async (booking) => {
    setChatBooking(booking);
    setShowChatModal(true);
    setIsChatLoading(true);
    setError('');

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/chat/${booking._id}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(response.data.messages || []);
        if (socketRef.current) {
            socketRef.current.emit('joinChatRoom', booking._id);
        }
    } catch (err) {
        console.error("Failed to fetch chat history:", err);
        setError("Could not load chat history. Please try again.");
    } finally {
        setIsChatLoading(false);
    }
  };

  const handleCloseChat = () => {
    if (socketRef.current && chatBooking) {
        socketRef.current.emit('leaveChatRoom', chatBooking._id);
    }
    setShowChatModal(false);
    setChatBooking(null);
    setMessages([]);
    setNewMessage('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatBooking) return;

    const messageData = {
        bookingId: chatBooking._id,
        senderId: user._id,
        receiverId: chatBooking.providerId,
        text: newMessage,
    };

    if (socketRef.current) {
        socketRef.current.emit('sendMessage', messageData);
    }

    const optimisticMessage = {
        ...messageData,
        _id: Date.now(),
        sender: { _id: user._id, name: user.name },
        createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
  };
  
  const handleTrackProvider = (booking) => {
    setBookingToTrack(booking);
    setProviderLiveLocation(null); // Reset location on open
    setShowTrackingModal(true);
  };

  const handleCloseTrackingModal = () => {
    setShowTrackingModal(false);
    setBookingToTrack(null);
    setProviderLiveLocation(null);
  };

  const exportBookings = () => {
    const csvContent = [
      ['Booking ID', 'Service Type', 'Provider', 'Date', 'Time', 'Status', 'Cost', 'Payment Status'],
      ...bookings.map(booking => [
        booking._id, booking.serviceType, booking.providerName,
        formatDate(booking.scheduledDate), formatTime(booking.scheduledTime),
        booking.status, booking.totalCost, booking.paymentStatus || 'pending'
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

  const formatRelativeTime = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };
  const handleClearAll = () => {
    setNotifications([]);
    setShowNotifications(false);
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return adjustedDate.toLocaleDateString('en-IN', options);
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
        userLocation.lat, userLocation.lng,
        provider.coordinates.lat, provider.coordinates.lng
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
              onClick={() => handleTabChange('dashboard')}
            >
              <span>📊</span>
              Dashboard
            </button>
            <button
              className={`nav-item ${activeTab === 'book-service' ? 'nav-item-active' : ''}`}
              onClick={() => handleTabChange('book-service')}
            >
              <span>🔧</span>
              Book a Service
            </button>
            <button
              className={`nav-item ${activeTab === 'nearby-providers' ? 'nav-item-active' : ''}`}
              onClick={() => handleTabChange('nearby-providers')}
            >
              <span>📍</span>
              Nearby Providers
            </button>
            <button
              className={`nav-item ${activeTab === 'my-bookings' ? 'nav-item-active' : ''}`}
              onClick={() => handleTabChange('my-bookings')}
            >
              <span>📅</span>
              My Bookings
            </button>
            <button
              className={`nav-item ${activeTab === 'providers' ? 'nav-item-active' : ''}`}
              onClick={() => handleTabChange('providers')}
            >
              <span>👔</span>
              All Providers
            </button>
            <button
              className={`nav-item ${activeTab === 'profile' ? 'nav-item-active' : ''}`}
              onClick={() => handleTabChange('profile')}
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

              <div className="notification-container">
                <button
                  className="notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <span>🔔</span>
                  {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notification-panel">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      <div>
                        <button onClick={handleMarkAllAsRead}>Mark all as read</button>
                        <button onClick={handleClearAll}>Clear all</button>
                      </div>
                    </div>
                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                            onClick={() => handleMarkAsRead(n.id)}
                          >
                            <div className="notification-content">
                              <strong>{n.title}</strong>
                              <p>{n.message}</p>
                            </div>
                            <div className="notification-meta">
                              <span className="timestamp">{formatRelativeTime(n.timestamp)}</span>
                              {!n.isRead && <span className="unread-dot"></span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty">
                          <p>You have no new notifications.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                         <MapGeocoder onLocationSelect={handleMapClick} />
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
           
            {(activeTab === 'book-service' || activeTab === 'providers') && (
              <div className="section-card">
                <div className="section-header">
                  <h2>{activeTab === 'book-service' ? 'Available Services' : 'All Service Providers'}</h2>
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
                    {activeTab === 'book-service' && (
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
                    )}
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
                                <div>
                                    {booking.paymentStatus === 'paid' && (
                                        <span className="status-badge" style={{ backgroundColor: '#38a169', color: 'white' }}>
                                            Paid
                                        </span>
                                    )}
                                    <span
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(booking.status), marginLeft: '8px' }}
                                    >
                                        {booking.status}
                                    </span>
                                </div>
                          </div>
                          <div className="booking-card-body">
                            <div className="booking-info">
                              <div className="booking-detail-item">
                                <strong>Provider:</strong>
                                <span>{booking.providerName}</span>
                              </div>
                              <div className="booking-detail-item">
                                <strong>Date:</strong>
                                <span>{formatDate(booking.scheduledDate)}</span>
                              </div>
                              <div className="booking-detail-item">
                                <strong>Time:</strong>
                                <span>{formatTime(booking.scheduledTime)}</span>
                              </div>
                              <div className="booking-detail-item">
                                <strong>Address:</strong>
                                <span>{booking.address}</span>
                              </div>
                              <div className="booking-detail-item">
                                <strong>Description:</strong>
                                <span>{booking.description || 'No description provided'}</span>
                              </div>

                              {booking.rating && (
                              <div className="booking-detail-item rating-display">
                                <strong>Your Rating:</strong>
                                <div>
                                  <span>{'★'.repeat(booking.rating)} ({booking.rating})</span>
                                  {booking.comment && <p className="rating-comment"><strong>Comment:</strong> {booking.comment}</p>}
                                </div>
                              </div>
                              )}
                            </div>
                            <div className="booking-payment">
                              <span>₹{booking.totalCost}</span>
                                <div className="provider-actions">
                                  {booking.status === 'in-progress' && (
                                    <button
                                      className="primary-btn"
                                      onClick={() => handleTrackProvider(booking)}
                                    >
                                      <span>📍</span> Track Provider
                                    </button>
                                  )}
                                  {['confirmed', 'in-progress'].includes(booking.status) && (
                                      <button
                                          className="primary-btn"
                                          onClick={() => handleOpenChat(booking)}
                                      >
                                          <span>💬</span> Chat
                                      </button>
                                  )}
                                  {booking.status === 'completed' && booking.paymentStatus !== 'paid' && (
                                      <button
                                          className="primary-btn"
                                          onClick={() => handlePayment(booking)}
                                          disabled={isSubmitting}
                                      >
                                          {isSubmitting ? 'Processing...' : 'Pay Now'}
                                      </button>
                                  )}
                                  
                                  {['pending', 'confirmed'].includes(booking.status) && (
                                    <button
                                      className="cancel-btn"
                                      onClick={() => cancelBooking(booking._id)}
                                      disabled={isSubmitting}
                                    >
                                      {isSubmitting ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                  )}

                                  {['pending', 'confirmed'].includes(booking.status) && (
                                    <button
                                      className="secondary-btn"
                                      onClick={() => {
                                        setSelectedBooking(booking);
                                        setRescheduleForm({
                                          date: new Date(booking.scheduledDate).toISOString().split('T')[0],
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
                        onChange={(e) => setBookingForm({ ...bookingForm, estimatedHours: parseInt(e.target.value) || 1 })}
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
                   
                    <div className="form-group">
                        <label className="form-label">
                            Add Photos/Videos (Optional)
                            <small>Max 5 files, 10MB each</small>
                        </label>
                        <div className="file-upload-container">
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="file-input"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="file-input-label">
                                <span>📤</span> Choose Files
                            </label>
                        </div>
                        {bookingForm.files.length > 0 && (
                            <div className="file-preview-container">
                                {bookingForm.files.map((file, index) => (
                                    <div key={index} className="file-preview-item">
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="file-preview-image"
                                            />
                                        ) : (
                                            <div className="file-preview-video">
                                                <span>📹</span>
                                                <p>{file.name}</p>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className="remove-file-btn"
                                            onClick={() => removeFile(file)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
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
                      <div className="booking-detail-item">
                        <strong>Provider:</strong> <span>{showBookingDetails.providerName}</span>
                      </div>
                      <div className="booking-detail-item">
                        <strong>Status:</strong> <span style={{ color: getStatusColor(showBookingDetails.status), textTransform: 'capitalize' }}>{showBookingDetails.status}</span>
                      </div>
                          {showBookingDetails.status === 'completed' && (
                                <div className="booking-detail-item">
                                    <strong>Payment:</strong> <span style={{ color: showBookingDetails.paymentStatus === 'paid' ? '#38a169' : '#d69e2e', textTransform: 'capitalize' }}>{showBookingDetails.paymentStatus}</span>
                                </div>
                          )}
                      <div className="booking-detail-item">
                        <strong>Date:</strong> <span>{formatDate(showBookingDetails.scheduledDate)}</span>
                      </div>
                      <div className="booking-detail-item">
                        <strong>Time:</strong> <span>{formatTime(showBookingDetails.scheduledTime)}</span>
                      </div>
                      <div className="booking-detail-item">
                        <strong>Address:</strong> <span>{showBookingDetails.address}</span>
                      </div>
                      <div className="booking-detail-item">
                        <strong>Description:</strong> <span>{showBookingDetails.description || 'No description provided'}</span>
                      </div>
                      <div className="booking-detail-item">
                        <strong>Total Cost:</strong> <span>₹{showBookingDetails.totalCost}</span>
                      </div>

                      {showBookingDetails.rating && (
                        <div className="booking-detail-item rating-display">
                          <strong>Your Rating:</strong> 
                          <div>
                            <span>{'★'.repeat(showBookingDetails.rating)} ({showBookingDetails.rating})</span>
                            {showBookingDetails.comment && <p className="rating-comment"><strong>Comment:</strong> {showBookingDetails.comment}</p>}
                          </div>
                        </div>
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
           
            {showChatModal && chatBooking && (
                <div className="modal-overlay">
                    <div className="chat-modal">
                        <div className="modal-header">
                            <h2>Chat with {chatBooking.providerName}</h2>
                            <button className="close-btn" onClick={handleCloseChat}>×</button>
                        </div>
                        <div className="chat-messages">
                            {isChatLoading ? (
                                <div className="loading-spinner"></div>
                            ) : messages.length > 0 ? (
                                messages.map(msg => {
                                    const isSent = msg.senderId === user._id || msg.sender?._id === user._id;
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`chat-message ${isSent ? 'sent' : 'received'}`}
                                        >
                                            <div className="message-bubble">
                                                {!isSent && (
                                                    <strong className="message-sender-name">
                                                        {msg.sender?.name || chatBooking.providerName}
                                                    </strong>
                                                )}
                                                <p className="message-text">{msg.text}</p>
                                                <span className="message-timestamp">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="empty-chat-message">No messages yet. Start the conversation!</p>
                            )}
                            <div ref={chatMessagesEndRef} />
                        </div>
                        <form className="chat-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                autoComplete="off"
                            />
                            <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- PROVIDER TRACKING MODAL --- */}
            {showTrackingModal && bookingToTrack && (
                <div className="modal-overlay">
                    <div className="booking-modal" style={{ width: '80vw', maxWidth: '900px' }}>
                        <div className="modal-header">
                            <h2>Tracking {bookingToTrack.providerName}</h2>
                            <button className="close-btn" onClick={handleCloseTrackingModal}>×</button>
                        </div>
                        <div style={{ height: '60vh', width: '100%' }}>
                            <MapContainer
                                center={providerLiveLocation ? [providerLiveLocation.lat, providerLiveLocation.lng] : [userLocation.lat, userLocation.lng]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={true}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                {/* Customer Marker (Home) */}
                                <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                                    <Popup>Your Location</Popup>
                                </Marker>
                                
                                {/* Provider's Live Marker */}
                                {providerLiveLocation ? (
                                    <>
                                        <AnimatedMarker position={[providerLiveLocation.lat, providerLiveLocation.lng]} icon={providerTrackingIcon} />
                                        <Polyline positions={[[userLocation.lat, userLocation.lng], [providerLiveLocation.lat, providerLiveLocation.lng]]} color="#2563eb" dashArray="5, 10" />
                                    </>
                                ) : (
                                   <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'white', padding: '5px 10px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                                        Waiting for provider's location...
                                   </div>
                                )}
                            </MapContainer>
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