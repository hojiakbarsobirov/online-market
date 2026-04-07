import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import {
  collection, query, where, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc, setDoc,
  orderBy, deleteDoc, updateDoc, getDocs
} from 'firebase/firestore';
import {
  Send, User, ArrowLeft, Loader2, MessageSquare,
  Search, CheckCheck, Trash2, X, AlertTriangle
} from 'lucide-react';

/* ─── Delete Modal Component ─── */
const DeleteModal = ({ type, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    />

    {/* Modal */}
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-modal">
      {/* Icon */}
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={26} className="text-red-500" />
      </div>

      <h3 className="text-center font-black text-slate-800 text-lg mb-1">
        {type === 'message' ? "Xabarni o'chirasizmi?" : "Chatni o'chirasizmi?"}
      </h3>
      <p className="text-center text-sm text-gray-400 mb-6">
        {type === 'message'
          ? "Bu xabar butunlay o'chib ketadi. Bu amalni qaytarib bo'lmaydi."
          : "Barcha xabarlar va suhbat tarixi o'chib ketadi. Bu amalni qaytarib bo'lmaydi."
        }
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-bold text-sm hover:bg-gray-50 transition-colors"
        >
          Bekor qilish
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          O'chirish
        </button>
      </div>
    </div>
  </div>
);

/* ─── Notification Badge ─── */
const NotifBadge = ({ count }) => {
  if (!count) return null;
  return (
    <span className="min-w-[20px] h-5 px-1.5 bg-purple-600 text-white text-[11px] font-black rounded-full flex items-center justify-center animate-bounce-in shadow-md shadow-purple-200">
      {count > 99 ? '99+' : count}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN ChatPage
═══════════════════════════════════════════════════════ */
const ChatPage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [activeChat, setActiveChat] = useState(sellerId || null);
  const [activeChatInfo, setActiveChatInfo] = useState(null);
  const [userInfoCache, setUserInfoCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Unread counts per room
  const [unreadCounts, setUnreadCounts] = useState({});

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(null);
  // { type: 'message' | 'chat', messageId?: string, chatId?: string }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Hover on message
  const [hoveredMsg, setHoveredMsg] = useState(null);

  const scrollRef = useRef();
  const inputRef = useRef();

  /* ─── 1. Chat ro'yxati ─── */
  useEffect(() => {
    if (!auth.currentUser) { setLoading(false); return; }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rooms = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const sorted = rooms.sort((a, b) =>
        (b.lastMessageTime?.seconds || 0) - (a.lastMessageTime?.seconds || 0)
      );

      // Foydalanuvchi ma'lumotlarini cache
      const cache = { ...userInfoCache };
      await Promise.all(sorted.map(async (room) => {
        const otherId = room.participants?.find((p) => p !== auth.currentUser.uid);
        if (otherId && !cache[otherId]) {
          try {
            const snap = await getDoc(doc(db, 'users', otherId));
            cache[otherId] = snap.exists() ? snap.data() : { displayName: 'Foydalanuvchi' };
          } catch {
            cache[otherId] = { displayName: 'Foydalanuvchi' };
          }
        }
      }));

      // Unread count — oxirgi xabar men yubormagan bo'lsa va ko'rilmagan bo'lsa
      const counts = {};
      sorted.forEach((room) => {
        const otherId = room.participants?.find((p) => p !== auth.currentUser.uid);
        const isMyLast = room.lastSenderId === auth.currentUser.uid;
        const isActive = activeChat === otherId;
        if (!isMyLast && !isActive && room.unreadCount) {
          counts[room.id] = room.unreadCount;
        }
      });

      setUserInfoCache(cache);
      setChatRooms(sorted);
      setUnreadCounts(counts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeChat]);

  /* ─── 2. Aktiv chat info ─── */
  useEffect(() => {
    if (!activeChat) return;
    if (userInfoCache[activeChat]) {
      setActiveChatInfo(userInfoCache[activeChat]);
      return;
    }
    const fetchInfo = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', activeChat));
        const data = snap.exists() ? snap.data() : { displayName: 'Foydalanuvchi' };
        setActiveChatInfo(data);
        setUserInfoCache((prev) => ({ ...prev, [activeChat]: data }));
      } catch {
        setActiveChatInfo({ displayName: 'Foydalanuvchi' });
      }
    };
    fetchInfo();
  }, [activeChat]);

  /* ─── 3. Xabarlar ─── */
  useEffect(() => {
    if (!auth.currentUser || !activeChat) { setMessages([]); return; }

    const chatId = [auth.currentUser.uid, activeChat].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.createdAt)
        .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

      setMessages(msgs);

      // Unread reset — aktiv chatda unread ni 0 ga tushirish
      const chatDocId = [auth.currentUser.uid, activeChat].sort().join('_');
      setDoc(doc(db, 'chats', chatDocId), { unreadCount: 0 }, { merge: true }).catch(() => {});

      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    });

    return () => unsubscribe();
  }, [activeChat]);

  /* ─── 4. URL ─── */
  useEffect(() => {
    if (sellerId && sellerId !== auth.currentUser?.uid) {
      setActiveChat(sellerId);
    }
  }, [sellerId]);

  /* ─── 5. Xabar yuborish ─── */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !auth.currentUser || !activeChat || sending) return;

    const myId = auth.currentUser.uid;
    const chatId = [myId, activeChat].sort().join('_');
    const msgText = message.trim();
    setMessage('');
    setSending(true);

    try {
      // Unread count oshirish — boshqa foydalanuvchi uchun
      const chatDocRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatDocRef);
      const currentUnread = chatSnap.exists() ? (chatSnap.data().unreadCount || 0) : 0;

      await setDoc(chatDocRef, {
        participants: [myId, activeChat],
        lastMessage: msgText,
        lastMessageTime: serverTimestamp(),
        lastSenderId: myId,
        unreadCount: currentUnread + 1,
      }, { merge: true });

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: msgText,
        senderId: myId,
        createdAt: serverTimestamp(),
      });

      inputRef.current?.focus();
    } catch (error) {
      console.error('Xabar yuborishda xatolik:', error);
    } finally {
      setSending(false);
    }
  };

  /* ─── 6. Xabarni o'chirish ─── */
  const handleDeleteMessage = async () => {
    if (!deleteModal?.messageId) return;
    setDeleteLoading(true);
    try {
      const chatId = [auth.currentUser.uid, activeChat].sort().join('_');
      await deleteDoc(doc(db, 'chats', chatId, 'messages', deleteModal.messageId));

      // Oxirgi xabarni yangilash
      const msgsSnap = await getDocs(
        query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'desc'))
      );
      if (!msgsSnap.empty) {
        const last = msgsSnap.docs[0].data();
        await setDoc(doc(db, 'chats', chatId), {
          lastMessage: last.text,
          lastMessageTime: last.createdAt,
          lastSenderId: last.senderId,
        }, { merge: true });
      } else {
        await setDoc(doc(db, 'chats', chatId), {
          lastMessage: '',
          lastMessageTime: null,
        }, { merge: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setDeleteModal(null);
    }
  };

  /* ─── 7. Chatni o'chirish ─── */
  const handleDeleteChat = async () => {
    if (!deleteModal?.chatId) return;
    setDeleteLoading(true);
    try {
      const chatId = deleteModal.chatId;

      // Barcha xabarlarni o'chirish
      const msgsSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
      await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));

      // Chat xonasini o'chirish
      await deleteDoc(doc(db, 'chats', chatId));

      setActiveChat(null);
      navigate('/chats', { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setDeleteModal(null);
    }
  };

  /* ─── 8. Vaqt formati ─── */
  const formatTime = (timestamp) => {
    if (!timestamp?.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
  };

  /* ─── 9. Filter ─── */
  const filteredRooms = chatRooms.filter((room) => {
    if (!searchQuery.trim()) return true;
    const otherId = room.participants?.find((p) => p !== auth.currentUser?.uid);
    const name = userInfoCache[otherId]?.displayName || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  /* ─── Auth check ─── */
  if (!auth.currentUser) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-white gap-4">
        <MessageSquare size={48} className="text-purple-200" />
        <h2 className="text-xl font-black text-slate-700">Chatlarni ko'rish uchun kiring</h2>
        <button onClick={() => navigate('/')} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition">
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  /* ─── Active chat ID helper ─── */
  const activeChatId = activeChat
    ? [auth.currentUser.uid, activeChat].sort().join('_')
    : null;

  return (
    <>
      {/* CSS animations */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes bounceIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modal   { animation: modalIn  0.22s cubic-bezier(.34,1.56,.64,1) both; }
        .animate-bounce-in{ animation: bounceIn 0.3s cubic-bezier(.34,1.56,.64,1) both; }
        .msg-actions { opacity: 0; transition: opacity 0.15s; }
        .msg-row:hover .msg-actions { opacity: 1; }
      `}</style>

      {/* Delete Modal */}
      {deleteModal && (
        <DeleteModal
          type={deleteModal.type}
          loading={deleteLoading}
          onCancel={() => setDeleteModal(null)}
          onConfirm={deleteModal.type === 'message' ? handleDeleteMessage : handleDeleteChat}
        />
      )}

      <div className="flex h-[calc(100vh-80px)] bg-white overflow-hidden">

        {/* ═══════════ SIDEBAR ═══════════ */}
        <div className={`
          ${activeChat ? 'hidden md:flex' : 'flex'}
          flex-col w-full md:w-[340px] flex-shrink-0
          border-r border-gray-100 bg-white
        `}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-black text-slate-800 mb-3">Xabarlar</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Rooms list */}
          <div className="flex-1 overflow-y-auto">
            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                <MessageSquare size={44} className="text-gray-200 mb-3" />
                <p className="text-sm font-semibold text-gray-400">
                  {searchQuery ? 'Natija topilmadi' : "Hozircha xabarlar yo'q"}
                </p>
                {!searchQuery && (
                  <p className="text-xs text-gray-300 mt-1">
                    Mahsulot sahifasida "Xabar yozish" tugmasini bosing
                  </p>
                )}
              </div>
            ) : (
              filteredRooms.map((room) => {
                const otherId = room.participants?.find((p) => p !== auth.currentUser.uid);
                const otherUser = userInfoCache[otherId] || {};
                const isActive = activeChat === otherId;
                const isMyLast = room.lastSenderId === auth.currentUser.uid;
                const unread = unreadCounts[room.id] || 0;

                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      setActiveChat(otherId);
                      navigate(`/chat/${otherId}`, { replace: true });
                    }}
                    className={`
                      group flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all
                      border-b border-gray-50
                      ${isActive
                        ? 'bg-purple-50 border-l-[3px] border-l-purple-600'
                        : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                      }
                    `}
                  >
                    {/* Avatar + unread dot */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                        {otherUser.photoURL ? (
                          <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={22} className="text-purple-400" />
                        )}
                      </div>
                      {/* Online dot */}
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-bold text-sm truncate ${unread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {otherUser.displayName || 'Foydalanuvchi'}
                        </span>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <span className="text-[10px] text-gray-400">
                            {formatTime(room.lastMessageTime)}
                          </span>
                          {/* 🔔 Notification badge */}
                          <NotifBadge count={unread} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isMyLast && <CheckCheck size={12} className="text-purple-400 shrink-0" />}
                        <p className={`text-xs truncate ${unread ? 'font-semibold text-slate-600' : 'text-gray-400'}`}>
                          {room.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══════════ MAIN ═══════════ */}
        <div className={`${!activeChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[#f8f9ff]`}>
          {activeChat ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-100 shadow-sm z-10">
                <button
                  onClick={() => { setActiveChat(null); navigate('/chats', { replace: true }); }}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                >
                  <ArrowLeft size={20} className="text-slate-600" />
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white overflow-hidden shadow shrink-0">
                  {activeChatInfo?.photoURL ? (
                    <img src={activeChatInfo.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={18} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-black text-slate-800 text-sm leading-tight">
                    {activeChatInfo?.displayName || 'Yuklanmoqda...'}
                  </div>
                  <div className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</div>
                </div>

                {/* 🗑 Chat o'chirish */}
                <button
                  onClick={() => setDeleteModal({ type: 'chat', chatId: activeChatId })}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors group"
                  title="Chatni o'chirish"
                >
                  <Trash2 size={18} className="text-gray-300 group-hover:text-red-400 transition-colors" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                      <MessageSquare size={28} className="text-gray-200" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">Suhbatni boshlang!</p>
                    <p className="text-xs text-gray-300 mt-1">Birinchi xabaringizni yuboring</p>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === auth.currentUser.uid;
                  const prevMsg = messages[idx - 1];
                  const showTime =
                    !prevMsg ||
                    (msg.createdAt?.seconds || 0) - (prevMsg.createdAt?.seconds || 0) > 300;

                  return (
                    <div key={msg.id}>
                      {showTime && msg.createdAt && (
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[10px] text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      )}

                      {/* Xabar qatori */}
                      <div className={`msg-row flex items-end gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>

                        {/* Boshqa foydalanuvchi avatari */}
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden mb-0.5">
                            {activeChatInfo?.photoURL ? (
                              <img src={activeChatInfo.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={13} className="text-purple-400" />
                            )}
                          </div>
                        )}

                        {/* 🗑 O'chirish tugmasi — faqat o'z xabarlari */}
                        {isMe && (
                          <button
                            className="msg-actions p-1.5 hover:bg-red-100 rounded-full transition-colors mb-0.5"
                            onClick={() => setDeleteModal({ type: 'message', messageId: msg.id })}
                            title="Xabarni o'chirish"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        )}

                        {/* Bubble */}
                        <div
                          className={`
                            max-w-[72%] md:max-w-[60%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl shadow-sm
                            ${isMe
                              ? 'bg-purple-600 text-white rounded-tr-sm'
                              : 'bg-white text-slate-700 rounded-tl-sm border border-gray-100'
                            }
                          `}
                        >
                          <p>{msg.text}</p>
                          {isMe && (
                            <div className="flex justify-end mt-0.5">
                              <CheckCheck size={12} className="text-purple-300" />
                            </div>
                          )}
                        </div>

                        {/* O'chirish — boshqa foydalanuvchi xabarlari (ixtiyoriy) */}
                        {!isMe && (
                          <button
                            className="msg-actions p-1.5 hover:bg-red-100 rounded-full transition-colors mb-0.5"
                            onClick={() => setDeleteModal({ type: 'message', messageId: msg.id })}
                            title="Xabarni o'chirish"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Xabar yozing..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 focus:bg-white focus:outline-none transition-all"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="bg-purple-600 text-white p-3 rounded-2xl hover:bg-purple-700 disabled:opacity-40 shadow-md shadow-purple-200 transition-all active:scale-90 shrink-0"
                >
                  {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border border-gray-100">
                <MessageSquare size={36} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-black text-slate-600 mb-1">Suhbatni tanlang</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Chap tarafdagi ro'yxatdan biror suhbatni tanlang yoki mahsulot sahifasidan "Xabar yozish" tugmasini bosing
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;