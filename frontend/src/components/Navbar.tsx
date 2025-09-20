import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { BarChart2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const Navbar = () => {
  const { isSignedIn } = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <BarChart2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">WealthWise</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isSignedIn ? (
              <Link to="/portfolio" className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/sign-in" className="btn-primary">Sign In</Link>
                <Link to="/sign-up" className="btn-secondary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;