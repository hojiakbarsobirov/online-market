import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  Eye, 
  Heart, 
  Clock, 
  Loader2, 
  AlertTriangle,
  PackageSearch
} from 'lucide-react';

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null); // O'chiriladigan mahsulot ID si
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    // 1. Faqat foydalanuvchiga tegishli mahsulotlarni olish
    const q = query(
      collection(db, "products"), 
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items = [];
      
      for (const productDoc of snapshot.docs) {
        const productData = productDoc.data();
        
        // 2. Har bir mahsulot uchun saqlanganlar sonini hisoblash
        // (Eslatma: Bu kichik loyihalar uchun, katta loyihalarda counter ishlatish tavsiya etiladi)
        const savedQuery = query(collection(db, `users/${auth.currentUser.uid}/saved`), where("id", "==", productDoc.id));
        // Haqiqiy saqlanganlar sonini bilish uchun barcha userlarni aylanib chiqish o'rniga 
        // mahsulotning o'zida 'savedCount' maydoni bo'lgani ma'qul. 
        // Hozircha asosiy ma'lumotlarni chiqaramiz.

        items.push({
          id: productDoc.id,
          ...productData,
          // Agar bazada bu maydonlar bo'lmasa 0 ko'rsatadi
          views: productData.views || 0,
          savedCount: productData.savedCount || 0 
        });
      }
      
      setProducts(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Mahsulotni o'chirish funksiyasi
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "products", deleteId));
      setShowModal(false);
      setDeleteId(null);
    } catch (error) {
      alert("O'chirishda xatolik: " + error.message);
    }
  };

  const openDeleteModal = (e, id) => {
    e.stopPropagation();
    setDeleteId(id);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f4f5]">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-[#f2f4f5] min-h-screen py-8 px-4 md:px-10">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-[#002f34]">Mening e'lonlarim</h1>
          <span className="bg-white px-4 py-2 rounded-full text-sm font-bold text-gray-600 shadow-sm border">
            Jami: {products.length} ta
          </span>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative h-48 bg-gray-100">
                  <img 
                    src={item.image || 'https://via.placeholder.com/400'} 
                    className="w-full h-full object-cover" 
                    alt={item.title} 
                  />
                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded font-bold uppercase">
                    {item.category}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#002f34] mb-2 line-clamp-1">{item.title}</h3>
                  <p className="text-xl font-black text-[#002f34] mb-4">
                    {item.price?.toLocaleString()} {item.currency === 'UZS' ? "so'm" : "$"}
                  </p>

                  {/* Statistika qismi */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-50 p-2 rounded flex items-center justify-center space-x-2 border border-gray-100">
                      <Eye size={16} className="text-blue-500" />
                      <span className="text-sm font-bold">{item.views}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded flex items-center justify-center space-x-2 border border-gray-100">
                      <Heart size={16} className="text-red-500" />
                      <span className="text-sm font-bold">{item.savedCount}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex space-x-2">
                    <button 
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#002f34] py-2 rounded font-bold text-sm transition-colors"
                    >
                      Ko'rish
                    </button>
                    <button 
                      onClick={(e) => openDeleteModal(e, item.id)}
                      className="px-4 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded transition-colors border border-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-20 flex flex-col items-center text-center shadow-sm border border-gray-200">
            <PackageSearch className="text-gray-200 mb-4" size={80} />
            <h3 className="text-xl font-bold text-[#002f34]">Sizda hali e'lonlar yo'q</h3>
            <p className="text-gray-500 mt-2 text-sm max-w-xs">
              Sotmoqchi bo'lgan hayvonlaringizni e'lon sifatida joylashtiring.
            </p>
            <button 
              onClick={() => navigate('/add-product')}
              className="mt-6 bg-purple-600 text-white px-8 py-3 rounded-md font-bold hover:bg-purple-700 transition-all"
            >
              E'lon berish
            </button>
          </div>
        )}
      </div>

      {/* O'CHIRISH UCHUN MODAL OYNA */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#002f34] text-center mb-2">E'lonni o'chirib tashlamoqchimisiz?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Bu amalni ortga qaytarib bo'lmaydi. E'lon barcha ma'lumotlari bilan birga o'chib ketadi.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
              >
                Ha, o'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProducts;