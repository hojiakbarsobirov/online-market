import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlinePhone, 
  HiOutlineLocationMarker, 
  HiOutlineUser, 
  HiOutlineMail,
  HiOutlineCalendar,
  HiOutlineIdentification
} from 'react-icons/hi';

const Register = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayNameParts = user?.displayName?.split(' ') || ['', ''];
  const [formData, setFormData] = useState({
    firstName: displayNameParts[0] || '',
    lastName: displayNameParts.slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    birthDate: '',
    gender: 'Erkak'
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Ismingizni kiriting';
    if (!formData.lastName.trim()) newErrors.lastName = 'Familiyangizni kiriting';
    if (!formData.phone.trim()) newErrors.phone = 'Telefon raqamingizni kiriting';
    if (!formData.address.trim()) newErrors.address = 'Manzilingizni kiriting';
    if (!formData.birthDate) newErrors.birthDate = 'Tug\'ilgan sanangizni kiriting';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      const userData = {
        uid: user.uid,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        displayName: user.displayName || `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        photoURL: user.photoURL || '',
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", user.uid), userData);
      navigate('/');
      window.location.reload();
    } catch (error) {
      alert("❌ Xatolik yuz berdi.");
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (!value.startsWith('998')) value = '998' + value;
    value = value.slice(0, 12);
    let formatted = '+998';
    if (value.length > 3) formatted += ' ' + value.slice(3, 5);
    if (value.length > 5) formatted += ' ' + value.slice(5, 8);
    if (value.length > 8) formatted += ' ' + value.slice(8, 10);
    if (value.length > 10) formatted += ' ' + value.slice(10, 12);
    setFormData({...formData, phone: formatted});
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-white">Yuklanmoqda...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* BRANDING SIDE */}
      <div className="md:w-1/3 bg-purple-600 p-12 text-white flex flex-col justify-center items-center text-center">
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 border border-white/20">
          <HiOutlineUser size={48} />
        </div>
        <h2 className="text-4xl font-black mb-4">Xush kelibsiz!</h2>
        <p className="text-purple-100 text-lg leading-relaxed">
          Online do'konimizga a'zo bo'lish uchun profilingizni yakunlang.
        </p>
      </div>

      {/* FORM SIDE */}
      <div className="md:w-2/3 p-8 md:p-20 bg-white">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Profilni yaratish</h1>
          <p className="text-gray-500 mb-10 text-lg font-medium">Barcha maydonlarni to'ldirish majburiy</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase">Ism</label>
                <div className="relative">
                  <HiOutlineIdentification className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-purple-600 focus:bg-white font-semibold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase">Familiya</label>
                <div className="relative">
                  <HiOutlineIdentification className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-purple-600 focus:bg-white font-semibold" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase">Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="email" readOnly value={formData.email} className="w-full p-4 pl-12 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 cursor-not-allowed font-semibold" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase">Telefon</label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="tel" required value={formData.phone} onChange={handlePhoneChange} className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-purple-600 font-semibold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase">Tug'ilgan sana</label>
                <div className="relative">
                  <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="date" required value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-purple-600 font-semibold" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 uppercase">Jins</label>
              <div className="flex space-x-6">
                {['Erkak', 'Ayol'].map(g => (
                  <label key={g} className="flex items-center space-x-2 cursor-pointer group">
                    <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-5 h-5 text-purple-600 border-gray-300 focus:ring-0" />
                    <span className="text-gray-700 font-bold group-hover:text-purple-600">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase">Manzil</label>
              <div className="relative">
                <HiOutlineLocationMarker className="absolute left-4 top-4 text-gray-400" size={20} />
                <textarea required rows="3" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-purple-600 font-semibold resize-none"></textarea>
              </div>
            </div>

            <button disabled={isSubmitting} type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white p-5 rounded-2xl font-black text-xl transition-all active:scale-[0.98] disabled:opacity-70 mt-4">
              {isSubmitting ? 'SAQLANMOQDA...' : 'KIRISH'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;