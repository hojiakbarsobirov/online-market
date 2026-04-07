import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Komponentlar va Sahifalar
import Navbar from './components/Navbar';
import FooterPage from './components/FooterPage';
import HomePage from './pages/HomePage';
import Register from './pages/Register'; 
import MyProfile from './pages/MyProfile';
import AllProducts from './pages/MyProducts';
import AddProducts from './pages/AddProducts';
import SavedPage from './pages/SavedPage';
import ProductDetails from './pages/ProductDetails';
import SellerProfile from './pages/SellerProfile';
import ChatPage from './pages/ChatPage';

const App = () => {
  const [user, setUser] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          setHasData(docSnap.exists());
        } catch (error) {
          console.error("Foydalanuvchi ma'lumotlarini yuklashda xatolik:", error);
          setHasData(false);
        }
      } else {
        setHasData(false);
      }
      
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  const isRegisterPage = location.pathname === '/register';
  
  // Footer faqat Bosh sahifa (/) va Mening profilim (/my-profile) sahifalarida chiqishi uchun:
  const shouldShowFooter = location.pathname === '/' || location.pathname === '/my-profile';

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/" replace />;
    if (!hasData) return <Navigate to="/register" replace />;
    return children;
  };

  return (
    <>
      {!isRegisterPage && <Navbar />}
      
      <Routes>
        <Route path="/" element={user && !hasData ? <Navigate to="/register" replace /> : <HomePage />} />
        
        <Route 
          path="/register" 
          element={user && !hasData ? <Register /> : <Navigate to="/" replace />} 
        />

        <Route path="/my-products" element={<AllProducts />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/seller/:id" element={<SellerProfile />} />

        <Route 
          path="/chats" 
          element={<ProtectedRoute><ChatPage /></ProtectedRoute>} 
        />
        
        <Route 
          path="/chat/:sellerId" 
          element={<ProtectedRoute><ChatPage /></ProtectedRoute>} 
        />

        <Route 
          path="/add-products" 
          element={<ProtectedRoute><AddProducts /></ProtectedRoute>} 
        />

        <Route 
          path="/my-profile" 
          element={<ProtectedRoute><MyProfile /></ProtectedRoute>} 
        />

        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center">
              <div>
                <h1 className="text-6xl font-black text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Sahifa topilmadi</p>
                <button onClick={() => navigate('/')} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold">
                  Bosh sahifa
                </button>
              </div>
            </div>
          } 
        />
      </Routes>

      {/* Footer mantiqi yangilandi */}
      {shouldShowFooter && <FooterPage />}
    </>
  );
};

export default App;