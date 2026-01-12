
import React, { useState } from 'react';
import { Booking, UserRole } from '../types';

interface DashboardProps {
  role: UserRole;
  bookings: Booking[];
}

export const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'profile'>('overview');

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold gold-gradient mb-2 uppercase tracking-tighter">Dashboard Overview</h1>
            <p className="text-white/50 capitalize">Welcome back to your premium {role} portal</p>
          </div>
          <div className="flex space-x-2 glass p-1.5 rounded-2xl border border-white/10">
            <button onClick={() => setActiveTab('overview')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'overview' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Overview</button>
            <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'bookings' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>My Bookings</button>
            <button onClick={() => setActiveTab('profile')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'profile' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Profile</button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
            <div className="glass p-10 rounded-[2.5rem] border border-white/10">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-4">Upcoming Session</span>
              <p className="text-xl font-bold uppercase">No bookings scheduled</p>
            </div>
            <div className="glass p-10 rounded-[2.5rem] border border-white/10">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-4">Total Spent</span>
              <p className="text-xl font-bold uppercase gold-gradient">₹0.00</p>
            </div>
            <div className="glass p-10 rounded-[2.5rem] border border-white/10">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-4">Membership Level</span>
              <p className="text-xl font-bold uppercase">Classic Tier</p>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="glass rounded-[2.5rem] p-12 border border-white/10 text-center animate-fadeIn">
            <div className="w-16 h-16 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-6 h-6 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-widest mb-4">My Bookings (Coming Soon)</h3>
            <p className="text-white/40 mb-10 max-w-sm mx-auto text-sm leading-relaxed">You haven't reserved an elite grooming session yet. Experience the artistry today.</p>
            <button className="px-12 py-5 border border-gold text-gold text-[10px] font-black tracking-widest rounded-full hover:bg-gold hover:text-dark-900 transition-all uppercase">Book Your First Slot</button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fadeIn">
            <div className="lg:col-span-1 glass p-10 rounded-[2.5rem] border border-white/10 h-fit">
              <div className="w-24 h-24 bg-white/5 rounded-full mx-auto mb-6 flex items-center justify-center border border-gold/10">
                <span className="text-2xl font-serif text-gold">VC</span>
              </div>
              <h3 className="text-center font-bold uppercase tracking-widest text-lg mb-2">Valued Client</h3>
              <p className="text-center text-[10px] text-white/30 uppercase tracking-[0.3em] mb-10">Profile (Coming Soon)</p>
              <button className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-white hover:border-white/30 transition-all">Sign Out</button>
            </div>
            <div className="lg:col-span-2 glass p-12 rounded-[2.5rem] border border-white/10">
              <h3 className="text-sm font-black tracking-widest uppercase text-white/40 mb-10 block">Account Information</h3>
              <div className="space-y-8">
                <p className="text-white/40 italic">Account details and settings will be manageable here in the next version.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
