import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import Home from './pages/Home/Home'
import Services from './pages/Services/Services'
import ServiceDetails from './pages/ServiceDetails/ServiceDetails'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import CustomerDashboard from './pages/CustomerDashboard/CustomerDashboard'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import ProviderDashboard from './pages/ProviderDashboard/ProviderDashboard'
import About from './pages/About/About'
import Contact from './pages/Contact/Contact'
import ServiceComparison from './pages/ServiceComparison/ServiceComparison'
import BookingTracker from './pages/BookingTracker/BookingTracker'
import BookingChat from './pages/BookingChat/BookingChat'
import ChatInbox from './pages/ChatInbox/ChatInbox'
import ChatNotificationCenter from './components/ChatNotificationCenter/ChatNotificationCenter'
import ServiceHubAssistant from './components/ServiceHubAssistant/ServiceHubAssistant'

function AppRoutes() {
  const { pathname } = useLocation()
  const hideFooter =
    /^\/(login|signup|register|customer-dashboard|provider-dashboard|booking-tracker|booking-chat|chats)(\/|$)/.test(
      pathname
    )

  return (
    <div className="app-shell">
      <Navbar />
      <ChatNotificationCenter />
      <ServiceHubAssistant />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route
            path="/services/compare"
            element={<ServiceComparison />}
          />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route
            path="/booking-tracker/:id"
            element={
              <ProtectedRoute allowedRole="customer">
                <BookingTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-chat/:id"
            element={
              <ProtectedRoute>
                <BookingChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <ChatInbox />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider-dashboard"
            element={
              <ProtectedRoute allowedRole="provider">
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App