import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dog, Cat, Bird, Fish, LayoutGrid, Rabbit, 
  Eye, Loader2, Heart, MapPin, Clock 
} from 'lucide-react';

const categories = [
  { id: 'all', name: 'Hammasi', icon: <LayoutGrid size={16} /> },
  { id: 'dog', name: 'Kuchuklar', icon: <Dog size={16} /> },
  { id: 'cat', name: 'Mushuklar', icon: <Cat size={16} /> },
  { id: 'bird', name: 'Qushlar', icon: <Bird size={16} /> },
  { id: 'fish', name: 'Baliqlar', icon: <Fish size={16} /> },
  { id: 'other', name: 'Boshqalar', icon: <Rabbit size={16} /> },
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [savedIds, setSavedIds] = useState([]); // Saqlangan mahsulot ID lari
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Mahsulotlarni yuklash
  useEffect(() => {
    setLoading(true);
    let q = selectedCategory === 'all' 
      ? collection(db, "products") 
      : query(collection(db, "products"), where("category", "==", selectedCategory));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedCategory]);

  // 2. Foydalanuvchining saqlangan mahsulotlarini kuzatish
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = collection(db, `users/${auth.currentUser.uid}/saved`);
    const unsubSaved = onSnapshot(q, (snapshot) => {
      setSavedIds(snapshot.docs.map(doc => doc.id));
    });
    return () => unsubSaved();
  }, []);

  // 3. Saqlash funksiyasi
  const toggleSave = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (!auth.currentUser) return alert("Avval tizimga kiring!");

    const savedDocRef = doc(db, `users/${auth.currentUser.uid}/saved`, item.id);
    
    if (savedIds.includes(item.id)) {
      await deleteDoc(savedDocRef);
    } else {
      await setDoc(savedDocRef, { ...item, savedAt: new Date() });
    }
  };

  return (
    <div className="bg-[#f2f4f5] min-h-screen">
      {/* KATEGORIYALAR (OLX Style - Ixcham) */}
      <div className="bg-white border-b sticky top-[70px] md:top-[80px] z-40 w-full shadow-sm">
        <div className="max-w-full mx-auto px-4 md:px-10 py-3">
          <div className="flex space-x-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all text-sm font-bold border ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-[#002f34] border-transparent hover:bg-gray-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-full mx-auto px-4 md:px-10 py-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <Loader2 className="animate-spin text-purple-600" size={40} />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((item) => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/product/${item.id}`)}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group relative flex flex-col"
              >
                {/* Rasm qismi */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img 
                    src={item.image || 'https://via.placeholder.com/400'} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Saqlash (Heart) tugmasi */}
                  <button 
                    onClick={(e) => toggleSave(e, item)}
                    className="absolute bottom-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
                  >
                    <Heart 
                      size={20} 
                      className={savedIds.includes(item.id) ? "fill-red-500 text-red-500" : "text-gray-600"} 
                    />
                  </button>
                </div>

                {/* Ma'lumot qismi */}
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-sm md:text-base font-semibold text-[#002f34] line-clamp-2 leading-tight h-10 md:h-12 mb-1">
                    {item.title}
                  </h3>
                  
                  <div className="mt-auto">
                    {/* NARX VA DINAMIK VALYUTA QISMI */}
                    <p className="text-lg font-black text-[#002f34] mb-1">
                      {Number(item.price).toLocaleString()} {item.currency === 'UZS' ? "so'm" : "$"}
                    </p>
                    
                    <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-tighter space-x-2">
                      <span className="truncate max-w-[80px]">{item.category}</span>
                      <span>•</span>
                      <span className="flex items-center"><Clock size={10} className="mr-1"/> Bugun</span>
                    </div>

                    <button className="w-full mt-3 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition-colors font-bold text-xs flex items-center justify-center space-x-1">
                      <Eye size={14} />
                      <span>Batafsil</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-20 flex flex-col items-center text-center shadow-sm border border-gray-200">
            <LayoutGrid className="text-gray-200 mb-4" size={64} />
            <h3 className="text-xl font-bold text-[#002f34]">E'lonlar topilmadi</h3>
            <p className="text-gray-500 mt-2 text-sm">Ushbu bo'limda hozircha hech narsa yo'q.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;