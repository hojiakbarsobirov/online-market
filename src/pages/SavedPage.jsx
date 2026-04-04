import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ShoppingBag, 
  Loader2, 
  Clock, 
  Trash2,
  Eye,
  ChevronLeft,
  AlertTriangle,
  X
} from 'lucide-react';

const SavedPage = () => {
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const savedRef = collection(db, `users/${user.uid}/saved`);
        const unsubscribeSnapshot = onSnapshot(savedRef, (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setSavedProducts(items);
          setLoading(false);
        }, (error) => {
          console.error("Firestore xatoligi:", error);
          setLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Modalni ochish funksiyasi
  const openDeleteModal = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setProductToDelete(product);
    setIsModalOpen(true);
  };

  // Haqiqiy o'chirish funksiyasi
  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, `users/${user.uid}/saved`, productToDelete.id));
        setIsModalOpen(false);
        setProductToDelete(null);
      }
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
      alert("Xatolik yuz berdi");
    }
  };

  if (!loading && !auth.currentUser) {
    return (
      <div className="min-h-screen bg-[#f2f4f5] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-md w-full">
          <Heart size={40} className="text-purple-200 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-[#002f34] mb-2">Tizimga kiring</h2>
          <button onClick={() => navigate('/')} className="w-full bg-purple-600 text-white px-8 py-4 rounded-xl font-bold mt-6">
            Asosiy sahifaga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-6 px-4 md:px-10 relative">
      {/* --- DELETE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002f34]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl transform transition-all scale-100">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-black text-[#002f34] text-center mb-2">E'lonni o'chirasizmi?</h3>
            <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
               <span className="font-bold text-gray-800">"{productToDelete?.title}"</span> saqlanganlar ro'yxatidan o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-colors">
                Ha, o'chirilsin
              </button>
              <button onClick={() => setIsModalOpen(false)} className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-purple-600 mb-2 font-bold text-sm">
            <ChevronLeft size={18} /> Orqaga
          </button>
          <h1 className="text-3xl font-black text-[#002f34]">Saralangan e'lonlar</h1>
          <p className="text-sm text-gray-500 font-bold uppercase mt-1">{savedProducts.length} ta mahsulot</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="animate-spin text-purple-600" size={48} />
          </div>
        ) : savedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {savedProducts.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group flex flex-col relative">
                <div className="relative aspect-[4/3] overflow-hidden" onClick={() => navigate(`/product/${item.id}`)}>
                  <img src={item.image || 'https://via.placeholder.com/400'} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-sm font-bold text-[#002f34] line-clamp-2 h-10 mb-2">{item.title}</h3>
                  <div className="mt-auto">
                    <p className="text-lg font-black text-[#002f34] mb-2">{item.price?.toLocaleString()} $</p>
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      <button onClick={() => navigate(`/product/${item.id}`)} className="col-span-4 bg-purple-600 text-white py-2.5 rounded-md font-bold text-xs flex items-center justify-center space-x-2">
                        <Eye size={14} /> <span>Ko'rish</span>
                      </button>
                      <button onClick={(e) => openDeleteModal(e, item)} className="col-span-1 bg-gray-50 text-gray-400 rounded-md flex items-center justify-center border border-gray-100 hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 flex flex-col items-center text-center border border-gray-100">
            <ShoppingBag className="text-gray-200 mb-6" size={48} />
            <h3 className="text-2xl font-black text-[#002f34]">Saqlanganlar bo'sh</h3>
            <button onClick={() => navigate('/')} className="mt-8 bg-[#002f34] text-white px-10 py-4 rounded-xl font-black">
              E'lonlarni ko'rish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPage;