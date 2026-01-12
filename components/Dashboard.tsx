
import React, { useState, useEffect } from 'react';
import { Booking, UserRole, ActivityNotification, Professional } from '../types';
import { supabase } from '../supabase';

interface DashboardProps {
  role: UserRole;
  bookings: Booking[];
}

export const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'profile'>('overview');
  const [liveBookings, setLiveBookings] = useState<Booking[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [activities, setActivities] = useState<ActivityNotification[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    const bookingChannel = supabase
      .channel('dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    // In a real app, we'd filter by current user ID
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*, professional:partners(*), service:services(*)')
      .order('created_at', { ascending: false });

    if (bookingsData) setLiveBookings(bookingsData);

    const { data: actsData } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (actsData) setActivities(actsData);
  };

  const handleStatusToggle = async () => {
    setIsOnline(!isOnline);
    // Log professional state change for marketplace visibility
    await supabase.from('notifications').insert([{
      type: 'provider_state',
      message: `Artisan provider is now ${!isOnline ? 'ONLINE' : 'OFFLINE'}`,
      is_read: false,
      created_at: new Date().toISOString()
    }]);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'searching': return 'text-gold animate-pulse';
      case 'accepted': return 'text-green-400';
      case 'completed': return 'text-white/40';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-serif font-bold gold-gradient mb-2 uppercase tracking-tighter">Marketplace Dashboard</h1>
            <p className="text-white/50 capitalize">Synchronized as: <span className="text-gold font-black">{role}</span></p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {role === 'professional' && (
              <button 
                onClick={handleStatusToggle}
                className={`px-6 py-2.5 rounded-full text-[9px] font-black tracking-widest uppercase transition-all flex items-center gap-3 ${isOnline ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}
              >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
            )}
            
            <div className="flex space-x-2 glass p-1.5 rounded-2xl border border-white/10">
              <button onClick={() => setActiveTab('overview')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'overview' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Overview</button>
              <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'bookings' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Active Requests</button>
              <button onClick={() => setActiveTab('profile')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'profile' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Profile</button>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
            <div className="glass p-10 rounded-[2.5rem] border border-white/10">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-4">Matching Status</span>
              <p className="text-xl font-bold uppercase">
                {liveBookings.find(b => b.status === 'searching') ? 'Looking for artisans...' : 'All clear'}
              </p>
            </div>
            <div className="glass p-10 rounded-[2.5rem] border border-white/10">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-4">Total Revenue</span>
              <p className="text-xl font-bold uppercase gold-gradient">₹0.00</p>
            </div>
            <div className="glass p-10 rounded-[2.5rem] border border-white/10">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-4">Artisan Rank</span>
              <p className="text-xl font-bold uppercase">Elite Platinum</p>
            </div>

            <div className="md:col-span-3 glass p-10 rounded-[2.5rem] border border-white/10">
              <h3 className="text-sm font-black tracking-widest uppercase text-white/40 mb-8 border-b border-white/5 pb-4">Live Marketplace Feed</h3>
              <div className="space-y-4">
                {activities.map(act => (
                  <div key={act.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                      <p className="text-xs font-medium uppercase tracking-tighter text-white/70">{act.message}</p>
                    </div>
                    <span className="text-[8px] font-black text-white/20 uppercase">{new Date(act.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-xs italic text-white/20">Awaiting marketplace signals...</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="glass rounded-[2.5rem] p-12 border border-white/10 animate-fadeIn">
            <h3 className="text-xl font-bold uppercase tracking-widest mb-10 border-b border-white/5 pb-4">Live Booking Management</h3>
            {liveBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-6 h-6 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold uppercase tracking-widest mb-4">No active requests</h3>
                <p className="text-white/40 mb-10 max-w-sm mx-auto text-sm leading-relaxed uppercase tracking-widest">Marketplace demand is currently being synchronized.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {liveBookings.map(booking => (
                  <div key={booking.id} className="p-8 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-gold/30 transition-all">
                    <div className="text-center md:text-left">
                      <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                        <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                          Ref: {booking.id.slice(0, 8)}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold uppercase tracking-tighter mb-1">Grooming Reservation</h4>
                      <p className="text-xs text-white/50 uppercase tracking-widest">
                        {new Date(booking.appointment_time).toLocaleDateString()} at {new Date(booking.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div className="flex gap-4">
                      {role === 'professional' && booking.status === 'searching' && (
                        <button className="px-10 py-4 bg-gold text-dark-900 text-[10px] font-black rounded-2xl uppercase shadow-lg shadow-gold/20 hover:scale-[1.05] transition-all">
                          Accept Request
                        </button>
                      )}
                      <button className="px-10 py-4 border border-white/10 text-white/40 text-[10px] font-black rounded-2xl uppercase hover:text-white hover:border-white/30 transition-all">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fadeIn">
            <div className="lg:col-span-1 glass p-10 rounded-[2.5rem] border border-white/10 h-fit">
              <div className="w-24 h-24 bg-white/5 rounded-full mx-auto mb-6 flex items-center justify-center border border-gold/10 relative">
                <span className="text-2xl font-serif text-gold">MC</span>
                {isOnline && <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-dark-900 rounded-full" />}
              </div>
              <h3 className="text-center font-bold uppercase tracking-widest text-lg mb-2">Marketplace Client</h3>
              <p className="text-center text-[10px] text-white/30 uppercase tracking-[0.3em] mb-10">Verification ID: MKTP-{role.toUpperCase()}</p>
              <button className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-white hover:border-white/30 transition-all">Sign Out</button>
            </div>
            <div className="lg:col-span-2 glass p-12 rounded-[2.5rem] border border-white/10">
              <h3 className="text-sm font-black tracking-widest uppercase text-white/40 mb-10 block">Marketplace Permissions</h3>
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-xs font-bold uppercase tracking-widest">Role Authority</span>
                  <span className="text-gold font-black uppercase tracking-widest text-[10px]">{role}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-xs font-bold uppercase tracking-widest">Matching Priority</span>
                  <span className="text-white/60 font-black uppercase tracking-widest text-[10px]">Tier 1 (Instant)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest">Payout Status</span>
                  <span className="text-green-400 font-black uppercase tracking-widest text-[10px]">Verified</span>
                </div>
                <p className="text-white/40 italic text-[10px] uppercase tracking-widest pt-10">Advanced settings synchronized with marketplace core.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
