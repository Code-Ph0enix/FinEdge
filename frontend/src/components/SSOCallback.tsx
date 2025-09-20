import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SSOCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Extract the redirect URL from the query parameters
    const params = new URLSearchParams(location.search);
    const redirectUrl = params.get('redirect_url') || '/portfolio';
    
    // Redirect to the specified URL after a short delay
    const timer = setTimeout(() => {
      navigate(redirectUrl);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [navigate, location]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Processing your login...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default SSOCallback; 