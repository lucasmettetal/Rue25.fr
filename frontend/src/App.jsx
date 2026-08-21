import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider }         from './hooks/useAuth.jsx';
import { CustomerAuthProvider } from './hooks/useCustomerAuth.jsx';
import { CartProvider }         from './hooks/useCart.jsx';

import Storefront      from './pages/Storefront.jsx';
import ProductPage     from './pages/ProductPage.jsx';
import AdminLogin      from './pages/AdminLogin.jsx';
import AdminDashboard  from './pages/AdminDashboard.jsx';
import LoginPage       from './pages/LoginPage.jsx';
import RegisterPage    from './pages/RegisterPage.jsx';
import AccountPage     from './pages/AccountPage.jsx';
import OrderSuccess    from './pages/OrderSuccess.jsx';
import SurMesurePage  from './pages/SurMesurePage.jsx';
import ContactPage    from './pages/ContactPage.jsx';
import LegalPage      from './pages/LegalPage.jsx';
import PrivacyPage    from './pages/PrivacyPage.jsx';
import CookieBanner   from './components/CookieBanner.jsx';

import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/"                     element={<Storefront />} />
              <Route path="/produit/:slug"         element={<ProductPage />} />
              <Route path="/connexion"             element={<LoginPage />} />
              <Route path="/inscription"           element={<RegisterPage />} />
              <Route path="/mon-compte"            element={<AccountPage />} />
              <Route path="/commande/succes"       element={<OrderSuccess />} />
              <Route path="/sur-mesure"            element={<SurMesurePage />} />
              <Route path="/contact"               element={<ContactPage />} />
              <Route path="/mentions-legales"      element={<LegalPage />} />
              <Route path="/politique-de-confidentialite" element={<PrivacyPage />} />
              <Route path="/admin"                 element={<AdminLogin />} />
              <Route path="/admin/dashboard"       element={<AdminDashboard />} />
              <Route path="*"                      element={<Navigate to="/" />} />
            </Routes>
            <CookieBanner />
          </BrowserRouter>
        </CartProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
}

// Sans cela, ouvrir une fiche produit depuis le bas du catalogue afficherait la
// nouvelle page à la même hauteur de défilement. Une ancre (#catalogue) reste
// prioritaire : c'est la page ciblée qui gère son propre défilement.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
