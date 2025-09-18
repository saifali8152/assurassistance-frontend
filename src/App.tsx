import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ChangePassword from './pages/ChangePassword'
import AdminDashboard from './pages/AdminDashboard'
//import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
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

      </Routes>


    </Router>
  )
}

export default App
