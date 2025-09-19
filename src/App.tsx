import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Standalone Pages
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ChangePassword from './pages/ChangePassword'

// Layout and Pages that use the Layout
import Layout from './components/Layout'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from "./components/ProtectedRoute";
import CreateUser from './pages/CreateUser'
import CreateCase from './pages/CreateCase'

// User Layout and Pages
import UserLayout from './components/UserLayout'
import UserDashboard from './pages/UserDashboard'

// Placeholder pages for demonstration
const AnalyticsPage = () => <div className="p-6"><h1 className="text-white text-2xl">Analytics Page</h1></div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route
          path="/ChangePassword"
          element={
              <ChangePassword />
          }
        />

        <Route
          path="/AdminDashboard"
          element={
              <AdminDashboard />
          }
        />
        {/* Standalone routes that DO NOT use the Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/ChangePassword" element={<ChangePassword />} />

        {/* Routes that ARE nested inside the Layout component */}
        <Route path="/" element={<Layout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<CreateUser />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="createCase" element={<CreateCase />} />
        </Route>

        {/* USER ROUTES - Add UserDashboard here */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App