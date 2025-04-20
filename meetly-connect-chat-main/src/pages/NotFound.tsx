
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="meetly-card max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Oops! This page doesn't exist</p>
        <button 
          onClick={() => navigate('/')} 
          className="meetly-btn"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
