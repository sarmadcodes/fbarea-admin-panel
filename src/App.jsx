import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import Vehicles from './pages/Vehicles';
import Complaints from './pages/Complaints';
import Payments from './pages/Payments';
import VehicleRequests from './pages/VehicleRequests';
import Announcements from './pages/Announcements';
import DigitalCards from './pages/DigitalCards';
import GuestRequests from './pages/GuestRequests';
import Deals from './pages/Deals';
import DealCategories from './pages/DealCategories';
import Layout from './components/Layout';

function App() {
  const isAuthenticated = !!localStorage.getItem('adminToken');

  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          
          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="residents" element={<Residents />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="payments" element={<Payments />} />
            <Route path="vehicle-requests" element={<VehicleRequests />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="digital-cards" element={<DigitalCards />} />
            <Route path="guest-requests" element={<GuestRequests />} />
            <Route path="deals" element={<Deals />} />
            <Route path="deal-categories" element={<DealCategories />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;