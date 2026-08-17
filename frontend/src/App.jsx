import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredToken, setAuthToken } from "./api/api.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import 'react-data-grid/lib/styles.css';

const Login = lazy(() => import("./pages/Login.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const AdminOtmUserDetail = lazy(() => import("./components/AdminOtmUserDetail.jsx"));
const PaymentChangeRequestsPanel = lazy(() =>
  import("./pages/PaymentChangeRequestsPanel.jsx")
);
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
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            color: "#64748b",
            fontWeight: 700,
          }}
        >
          Loading...
        </div>
      }
    >
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
      <Route
        path="/admin/paymentsheet-date-request"
        element={
         
            <PaymentChangeRequestsPanel />
          
        }
      />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}