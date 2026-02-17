import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import SimpleLogin from './pages/Auth/SimpleLogin';
import SimpleRegister from './pages/Auth/SimpleRegister';

// Public Pages
import Home from './pages/Home';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import FAQ from './pages/FAQ/FAQ';
import HelpCenter from './pages/HelpCenter/HelpCenter';
// import Login from './pages/Auth/Login';
// import Register from './pages/Auth/Register';

// Legal Pages
import Terms from './pages/Legal/Terms';
import Privacy from './pages/Legal/Privacy';

// Campaign Pages
import Campaigns from './pages/Campaigns/Campaigns';
import CampaignDetail from './pages/Campaigns/CampaignDetail';
import CreateCampaign from './pages/Campaigns/CreateCampaign';
import EditCampaign from './pages/Campaigns/EditCampaign';

// Payment Pages
import ProcessPayment from './pages/Payment/ProcessPayment';
import QRCodePayment from './pages/Payment/QRCodePayment';

// User Pages
import Profile from './pages/Profile/Profile';
import Dashboard from './pages/Dashboard/Dashboard';
import Donate from './pages/Donate/Donate';
import SearchResults from './pages/Search/SearchResults';
import AdminPanel from './pages/Admin/AdminPanel';

// Other Pages
import NotFound from './pages/NotFound';

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" text="Loading DreamLift..." />
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        {/* Auth Routes */}
        <Route path="/login" element={<SimpleLogin />} />
        <Route path="/register" element={<SimpleRegister />} />

        
        {/* Legal Routes */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/help-center" element={<HelpCenter />} />
        
        {/* Campaign Routes */}
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/donate/:id" element={<Donate />} />
        
        {/* Payment Routes */}
        <Route path="/payment/process" element={
          <ProtectedRoute>
            <ProcessPayment />
          </ProtectedRoute>
        } />
        <Route path="/payment/qrcode" element={
          <ProtectedRoute>
            <QRCodePayment />
          </ProtectedRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/campaigns/create" element={
          <ProtectedRoute>
            <CreateCampaign />
          </ProtectedRoute>
        } />
        <Route path="/campaigns/:id/edit" element={
          <ProtectedRoute>
            <EditCampaign />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <div className="App">
              <AppContent />
              
              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    theme: {
                      primary: '#4aed88',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
