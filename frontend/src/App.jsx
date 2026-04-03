import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { getStoredToken, setAuthToken } from "./api/api.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import AdminOtmUserDetail from "./components/AdminOtmUserDetail.jsx";

function PrivateRoute({ children }) {
  const token = getStoredToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
export default function App() {
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      setAuthToken(token);
    }
  }, []);
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />
      {/* Protected Route */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }/>
       <Route
        path="/admin/otm/:userId"
        element={
          <PrivateRoute>
            <AdminOtmUserDetail />
          </PrivateRoute>
        }
      />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}