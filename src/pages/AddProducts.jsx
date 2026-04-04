import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Image as ImageIcon, 
  Type, 
  Tag, 
  DollarSign, 
  AlignLeft, 
  Loader2,
  Camera
} from 'lucide-react';

const categories = [
  { id: 'dog', name: 'Kuchuklar' },
  { id: 'cat', name: 'Mushuklar' },
  { id: 'bird', name: 'Qushlar' },
  { id: 'fish', name: 'Baliqlar' },
  { id: 'other', name: 'Boshqalar' },
];

const AddProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    currency: 'USD', // Valyuta uchun yangi maydon
    category: 'dog',
    description: '',
    image: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Avval tizimga kiring!");
    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        ...formData,
        price: Number(formData.price),
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      navigate('/');
    } catch (error) {
      alert("Xatolik: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-4 px-4 sm:px-10">
      <div className="w-full mx-auto">
        {/* Sarlavha - OLX style */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#002f34]">E'lon joylashtirish</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Rasm bo'limi */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className=" font-bold text-[#002f34] mb-4 uppercase text-sm tracking-wider">Rasmlar</h2>
            <div className="flex flex-wrap gap-4">
              <div className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 transition-colors cursor-pointer">
                <Camera size={24} />
                <span className="text-[10px] mt-2 font-bold">Rasm qo'shish</span>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Rasm URL manzili</label>
                <input
                  required
                  type="text"
                  name="image"
                  placeholder="https://link-to-image.jpg"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#002f34] outline-none transition-all"
                />
              </div>
              {formData.image && (
                <div className="w-32 h-32 rounded overflow-hidden border border-gray-100">
                  <img src={formData.image} className="w-full h-full object-cover" alt="preview" />
                </div>
              )}
            </div>
          </div>

          {/* 2. Asosiy ma'lumotlar */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className=" font-bold text-[#002f34] mb-4 uppercase text-sm tracking-wider">Bizga batafsil so'zlab bering</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">E'lon sarlavhasi*</label>
                <input
                  required
                  type="text"
                  name="title"
                  placeholder="Masalan, Britan mushugi sotiladi"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#002f34] outline-none transition-all"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Kamida 10 ta belgi kiriting</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Kategoriya*</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded text-sm font-bold text-[#002f34] outline-none"
                  >
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Narxi*</label>
                  <div className="flex">
                    {/* Valyuta tanlash (USD yoki UZS) */}
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="p-4 bg-gray-100 border border-gray-200 border-r-0 rounded-l text-sm font-bold text-[#002f34] outline-none cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="UZS">UZS (so'm)</option>
                    </select>
                    
                    <input
                      required
                      type="number"
                      name="price"
                      placeholder="Narxi"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-r text-sm focus:border-[#002f34] outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Tavsif*</label>
                <textarea
                  required
                  name="description"
                  rows="5"
                  placeholder="Hayvonning holati, yoshi va boshqa ma'lumotlar..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#002f34] outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          {/* 3. Action Button */}
          <div className="flex justify-end pt-4">
            <button
              disabled={loading}
              type="submit"
              className={`px-10 py-4 rounded font-bold text-sm transition-all flex items-center space-x-2 border-2 ${
                loading 
                ? 'bg-gray-100 text-gray-400 border-gray-100' 
                : 'bg-purple-600 text-white hover:border-2 border-purple-800 hover:bg-white hover:text-purple-800'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
              <span>E'lonni joylashtirish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProducts;