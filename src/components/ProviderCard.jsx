import { FaStar, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './ProviderCard.css';

const ProviderCard = ({ provider }) => {
  return (
    <div className="provider-card">
      <div className="card-header">
        <h3>{provider.name}</h3>
        <span className="service-badge">{provider.service}</span>
      </div>
      <div className="card-body">
        <div className="rating">
          <FaStar className="star" />
          <span>{provider.rating}</span>
          <span>({provider.reviews} reviews)</span>
        </div>
        <div className="location">
          <FaMapMarkerAlt />
          <span>{provider.location}</span>
        </div>
        <p className="description">{provider.description}</p>
      </div>
      <div className="card-footer">
        <a href={`tel:${provider.contact}`} className="contact-btn">
          <FaPhone /> Call
        </a>
        <Link to={`/providers/${provider._id}`} className="details-btn">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProviderCard;