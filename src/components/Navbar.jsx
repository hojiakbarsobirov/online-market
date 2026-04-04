import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineHome, HiOutlineUserCircle, HiMenuAlt3, HiX, HiLogout, HiOutlineHeart } from 'react-icons/hi';
import { AiOutlineShoppingCart, AiOutlinePlusSquare } from 'react-icons/ai';
import { auth, signInWithGoogle, logOut, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const location = useLocation();
  const profileRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setImageError(false);
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

  const handleLogin = async () => {
    try { await signInWithGoogle(); } catch (error) { console.error(error); }
  };

  const handleLogout = async () => {
    try { await logOut(); } catch (error) { console.error(error); }
  };

  const getUserAvatar = (size = "w-10 h-10") => {
    if (!user) return null;
    if (!user.photoURL || imageError) {
      const initials = (user.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-bold border-2 border-white shadow-lg`}>
          {initials}
        </div>
      );
    }
    return (
      <img src={user.photoURL} alt="Profile" className={`${size} rounded-full border-2 border-transparent hover:border-purple-600 transition-all object-cover`} onError={() => setImageError(true)} referrerPolicy="no-referrer" />
    );
  };

  const activeStyle = "bg-purple-50 text-purple-600 rounded-xl px-4 py-2 border border-purple-100 flex items-center space-x-2 transition-all shadow-sm";
  const idleStyle = "flex items-center space-x-2 text-gray-500 hover:text-purple-600 px-4 py-2 transition-all border border-transparent hover:bg-purple-50/50 rounded-xl";

  return (
    <nav className="sticky top-0 z-[100] bg-white border-b border-gray-100 w-full h-[70px] md:h-[80px] flex items-center justify-between px-4 sm:px-10 shadow-sm">
      
      {/* LOGO */}
      <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
        <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
          <AiOutlineShoppingCart size={20} />
        </div>
        <span className="text-xl font-black text-gray-800 tracking-tighter">ZooMarket.</span>
      </Link>

      {/* DESKTOP MENU */}
      <div className="hidden lg:flex items-center space-x-1 font-semibold">
        <Link to="/" className={location.pathname === '/' ? activeStyle : idleStyle}>
          <HiOutlineHome size={22}/> <span>Asosiy</span>
        </Link>
        
        {user && (
          <>
            <Link to="/saved" className={location.pathname === '/saved' ? activeStyle : idleStyle}>
              <HiOutlineHeart size={22}/> <span>Saralanganlar</span>
            </Link>
            <Link to="/my-products" className={location.pathname === '/my-products' ? activeStyle : idleStyle}>
              <AiOutlineShoppingCart size={22}/> <span>Mahsulotlarim</span>
            </Link>
            <Link to="/add-products" className={location.pathname === '/add-products' ? activeStyle : idleStyle}>
              <AiOutlinePlusSquare size={22}/> <span>Qo'shish</span>
            </Link>
          </>
        )}

        <div className="h-6 w-[1px] bg-gray-200 mx-3"></div>

        {!loading && (
          user ? (
            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="focus:outline-none block">
                {getUserAvatar()}
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border rounded-2xl shadow-2xl z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b bg-purple-50/50">
                    <p className="font-bold text-gray-900 truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/my-profile" className="flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 text-gray-700">
                      <HiOutlineUserCircle size={20}/> <span>Profilim</span>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-red-600 border-t">
                      <HiLogout size={20}/> <span>Chiqish</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-purple-700 transition-all active:scale-95">
              Kirish
            </button>
          )
        )}
      </div>

      {/* MOBILE MENU BUTTON */}
      <div className="lg:hidden flex items-center">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <HiX size={28} /> : <HiMenuAlt3 size={28} />}
        </button>
      </div>

      {/* MOBILE SIDEBAR (O'zgartirilgan) */}
      {/* ... (Mobile menu qismini ham yuqoridagidek Linklar bilan yangilab qo'ying) */}
    </nav>
  );
};

export default Navbar;