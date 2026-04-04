import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { 
  Heart, Share2, MessageCircle, Phone, ArrowLeft, 
  Loader2, User, MapPin, Info, ChevronRight, ChevronLeft
} from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]); // O'xshash mahsulotlar
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() };
          setProduct(productData);

          // 1. Sotuvchi ma'lumotlari
          if (productData.userId) {
            const sellerRef = doc(db, "users", productData.userId);
            const sellerSnap = await getDoc(sellerRef);
            if (sellerSnap.exists()) setSeller(sellerSnap.data());
          }

          // 2. O'xshash mahsulotlarni yuklash (Kategoriyasi bir xil, lekin o'zi emas)
          if (productData.category) {
            const q = query(
              collection(db, "products"),
              where("category", "==", productData.category),
              limit(10)
            );
            const querySnapshot = await getDocs(q);
            const filtered = querySnapshot.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.id !== id); // Hozirgi mahsulotni chiqarib tashlash
            setSimilarProducts(filtered);
          }

          // 3. Saqlanganligini tekshirish
          if (auth.currentUser) {
            const savedRef = doc(db, `users/${auth.currentUser.uid}/saved`, id);
            const savedSnap = await getDoc(savedRef);
            setIsSaved(savedSnap.exists());
          }
        }
      } catch (error) {
        console.error("Xatolik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0); // Sahifa almashganda tepaga qaytarish
  }, [id]);

  const toggleSave = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Avval tizimga kiring!");
    const savedRef = doc(db, `users/${auth.currentUser.uid}/saved`, id);
    try {
      if (isSaved) {
        await deleteDoc(savedRef);
        setIsSaved(false);
      } else {
        await setDoc(savedRef, product);
        setIsSaved(true);
      }
    } catch (error) { console.error(error); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-purple-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      {/* Top Navigation qismi o'sha-o'sha... */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><Share2 size={18} /></button>
            <button onClick={toggleSave} className={`p-2 rounded-full transition-colors ${isSaved ? 'text-red-500' : 'text-gray-500'}`}><Heart size={20} fill={isSaved ? "currentColor" : "none"} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chap va O'ng tomonlar (Avvalgi kod bilan bir xil) */}
          <div className="lg:col-span-8 space-y-4">
             <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
               <div className="aspect-[16/9] bg-slate-50 flex items-center justify-center">
                 <img src={product.image} alt={product.title} className="w-full h-full object-contain" />
               </div>
             </div>
             <div className="bg-white rounded-xl border p-6 shadow-sm">
               <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase mb-2">
                 <MapPin size={12} /> {product.location} • {product.createdAt?.toDate().toLocaleDateString()}
               </div>
               <h1 className="text-2xl font-bold text-slate-900 mb-6">{product.title}</h1>
               <div className="border-t pt-6">
                 <h2 className="text-sm font-bold text-slate-900 uppercase mb-3 tracking-wide">Tavsif</h2>
                 <p className="text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
               </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
             <div className="bg-white rounded-xl border p-5 shadow-sm">
               <div className="text-3xl font-black text-slate-900 mb-6">{product.price?.toLocaleString()} $</div>
               <div className="space-y-3">
                 <button className="w-full bg-purple-600 text-white h-12 rounded-lg font-bold flex items-center justify-center gap-2"><Phone size={18} /> Raqamni ko'rsatish</button>
                 <button className="w-full border-2 border-purple-600 text-purple-600 h-12 rounded-lg font-bold flex items-center justify-center gap-2"><MessageCircle size={18} /> Xabar yozish</button>
               </div>
             </div>

             <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase mb-4 tracking-widest">Sotuvchi</h3>
                <div onClick={() => navigate(`/seller/${product.userId}`)} className="group flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center border overflow-hidden">
                      {seller?.photoURL ? <img src={seller.photoURL} className="w-full h-full object-cover" /> : <User size={24} className="text-purple-600" />}
                    </div>
                    <div className="font-bold text-slate-900 group-hover:text-purple-600">{seller?.displayName || 'Foydalanuvchi'}</div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </div>
             </div>
          </div>
        </div>

        {/* --- O'XSHASH MAHSULOTLAR (OLX STYLE SLIDER) --- */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">O'xshash e'lonlar</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => document.getElementById('similar-slider').scrollBy({left: -300, behavior: 'smooth'})}
                  className="p-2 bg-white border rounded-full hover:bg-gray-50 shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => document.getElementById('similar-slider').scrollBy({left: 300, behavior: 'smooth'})}
                  className="p-2 bg-white border rounded-full hover:bg-gray-50 shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div 
              id="similar-slider"
              className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {similarProducts.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="min-w-[240px] md:min-w-[280px] bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow cursor-pointer snap-start group"
                >
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full text-slate-600 hover:text-red-500 transition-colors">
                      <Heart size={16} />
                    </button>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-purple-600">{item.title}</h4>
                    <div className="text-lg font-black text-slate-900 mb-2">{item.price?.toLocaleString()} $</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                      <MapPin size={10} /> {item.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;