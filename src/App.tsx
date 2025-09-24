import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute"; 
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ChangePassword from './pages/ChangePassword'

// Layout and Pages
import Layout from './components/Layout'
import AdminDashboard from './pages/AdminDashboard'
import CreateUser from './pages/CreateUser'
import CreateCase from './pages/CreateCase'
import CreatePlan from './pages/CreatePlan'

// User Layout and Pages
import UserLayout from './components/UserLayout'
import UserDashboard from './pages/UserDashboard'

const AnalyticsPage = () => <div className="p-6"><h1 className="text-white text-2xl">Analytics Page</h1></div>;

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />  
      <Router>
        <Routes>
          {/* Default redirect to /login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/ChangePassword" element={<ChangePassword />} />

          {/* Admin routes with protection */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<CreateUser />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="createCase" element={<CreateCase />} />
            <Route path="CreatePlan" element={<CreatePlan />} />
          </Route>

          {/* User routes with protection */}
          <Route
            path="/user"
            element={
              <ProtectedRoute role="agent">
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserDashboard />} />
            <Route path="createCase" element={<CreateCase />} />
          </Route>

          {/* Unauthorized page fallback */}
          <Route path="/unauthorized" element={<div className="p-6 text-red-500">Unauthorized Access</div>} />
        </Routes>
      </Router>
    </>
  )
}

export default App;
