import React, { useState } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Image, Paperclip, Smile } from 'lucide-react';
import { motion } from 'motion/react';

const CONTACTS = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Landlord",
    lastMessage: "The keys are ready for pickup tomorrow at 10 AM.",
    time: "2m ago",
    unread: 2,
    online: true,
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    id: 2,
    name: "Metro City Housing",
    role: "Agency",
    lastMessage: "Your application for Modern Studio has been approved!",
    time: "1h ago",
    unread: 0,
    online: false,
    avatar: "https://i.pravatar.cc/150?u=metro"
  },
  {
    id: 3,
    name: "David Smith",
    role: "Landlord",
    lastMessage: "Is the security deposit already sent?",
    time: "3h ago",
    unread: 0,
    online: true,
    avatar: "https://i.pravatar.cc/150?u=david"
  }
];

export const Messages = () => {
  const [activeChat, setActiveChat] = useState(CONTACTS[0]);
  const [message, setMessage] = useState('');

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm flex h-[calc(100vh-200px)] overflow-hidden">
      {/* Contact List */}
      <div className="w-80 border-r border-slate-50 flex flex-col">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {CONTACTS.map(contact => (
            <button
              key={contact.id}
              onClick={() => setActiveChat(contact)}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${
                activeChat.id === contact.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'
              }`}
            >
              <div className="relative">
                <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                {contact.online && (
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className={`font-bold text-sm truncate ${activeChat.id === contact.id ? 'text-white' : 'text-slate-900'}`}>
                    {contact.name}
                  </h4>
                  <span className="text-[10px] opacity-60">{contact.time}</span>
                </div>
                <p className="text-[10px] truncate opacity-80">{contact.lastMessage}</p>
              </div>
              {contact.unread > 0 && (
                <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {contact.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {/* Chat Header */}
        <div className="p-6 bg-white border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={activeChat.avatar} alt={activeChat.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
            <div>
              <h3 className="font-bold text-slate-900">{activeChat.name}</h3>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                {activeChat.online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex justify-center">
            <span className="px-4 py-1.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
              Today
            </span>
          </div>
          
          <div className="flex gap-4 max-w-[80%]">
            <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-xl object-cover self-end" referrerPolicy="no-referrer" />
            <div className="bg-white p-4 rounded-3xl rounded-bl-none shadow-sm border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed">Hello! I'm interested in the Modern Studio listing. Is it still available for the next semester?</p>
              <span className="text-[10px] text-slate-400 mt-2 block">10:45 AM</span>
            </div>
          </div>

          <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
            <div className="bg-slate-900 p-4 rounded-3xl rounded-br-none shadow-lg text-white">
              <p className="text-sm leading-relaxed">Yes, it's still available! We have a few viewings scheduled for this weekend. Would you like to join one?</p>
              <span className="text-[10px] text-white/40 mt-2 block text-right">10:48 AM</span>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-6 bg-white border-t border-slate-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="p-2.5 text-slate-400 hover:text-orange-500 transition-all"><Image className="w-5 h-5" /></button>
              <button className="p-2.5 text-slate-400 hover:text-orange-500 transition-all"><Paperclip className="w-5 h-5" /></button>
              <button className="p-2.5 text-slate-400 hover:text-orange-500 transition-all"><Smile className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full pl-6 pr-12 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
