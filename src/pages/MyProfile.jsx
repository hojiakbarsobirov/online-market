import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  HiOutlinePhone, 
  HiOutlineLocationMarker, 
  HiOutlineMail,
  HiOutlineCalendar,
  HiOutlineIdentification,
  HiPencil,
  HiCheck,
  HiX
} from 'react-icons/hi';

const MyProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, "users", auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            setEditData(data);
          }
        } catch (error) {
          console.error("Ma'lumotlarni yuklashda xatolik:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setEditData(userData);
    setIsEditing(false);
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
    setEditData({...editData, phone: formatted});
  };

  const handleSave = async () => {
    if (!editData.firstName?.trim() || !editData.lastName?.trim() || 
        !editData.phone?.trim() || !editData.address?.trim()) {
      alert('❌ Barcha majburiy maydonlarni to\'ldiring!');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      const updatedData = {
        ...editData,
        fullName: `${editData.firstName} ${editData.lastName}`,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, updatedData);
      setUserData(updatedData);
      setIsEditing(false);
      alert('✅ Ma\'lumotlar yangilandi!');
    } catch (error) {
      alert('❌ Xatolik yuz berdi!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Kiritilmagan';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-full">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-100 overflow-hidden">
          <div className="h-48 bg-purple-600 relative">
            <div className="absolute -bottom-16 left-10">
              <div className="relative">
                <img 
                  src={userData.photoURL || 'https://via.placeholder.com/150'} 
                  className="w-36 h-36 rounded-full border-4 border-white object-cover" 
                  alt="Avatar" 
                />
                <div className="absolute bottom-3 right-3 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="pt-20 px-10 pb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-4xl font-black text-gray-900 mb-2">
                  {userData.fullName || `${userData.firstName} ${userData.lastName}`}
                </h1>
                <p className="text-gray-500 font-medium flex items-center space-x-2 text-lg">
                  <HiOutlineMail size={22} />
                  <span>{userData.email}</span>
                </p>
              </div>
              {!isEditing && (
                <button onClick={handleEdit} className="mt-6 md:mt-0 flex items-center justify-center space-x-2 bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold active:scale-95 transition-all">
                  <HiPencil size={20} />
                  <span>Tahrirlash</span>
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <span className="px-5 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-bold border border-purple-100">
                👤 Mijoz
              </span>
              <span className="px-5 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-100">
                {userData.gender === 'Erkak' ? '👨 Erkak' : '👩 Ayol'}
              </span>
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center space-x-3">
            <HiOutlineIdentification size={32} className="text-purple-600" />
            <span>Shaxsiy ma'lumotlar</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: 'Ism', key: 'firstName', icon: <HiOutlineIdentification /> },
              { label: 'Familiya', key: 'lastName', icon: <HiOutlineIdentification /> },
              { label: 'Telefon', key: 'phone', icon: <HiOutlinePhone />, type: 'tel' },
              { label: 'Tug\'ilgan sana', key: 'birthDate', icon: <HiOutlineCalendar />, type: 'date' }
            ].map((item) => (
              <div key={item.key} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center space-x-1">
                  {item.icon} <span>{item.label}</span>
                </p>
                {isEditing ? (
                  <input
                    type={item.type || 'text'}
                    value={editData[item.key]}
                    onChange={(e) => item.key === 'phone' ? handlePhoneChange(e) : setEditData({...editData, [item.key]: e.target.value})}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-semibold"
                  />
                ) : (
                  <p className="text-gray-900 font-bold text-xl">
                    {item.key === 'birthDate' ? formatDate(userData[item.key]) : userData[item.key]}
                  </p>
                )}
              </div>
            ))}

            <div className="md:col-span-2 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center space-x-1">
                <HiOutlineLocationMarker /> <span>Yetkazib berish manzili</span>
              </p>
              {isEditing ? (
                <textarea
                  rows="3"
                  value={editData.address}
                  onChange={(e) => setEditData({...editData, address: e.target.value})}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-semibold resize-none"
                />
              ) : (
                <p className="text-gray-900 font-bold text-xl">{userData.address || 'Kiritilmagan'}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex flex-col md:flex-row gap-4 mt-10">
              <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white p-5 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-70">
                {saving ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><HiCheck size={24} /> <span>Saqlash</span></>}
              </button>
              <button onClick={handleCancel} disabled={saving} className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 text-gray-700 p-5 rounded-2xl font-bold transition-all active:scale-95">
                <HiX size={24} /> <span>Bekor qilish</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;