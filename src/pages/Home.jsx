import { Link } from 'react-router-dom';
import ProviderList from '../components/ProviderList';

const Home = ({ user, setUser }) => {
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    if (setUser) setUser(null); // updates state instead of full page reload
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-between items-center p-4 bg-blue-600 text-white">
        <h1 className="text-2xl font-bold">Home Services</h1>
        {user ? (
          <div className="flex items-center space-x-4">
            <span>Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-white text-blue-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-white text-blue-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition"
          >
            Login / Signup
          </Link>
        )}
      </header>

      <main className="p-6">
        <ProviderList />
      </main>
    </div>
  );
};

export default Home;
