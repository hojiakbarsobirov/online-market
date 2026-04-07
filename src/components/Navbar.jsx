import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineHome, HiOutlineUserCircle, HiMenuAlt3, HiX, HiLogout, HiOutlineHeart } from 'react-icons/hi';
import { AiOutlineShoppingCart, AiOutlinePlusSquare } from 'react-icons/ai';
import { IoChatbubblesOutline } from 'react-icons/io5';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // Auth holati
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setImageError(false);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Yangi xabarlar sonini hisoblash (faqat tizimga kirgan bo'lsa)
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Chat sahifasida emasligimizda yangi xabarlarni ko'rsatish
      if (location.pathname.startsWith('/chat')) {
        setUnreadCount(0);
        return;
      }
      // lastSenderId men emasman va yangi xabar bor
      const newMsgs = snapshot.docs.filter((d) => {
        const data = d.data();
        return data.lastSenderId && data.lastSenderId !== user.uid;
      });
      setUnreadCount(newMsgs.length);
    });

    return () => unsubscribe();
  }, [user, location.pathname]);

  // Chat sahifasiga kirganida badge'ni tozalash
  useEffect(() => {
    if (location.pathname.startsWith('/chat')) {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  // Tashqariga bosganda profil menyusini yopish
  const handleClickOutside = useCallback((event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setIsProfileOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Sahifa o'zgarganda menyularni yopish
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleLogin = async () => {
    try { await signInWithGoogle(); } catch (error) { console.error('Login Error:', error); }
  };

  const handleLogout = async () => {
    try { await logOut(); } catch (error) { console.error('Logout Error:', error); }
  };

  const getUserAvatar = (size = 'w-10 h-10') => {
    if (!user) return null;
    if (!user.photoURL || imageError) {
      const initials = (user.displayName || 'U')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-bold border-2 border-white shadow-lg text-sm`}>
          {initials}
        </div>
      );
    }
    return (
      <img
        src={user.photoURL}
        alt="Profile"
        className={`${size} rounded-full border-2 border-transparent hover:border-purple-600 transition-all object-cover`}
        onError={() => setImageError(true)}
        referrerPolicy="no-referrer"
      />
    );
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const activeStyle =
    'bg-purple-50 text-purple-600 rounded-xl px-4 py-2 border border-purple-100 flex items-center space-x-2 transition-all shadow-sm font-semibold';
  const idleStyle =
    'flex items-center space-x-2 text-gray-500 hover:text-purple-600 px-4 py-2 transition-all border border-transparent hover:bg-purple-50/50 rounded-xl font-semibold';

  // Chat tugmasi (badge bilan)
  const ChatLink = ({ mobile = false }) => (
    <Link
      to="/chats"
      className={`${isActive('/chat') ? activeStyle : idleStyle} relative`}
    >
      <div className="relative">
        <IoChatbubblesOutline size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      <span>{mobile ? 'Xabarlar' : 'Xabarlar'}</span>
    </Link>
  );

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-white border-b border-gray-100 w-full h-[70px] md:h-[80px] flex items-center justify-between px-4 sm:px-10 shadow-sm">

        {/* LOGO */}
        <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <AiOutlineShoppingCart size={20} />
          </div>
          <span className="text-xl font-black text-gray-800 tracking-tighter">ZooMarket.</span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden lg:flex items-center space-x-1">
          <Link to="/" className={location.pathname === '/' ? activeStyle : idleStyle}>
            <HiOutlineHome size={22} /> <span>Asosiy</span>
          </Link>

          {user && (
            <>
              <Link to="/saved" className={isActive('/saved') ? activeStyle : idleStyle}>
                <HiOutlineHeart size={22} /> <span>Saralanganlar</span>
              </Link>
              <Link to="/my-products" className={isActive('/my-products') ? activeStyle : idleStyle}>
                <AiOutlineShoppingCart size={22} /> <span>Mahsulotlarim</span>
              </Link>
              <Link to="/add-products" className={isActive('/add-products') ? activeStyle : idleStyle}>
                <AiOutlinePlusSquare size={22} /> <span>Qo'shish</span>
              </Link>
              {/* Chat linki — badge bilan */}
              <ChatLink />
            </>
          )}

          <div className="h-6 w-[1px] bg-gray-200 mx-3" />

          {!loading && (
            user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="focus:outline-none block relative"
                >
                  {getUserAvatar()}
                  {/* Profil avatarida ham unread badge */}
                  {unreadCount > 0 && !location.pathname.startsWith('/chats') && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 w-3 h-3 rounded-full border-2 border-white" />
                  )}
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border rounded-2xl shadow-2xl z-[120] overflow-hidden">
                    <div className="p-4 border-b bg-purple-50/50">
                      <p className="font-bold text-gray-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/my-profile" className="flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 text-gray-700">
                        <HiOutlineUserCircle size={20} /> <span>Profilim</span>
                      </Link>
                      <Link to="/chats" className="flex items-center justify-between px-4 py-3 hover:bg-purple-50 text-gray-700">
                        <div className="flex items-center space-x-3">
                          <IoChatbubblesOutline size={20} /> <span>Xabarlar</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-red-600 border-t"
                      >
                        <HiLogout size={20} /> <span>Chiqish</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-purple-700 transition-all active:scale-95"
              >
                Kirish
              </button>
            )
          )}
        </div>

        {/* MOBILE: Xabarlar ikoni + Hamburger */}
        <div className="lg:hidden flex items-center gap-2">
          {user && (
            <Link to="/chat" className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors">
              <IoChatbubblesOutline size={26} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-700"
          >
            {isMobileMenuOpen ? <HiX size={28} /> : <HiMenuAlt3 size={28} />}
          </button>
        </div>
      </nav>

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`fixed right-0 top-0 h-full w-[280px] bg-white shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-black text-gray-800">ZooMarket.</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                <HiX size={20} />
              </button>
            </div>

            {user && (
              <div className="mb-6 p-4 bg-purple-50 rounded-2xl flex items-center space-x-3">
                {getUserAvatar('w-12 h-12')}
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-900 truncate text-sm">{user.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Link to="/" className={location.pathname === '/' ? activeStyle : idleStyle}>
                <HiOutlineHome size={22} /> <span>Asosiy</span>
              </Link>

              {user && (
                <>
                  <Link to="/saved" className={isActive('/saved') ? activeStyle : idleStyle}>
                    <HiOutlineHeart size={22} /> <span>Saralanganlar</span>
                  </Link>
                  <Link to="/my-products" className={isActive('/my-products') ? activeStyle : idleStyle}>
                    <AiOutlineShoppingCart size={22} /> <span>Mahsulotlarim</span>
                  </Link>
                  <Link to="/add-products" className={isActive('/add-products') ? activeStyle : idleStyle}>
                    <AiOutlinePlusSquare size={22} /> <span>Qo'shish</span>
                  </Link>
                  {/* Mobile chat linki */}
                  <Link to="/chat" className={`${isActive('/chat') ? activeStyle : idleStyle} relative`}>
                    <div className="relative">
                      <IoChatbubblesOutline size={22} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>Xabarlar</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/my-profile" className={isActive('/my-profile') ? activeStyle : idleStyle}>
                    <HiOutlineUserCircle size={22} /> <span>Profilim</span>
                  </Link>
                </>
              )}
            </div>

            <div className="mt-auto pt-6 border-t">
              {!loading && (
                user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 p-4 rounded-2xl font-bold hover:bg-red-100 transition-all"
                  >
                    <HiLogout size={20} /> <span>Chiqish</span>
                  </button>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="w-full bg-purple-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-purple-700 transition-all"
                  >
                    Kirish
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;