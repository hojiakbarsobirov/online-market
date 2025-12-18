import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Komponentlar va Sahifalar
import Navbar from './components/Navbar';
import FooterPage from './components/FooterPage';
import HomePage from './pages/HomePage';
import Register from './pages/Register'; 
import MyProfile from './pages/MyProfile';
import AllProducts from './pages/AllProducts';
import AddProducts from './pages/AddProducts';

const App = () => {
  const [user, setUser] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();

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

  // Auth tekshirilgunga qadar sahifa ko'rsatilmasin
  if (!authChecked) {
    return null;
  }

  // Register sahifasida Navbar va Footer ko'rinmasligi uchun
  const isRegisterPage = location.pathname === '/register';

  return (
    <>
      {!isRegisterPage && <Navbar />}
      
      <Routes>
        {/* Asosiy sahifa */}
        <Route 
          path="/" 
          element={
            user ? (
              hasData ? <HomePage /> : <Navigate to="/register" replace />
            ) : (
              <HomePage />
            )
          } 
        />
        
        {/* Ro'yxatdan o'tish sahifasi */}
        <Route 
          path="/register" 
          element={
            user && !hasData ? (
              <Register />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Barcha mahsulotlar */}
        <Route 
          path="/all-products" 
          element={<AllProducts />} 
        />

        {/* Mahsulot qo'shish - faqat tizimga kirganlar uchun */}
        <Route 
          path="/add-products" 
          element={
            user && hasData ? (
              <AddProducts />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Mening profilim - faqat tizimga kirganlar uchun */}
        <Route 
          path="/my-profile" 
          element={
            user && hasData ? (
              <MyProfile />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* 404 - Sahifa topilmadi */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-black text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Sahifa topilmadi</p>
                <a 
                  href="/" 
                  className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all inline-block"
                >
                  Asosiy sahifaga qaytish
                </a>
              </div>
            </div>
          } 
        />
      </Routes>

      {!isRegisterPage && <FooterPage />}
    </>
  );
};

export default App;