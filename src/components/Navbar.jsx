import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineHome, HiOutlineUserCircle, HiMenuAlt3, HiX, HiLogout, HiLogin } from 'react-icons/hi';
import { AiOutlineShoppingCart, AiOutlinePlusSquare } from 'react-icons/ai';
import { auth, signInWithGoogle, logOut, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const location = useLocation();
  const profileRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser); // Debug
      setUser(currentUser);
      setImageError(false); // Reset image error
      
      if (currentUser) {
        console.log('Photo URL:', currentUser.photoURL); // Debug
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setUserData(docSnap.data());
        } catch (error) { 
          console.error("Firestore error:", error); 
        }
      } else { 
        setUserData(null); 
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setIsProfileOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleLogin = async () => {
    try { 
      await signInWithGoogle(); 
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') alert("Xatolik yuz berdi.");
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setIsMobileMenuOpen(false);
    } catch (error) { console.error(error); }
  };

  const handleImageError = () => {
    console.log('Image failed to load'); // Debug
    setImageError(true);
  };

  // Default avatar - user initials yoki default icon
  const getDefaultAvatar = () => {
    if (!user) return null;
    const name = user.displayName || user.email || 'U';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (
      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
        {initials}
      </div>
    );
  };

  const getUserAvatar = (size = "w-10 h-10") => {
    if (!user) return null;
    
    const photoURL = user.photoURL;
    
    if (!photoURL || imageError) {
      // Default avatar with initials
      const name = user.displayName || user.email || 'U';
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-bold border-2 border-white shadow-lg`}>
          {initials}
        </div>
      );
    }
    
    return (
      <img 
        src={photoURL}
        alt="Profile"
        className={`${size} rounded-full border-2 border-transparent hover:border-purple-600 transition-all object-cover`}
        onError={handleImageError}
        referrerPolicy="no-referrer"
      />
    );
  };

  const activeStyle = "bg-purple-50 text-purple-600 rounded-xl px-4 py-2 border border-purple-100 flex items-center space-x-2 transition-all shadow-sm";
  const idleStyle = "flex items-center space-x-2 text-gray-500 hover:text-purple-600 px-4 py-2 transition-all border border-transparent hover:bg-purple-50/50 rounded-xl";

  return (
    <nav className="sticky top-0 z-[100] bg-white border-b border-gray-100 w-full h-[70px] md:h-[80px] flex items-center justify-between px-4 sm:px-10 shadow-sm">
      
      {/* LOGO */}
      <Link to="/" className="flex items-center space-x-2 flex-shrink-0 z-[110]">
        <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
          <AiOutlineShoppingCart size={20} />
        </div>
        <span className="text-xl font-black text-gray-800 tracking-tighter">MARKET.</span>
      </Link>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex items-center space-x-2 font-semibold">
        <Link to="/" className={location.pathname === '/' ? activeStyle : idleStyle}>
          <HiOutlineHome size={22}/> <span>Asosiy</span>
        </Link>
        {user && (
          <>
            <Link to="/all-products" className={location.pathname === '/all-products' ? activeStyle : idleStyle}>
              <AiOutlineShoppingCart size={22}/> <span>Mahsulotlar</span>
            </Link>
            <Link to="/add-products" className={location.pathname === '/add-products' ? activeStyle : idleStyle}>
              <AiOutlinePlusSquare size={22}/> <span>Qo'shish</span>
            </Link>
          </>
        )}
        <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
        {!loading && (
          user ? (
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                className="focus:outline-none"
                aria-label="Profile menu"
              >
                {getUserAvatar()}
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border rounded-2xl shadow-2xl z-[120]">
                  <div className="p-4 border-b bg-purple-50/50 rounded-t-2xl">
                    <div className="flex items-center space-x-3 mb-2">
                      {getUserAvatar("w-12 h-12")}
                      <div className="overflow-hidden flex-1">
                        <p className="font-bold text-gray-900 truncate">{user.displayName || 'Foydalanuvchi'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link to="/my-profile" className="flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 text-gray-700 font-semibold">
                      <HiOutlineUserCircle size={20}/> <span>Profilim</span>
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-red-600 font-semibold border-t"
                    >
                      <HiLogout size={20}/> <span>Chiqish</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-purple-700 transition-all"
            >
              Kirish
            </button>
          )
        )}
      </div>

      {/* MOBILE BUTTON */}
      <div className="md:hidden flex items-center">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 z-[200] relative"
          aria-label="Menu"
        >
          {isMobileMenuOpen ? <HiX size={28} className="text-gray-800" /> : <HiMenuAlt3 size={28} className="text-gray-800" />}
        </button>
      </div>

      {/* MOBILE MENU PANEL */}
      <div className={`fixed inset-0 z-[150] transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
        
        {/* Panel */}
        <div className={`absolute right-0 top-0 h-[100dvh] w-[300px] bg-white shadow-2xl transition-transform duration-300 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* 1. Header (Statik) */}
          <div className="p-6 border-b flex-shrink-0">
             <span className="text-2xl font-black text-gray-800">MARKET<span className="text-purple-600">.</span></span>
          </div>

          {/* 2. Scrollable Content (Asosiy qism) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {user && (
              <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 flex items-center space-x-4">
                {getUserAvatar("w-12 h-12")}
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-900 truncate text-sm">{user.displayName || 'Foydalanuvchi'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}
            
            <Link to="/" className={`flex items-center space-x-3 p-4 rounded-xl font-bold ${location.pathname === '/' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-gray-700 hover:bg-gray-50'}`}>
              <HiOutlineHome size={22}/> <span>Asosiy Sahifa</span>
            </Link>
            
            {user && (
              <>
                <Link to="/all-products" className={`flex items-center space-x-3 p-4 rounded-xl font-bold ${location.pathname === '/all-products' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <AiOutlineShoppingCart size={22}/> <span>Barcha Mahsulotlar</span>
                </Link>
                <Link to="/add-products" className={`flex items-center space-x-3 p-4 rounded-xl font-bold ${location.pathname === '/add-products' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <AiOutlinePlusSquare size={22}/> <span>Yangi Qo'shish</span>
                </Link>
                <Link to="/my-profile" className={`flex items-center space-x-3 p-4 rounded-xl font-bold ${location.pathname === '/my-profile' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <HiOutlineUserCircle size={22}/> <span>Mening Profilim</span>
                </Link>
              </>
            )}
            
            {/* Bo'sh joy qo'shish (Scroll yaxshi ishlashi uchun) */}
            <div className="h-10"></div>
          </div>

          {/* 3. Footer (Statik - Har doim pastda) */}
          <div className="p-4 border-t bg-gray-50 flex-shrink-0">
            {user ? (
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center justify-center space-x-3 bg-red-50 text-red-600 p-4 rounded-xl font-bold active:scale-95 transition-all"
              >
                <HiLogout size={22}/> <span>Tizimdan Chiqish</span>
              </button>
            ) : (
              <button 
                onClick={handleLogin} 
                className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold shadow-lg"
              >
                Kirish / Ro'yxatdan o'tish
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;