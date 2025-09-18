import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from "react-hot-toast";

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ChangePassword from './pages/ChangePassword'

// Layout and Pages that use the Layout
import Layout from './components/Layout'
import AdminDashboard from './pages/AdminDashboard'
//import ProtectedRoute from "./components/ProtectedRoute";
import CreateUser from './pages/CreateUser'


// Placeholder pages for demonstration
const AnalyticsPage = () => <div className="p-6"><h1 className="text-white text-2xl">Analytics Page</h1></div>;
const SettingsPage = () => <div className="p-6"><h1 className="text-white text-2xl">Settings Page</h1></div>;



function App() {
  return (
    <>
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />  
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route
          path="/ChangePassword"
          element={
           // <ProtectedRoute role="user">
              <ChangePassword />
          //  </ProtectedRoute>
          }
        />

        <Route
          path="/AdminDashboard"
          element={
           // <ProtectedRoute role="admin">
              <AdminDashboard />
            //</ProtectedRoute>
          }
        />

       {/* <Route path="/unauthorized" element={<h2>Unauthorized Access</h2>} />   */}

        {/* Standalone routes that DO NOT use the Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/ChangePassword" element={<ChangePassword />} />

        {/* Routes that ARE nested inside the Layout component */}
        <Route path="/" element={<Layout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<CreateUser />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />  
        </Route>  
      </Routes>


    </Router>
    </>
  )
}

export default App