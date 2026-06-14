import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }         from './hooks/useAuth.jsx';
import { CustomerAuthProvider } from './hooks/useCustomerAuth.jsx';
import { CartProvider }         from './hooks/useCart.jsx';

import Storefront      from './pages/Storefront.jsx';
import AdminLogin      from './pages/AdminLogin.jsx';
import AdminDashboard  from './pages/AdminDashboard.jsx';
import LoginPage       from './pages/LoginPage.jsx';
import RegisterPage    from './pages/RegisterPage.jsx';
import AccountPage     from './pages/AccountPage.jsx';
import OrderSuccess    from './pages/OrderSuccess.jsx';
import SurMesurePage  from './pages/SurMesurePage.jsx';

import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/"                     element={<Storefront />} />
              <Route path="/connexion"             element={<LoginPage />} />
              <Route path="/inscription"           element={<RegisterPage />} />
              <Route path="/mon-compte"            element={<AccountPage />} />
              <Route path="/commande/succes"       element={<OrderSuccess />} />
              <Route path="/sur-mesure"            element={<SurMesurePage />} />
              <Route path="/admin"                 element={<AdminLogin />} />
              <Route path="/admin/dashboard"       element={<AdminDashboard />} />
              <Route path="*"                      element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
}
