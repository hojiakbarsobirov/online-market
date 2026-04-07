import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { 
  Heart, Share2, MessageCircle, Phone, ArrowLeft, 
  Loader2, User, MapPin, ChevronRight, ChevronLeft
} from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showPhone, setShowPhone] = useState(false); // Telefon raqami uchun holat

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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

          // 2. O'xshash mahsulotlar
          if (productData.category) {
            const q = query(
              collection(db, "products"),
              where("category", "==", productData.category),
              limit(10)
            );
            const querySnapshot = await getDocs(q);
            const filtered = querySnapshot.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.id !== id);
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
        console.error("Ma'lumot yuklashda xatolik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
    setShowPhone(false); // Yangi mahsulotga o'tganda raqamni yashirish
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

  if (!product) return <div className="text-center py-20">Mahsulot topilmadi.</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      {/* NAVIGATION BAR */}
      <div className="bg-white border-b sticky top-0 z-[110] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><Share2 size={18} /></button>
            <button onClick={toggleSave} className={`p-2 rounded-full transition-all ${isSaved ? 'text-red-500 scale-110' : 'text-gray-500'}`}>
              <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT CONTENT: Images & Description */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="aspect-[16/10] md:aspect-[16/9] bg-slate-50 flex items-center justify-center p-4">
                <img src={product.image} alt={product.title} className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase mb-3">
                <MapPin size={12} /> {product.location} • {product.createdAt?.toDate().toLocaleDateString()}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6">{product.title}</h1>
              <div className="border-t pt-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase mb-4 tracking-widest">Tavsif</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base">{product.description}</p>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Price and Actions */}
            <div className="bg-white rounded-2xl border p-5 shadow-sm sticky top-20">
              <div className="text-3xl font-black text-slate-900 mb-6">{product.price?.toLocaleString()} $</div>
              <div className="space-y-3">
                
                {/* Phone Button */}
                <button 
                  onClick={() => setShowPhone(true)}
                  className={`w-full h-13 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                    showPhone ? "bg-green-500 text-white" : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  <Phone size={18} /> 
                  {showPhone ? product.phone || "+998 00 000-00-00" : "Raqamni ko'rsatish"}
                </button>

                {/* Chat Button */}
                <button 
                  onClick={() => {
                    if (!auth.currentUser) return alert("Avval tizimga kiring!");
                    if (auth.currentUser.uid === product.userId) return alert("O'z e'loningizga xabar yoza olmaysiz!");
                    navigate(`/chat/${product.userId}`);
                  }}
                  className="w-full border-2 border-purple-600 text-purple-600 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-50 transition-all active:scale-95"
                >
                  <MessageCircle size={18} /> Xabar yozish
                </button>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl border p-5 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-[0.2em]">Sotuvchi</h3>
              <div onClick={() => navigate(`/seller/${product.userId}`)} className="group flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                    {seller?.photoURL ? <img src={seller.photoURL} className="w-full h-full object-cover" alt="" /> : <User size={24} className="text-purple-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{seller?.displayName || 'Foydalanuvchi'}</div>
                    <div className="text-xs text-gray-400 font-medium">Profilni ko'rish</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* SIMILAR PRODUCTS SLIDER */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900">O'xshash e'lonlar</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => document.getElementById('similar-slider').scrollBy({left: -320, behavior: 'smooth'})}
                  className="p-3 bg-white border rounded-full hover:bg-purple-50 hover:border-purple-200 shadow-sm transition-all active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => document.getElementById('similar-slider').scrollBy({left: 320, behavior: 'smooth'})}
                  className="p-3 bg-white border rounded-full hover:bg-purple-50 hover:border-purple-200 shadow-sm transition-all active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div 
              id="similar-slider"
              className="flex gap-5 overflow-x-auto pb-6 no-scrollbar snap-x scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {similarProducts.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="min-w-[260px] md:min-w-[280px] bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-all cursor-pointer snap-start group border-gray-100"
                >
                  <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-purple-600 transition-colors">{item.title}</h4>
                    <div className="text-xl font-black text-purple-600 mb-3">{item.price?.toLocaleString()} $</div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                        <MapPin size={10} /> {item.location}
                      </div>
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