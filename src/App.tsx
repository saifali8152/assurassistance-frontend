import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import AuthRedirect from "./components/AuthRedirect";
import AuthGuard from "./components/AuthGuard";
// import AuthDebug from "./components/AuthDebug";
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ChangePassword from './pages/ChangePassword'
import EditProfile from './pages/EditProfile'
import EditPassword from './pages/EditPassword'
import AdminEditProfile from './pages/AdminEditProfile'
import AdminChangePassword from './pages/AdminChangePassword'

// Layout and Pages
import Layout from './components/Layout'
import AdminDashboard from './pages/AdminDashboard'
import CreateUser from './pages/CreateUser'
import SupervisorView from './pages/SupervisorView'
import CreateCase from './pages/CreateCase'

function CreateCaseRoute() {
  const [sp] = useSearchParams()
  const k = sp.get('editCase') || 'new'
  return <CreateCase key={k} />
}
import CreateGroupCase from './pages/CreateGroupCase'
import CreatePlan from './pages/CreatePlan'
import CasesManagement from './pages/CasesManagement'
import AnalyticsPage from './pages/AnalyticsPage'
import LedgerPage from './pages/LedgerPage'
import Reconciliation from './pages/ReconciliationTable'
import ActivityLogPage from './pages/ActivityLogPage'
import AgentHierarchyPage from './pages/AgentHierarchyPage'


// User Layout and Pages
import UserLayout from './components/UserLayout'
import UserDashboard from './pages/UserDashboard'
import CertificatePrint from './pages/CertificatePrint'

//const AnalyticsPage = () => <div className="p-6"><h1 className="text-white text-2xl">Analytics Page</h1></div>;

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        {/* <AuthDebug /> */}
        <Toaster 
        position="top-right" 
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{ 
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#2B2B2B',
            border: '1px solid #D9D9D9',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxWidth: '400px',
            zIndex: 9999,
          },
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
              border: '1px solid #059669',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
              border: '1px solid #dc2626',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }} 
      />  
      <Router>
        <Routes>
          {/* Public routes - redirect authenticated users to dashboard */}
          <Route 
            path="/login" 
            element={
              <AuthGuard requireAuth={false}>
                <Login />
              </AuthGuard>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <AuthGuard requireAuth={false}>
                <ForgotPassword />
              </AuthGuard>
            } 
          />
          
          {/* Change password route - only for users who need to change password */}
          <Route 
            path="/change-password" 
            element={
              <AuthGuard requireAuth={true} requirePasswordChange={true}>
                <ChangePassword />
              </AuthGuard>
            } 
          />

          {/* Admin routes with protection */}
          <Route
            path="/admin"
            element={
              <AuthGuard requireAuth={true} allowedRoles={['admin']}>
                <Layout />
              </AuthGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<CreateUser />} />
            <Route path="agent-hierarchy" element={<AgentHierarchyPage />} />
            <Route path="supervisors/:id" element={<SupervisorView />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="createCase" element={<CreateCaseRoute />} />
            <Route path="createGroupCase" element={<CreateGroupCase />} />
            <Route path="CreatePlan" element={<CreatePlan />} />
            <Route path="cases" element={<CasesManagement />} />
            <Route path='ledger' element={<LedgerPage />} />
            <Route path='Reconciliation' element={<Reconciliation />} />
            <Route path='activity-log' element={<ActivityLogPage />} />
            <Route path='profile' element={<AdminEditProfile />} />
            <Route path='change-password' element={<AdminChangePassword />} />
          </Route>

          {/* User routes with protection */}
          <Route
            path="/user"
            element={
              <AuthGuard requireAuth={true} allowedRoles={['agent']}>
                <UserLayout />
              </AuthGuard>
            }
          >
            <Route index element={<UserDashboard />} />
            <Route path="createCase" element={<CreateCaseRoute />} />
            <Route path="createGroupCase" element={<CreateGroupCase />} />
            <Route path="cases" element={<CasesManagement />} />
            <Route path='ledger' element={<LedgerPage />} />
            <Route path='profile' element={<EditProfile />} />
            <Route path='edit-password' element={<EditPassword />} />
          </Route>

          <Route path="/certificate-public/:publicToken" element={<CertificatePrint />} />

          <Route
            path="/certificate/:saleId"
            element={
              <AuthGuard requireAuth={true} allowedRoles={['admin', 'agent']}>
                <CertificatePrint />
              </AuthGuard>
            }
          />

          {/* Default redirect - handles authentication state */}
          <Route path="/" element={<AuthRedirect />} />

          {/* Unauthorized page fallback */}
          <Route path="/unauthorized" element={<div className="p-6 text-red-500">Unauthorized Access</div>} />
          
          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </CurrencyProvider>
    </AuthProvider>
  )
}

export default App;
