import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Fallback page - redirects to quiz if someone lands here directly
const Results = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to quiz - this page is now just a safety fallback
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default Results;
