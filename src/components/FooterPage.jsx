import React from 'react';
import { Link } from 'react-router-dom';
import { AiOutlineShoppingCart, AiFillInstagram, AiFillFacebook, AiFillYoutube } from 'react-icons/ai';
import { FaTelegramPlane } from 'react-icons/fa';

const FooterPage = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-5 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* 1. Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                <AiOutlineShoppingCart size={22} />
              </div>
              <span className="text-xl font-black text-gray-800 tracking-tighter">
                MARKET<span className="text-purple-600">.</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Siz uchun eng yaxshi va sifatli mahsulotlar jamlangan platforma. Biz bilan hayotingizni yanada osonlashtiring.
            </p>
            <div className="flex space-x-4 text-gray-400">
              <a href="#" className="hover:text-purple-600 transition-colors"><AiFillInstagram size={24} /></a>
              <a href="#" className="hover:text-purple-600 transition-colors"><FaTelegramPlane size={22} /></a>
              <a href="#" className="hover:text-purple-600 transition-colors"><AiFillFacebook size={24} /></a>
              <a href="#" className="hover:text-purple-600 transition-colors"><AiFillYoutube size={24} /></a>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h4 className="text-gray-800 font-bold mb-6">Bo'limlar</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-purple-600 transition-colors">Bosh sahifa</Link></li>
              <li><Link to="/products" className="hover:text-purple-600 transition-colors">Mahsulotlar</Link></li>
              <li><Link to="/add-product" className="hover:text-purple-600 transition-colors">Mahsulot qo'shish</Link></li>
              <li><Link to="/categories" className="hover:text-purple-600 transition-colors">Kategoriyalar</Link></li>
            </ul>
          </div>

          {/* 3. Support */}
          <div>
            <h4 className="text-gray-800 font-bold mb-6">Yordam</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-purple-600 transition-colors">Tez-tez beriladigan savollar</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Yetkazib berish</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Qaytarish shartlari</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Maxfiylik siyosati</a></li>
            </ul>
          </div>

          {/* 4. Newsletter */}
          <div>
            <h4 className="text-gray-800 font-bold mb-6">Obuna bo'ling</h4>
            <p className="text-sm text-gray-500 mb-4">Yangiliklar va aksiyalardan xabardor bo'ling.</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Emailingiz" 
                className="bg-gray-50 border border-gray-100 rounded-l-xl px-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-purple-200 text-sm"
              />
              <button className="bg-purple-600 text-white px-4 py-2 rounded-r-xl hover:bg-purple-700 transition-all text-sm font-bold">
                OK
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs text-gray-400">
          <p>© 2026 Market Platformasi. Barcha huquqlar himoyalangan.</p>
          <div className="flex space-x-6 font-medium">
            <span className="flex items-center gap-1">To'lov tizimlari: <b className="text-gray-600">PayMe, Uzum, Click</b></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterPage;