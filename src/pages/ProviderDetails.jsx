import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ProviderDetails = () => {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const response = await axios.get(`/api/providers/${id}`);
        setProvider(response.data);
      } catch (error) {
        console.error('Error fetching provider:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  if (loading) return <div className="loading">Loading provider details...</div>;
  if (!provider) return <div className="not-found">Provider not found</div>;

  return (
    <div className="provider-details">
      <div className="provider-header">
        <img src={provider.image || '/default-service.jpg'} alt={provider.name} />
        <h1>{provider.name}</h1>
        <h2>{provider.service}</h2>
      </div>
      <div className="provider-content">
        <div className="provider-info">
          <h3>About</h3>
          <p>{provider.description}</p>
          <div className="contact-info">
            <h3>Contact</h3>
            <p>{provider.contact}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetails;