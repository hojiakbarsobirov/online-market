import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, MapPin, Calendar, Phone, Mail, Package, Loader2, ChevronLeft } from 'lucide-react';

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        // 1. Sotuvchi ma'lumotlarini olish
        const sellerRef = doc(db, "users", id);
        const sellerSnap = await getDoc(sellerRef);
        
        if (sellerSnap.exists()) {
          setSeller(sellerSnap.data());
          
          // 2. Sotuvchining mahsulotlarini olish
          const q = query(collection(db, "products"), where("userId", "==", id));
          const querySnapshot = await getDocs(q);
          const productsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProducts(productsList);
        }
      } catch (error) {
        console.error("Xatolik:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-purple-600" size={40} />
    </div>
  );

  if (!seller) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <h2 className="text-2xl font-bold text-gray-800">Sotuvchi topilmadi</h2>
      <button onClick={() => navigate('/')} className="mt-4 text-purple-600 font-bold">Asosiy sahifaga qaytish</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header / Banner */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-bold text-lg text-slate-800">Sotuvchi profili</h1>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Chap tomon: Profil kartasi */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border p-6 shadow-sm sticky top-24">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden mb-4">
                  {seller.photoURL ? (
                    <img src={seller.photoURL} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-purple-500" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{seller.displayName || "Ismsiz foydalanuvchi"}</h2>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <Calendar size={14} /> Platformada: {seller.createdAt ? new Date(seller.createdAt.seconds * 1000).getFullYear() : '2024'}-yildan beri
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-purple-600 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Telefon</p>
                    <p className="text-sm font-bold text-slate-700">{seller.phone || "Ko'rsatilmadi"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Manzil</p>
                    <p className="text-sm font-bold text-slate-700">{seller.address || "O'zbekiston"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex justify-around text-center">
                <div>
                  <p className="text-2xl font-black text-purple-600">{products.length}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">E'lonlar</p>
                </div>
                <div className="border-l"></div>
                <div>
                  <p className="text-2xl font-black text-green-600">Active</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Holati</p>
                </div>
              </div>
            </div>
          </div>

          {/* O'ng tomon: E'lonlar ro'yxati */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="text-purple-600" /> Sotuvchining e'lonlari
              </h3>
              <span className="bg-white px-3 py-1 rounded-full border text-sm font-medium text-slate-600">
                {products.length} ta natija
              </span>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img 
                        src={item.image} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        alt={item.title} 
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-purple-600 transition-colors">
                        {item.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg font-black text-slate-900">{item.price?.toLocaleString()} $</span>
                        <span className="text-[11px] font-bold text-gray-400 uppercase">{item.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed p-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-medium">Hozircha e'lonlar mavjud emas.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SellerProfile;