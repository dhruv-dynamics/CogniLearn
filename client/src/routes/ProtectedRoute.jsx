import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);
  const token = sessionStorage.getItem("token");

  // 1. Wait for auth check to complete
  if (loading && !user) {
    return <div style={{color: 'white', padding: '50px', textAlign: 'center'}}>Verifying Session...</div>;
  }

  // 2. No token? Go to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 3. Role mismatch? Go to home/login
  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
