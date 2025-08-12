import { Link } from 'react-router-dom';
import ProviderList from '../components/ProviderList';

const Home = ({ user }) => {
  return (
    <div>
      <header>
        <h1>Home Services</h1>
        {user ? (
          <div>
            <span>Welcome, {user.name}</span>
            <button onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              window.location.reload();
            }}>Logout</button>
          </div>
        ) : (
          <Link to="/login">Login/Signup</Link>
        )}
      </header>
      
      <main>
        <ProviderList />
      </main>
    </div>
  );
};

export default Home;