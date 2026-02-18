import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { getStoredToken, setAuthToken } from "./api/api.js";
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';

function PrivateRoute({ children }) {
  const token = getStoredToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token) setAuthToken(token);
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
