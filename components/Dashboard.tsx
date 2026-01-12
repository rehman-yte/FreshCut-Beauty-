
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
    
    // UBER-STYLE MARKETPLACE REALTIME SYNC
    const channel = supabase
      .channel('dashboard-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    // Audit: Real-time demand matching logic
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*, professional:partners(*), service:services(*)')
      .order('created_at', { ascending: false });

    if (bookingsData) setLiveBookings(bookingsData);

    const { data: actsData } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);

    if (actsData) setActivities(actsData);
  };

  const handleStatusToggle = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    
    // MARKETPLACE LOGIC: Log online/offline transition for demand-supply matching visibility
    await supabase.from('notifications').insert([{
      type: 'artisan_status',
      message: `Artisan unit has transition to ${nextState ? 'ONLINE' : 'OFFLINE'} state.`,
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
            <p className="text-white/50 capitalize tracking-widest font-black text-[10px]">Registry Entity: <span className="text-gold">{role}</span></p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {role === 'professional' && (
              <button 
                onClick={handleStatusToggle}
                className={`px-6 py-2.5 rounded-full text-[9px] font-black tracking-widest uppercase transition-all flex items-center gap-3 ${isOnline ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`} />
                {isOnline ? 'Active Online' : 'Active Offline'}
              </button>
            )}
            
            <div className="flex space-x-2 glass p-1.5 rounded-2xl border border-white/10">
              <button onClick={() => setActiveTab('overview')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'overview' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Metrics</button>
              <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'bookings' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Sessions</button>
              <button onClick={() => setActiveTab('profile')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'profile' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Registry</button>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
            <div className="glass p-10 rounded-[2.5rem] border border-white/10 shadow-xl group">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-4 group-hover:text-gold transition-colors">Artisan Demand Signal</span>
              <p className="text-xl font-bold uppercase tracking-tighter">
                {liveBookings.find(b => b.status === 'searching') ? 'Searching Artisan Supply...' : 'Artisan Supply Locked'}
              </p>
            </div>
            <div className="glass p-10 rounded-[2.5rem] border border-white/10 shadow-xl group">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-4 group-hover:text-gold transition-colors">Cumulative Marketplace Revenue</span>
              <p className="text-xl font-bold uppercase gold-gradient tracking-tighter">₹0.00</p>
            </div>
            <div className="glass p-10 rounded-[2.5rem] border border-white/10 shadow-xl group">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-4 group-hover:text-gold transition-colors">Professional Artisan Rating</span>
              <p className="text-xl font-bold uppercase tracking-tighter">Elite Registry Tier</p>
            </div>

            <div className="md:col-span-3 glass p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <h3 className="text-sm font-black tracking-widest uppercase text-white/40 mb-8 border-b border-white/5 pb-4">Artisan Marketplace Sync Log</h3>
              <div className="space-y-4">
                {activities.map(act => (
                  <div key={act.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group">
                    <div className="flex items-center gap-5">
                      <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.4)] group-hover:scale-125 transition-all" />
                      <p className="text-xs font-medium uppercase tracking-tighter text-white/80 group-hover:text-white transition-colors">{act.message}</p>
                    </div>
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{new Date(act.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-xs italic text-white/20 uppercase tracking-widest text-center py-10">Waiting for architectural signals...</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="glass rounded-[2.5rem] p-12 border border-white/10 animate-fadeIn shadow-2xl">
            <h3 className="text-xl font-bold uppercase tracking-widest mb-10 border-b border-white/5 pb-4 gold-gradient">Live Artisan Sessions</h3>
            {liveBookings.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                <div className="w-16 h-16 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-6 h-6 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold uppercase tracking-widest mb-4">No active demand signals</h3>
                <p className="text-white/40 mb-10 max-w-sm mx-auto text-[10px] leading-relaxed uppercase tracking-[0.3em] font-black">Marketplace demand is currently synchronized with supply buffers.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {liveBookings.map(booking => (
                  <div key={booking.id} className="p-8 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-gold/40 transition-all shadow-xl">
                    <div className="text-center md:text-left">
                      <div className="flex items-center gap-4 mb-3 justify-center md:justify-start">
                        <span className={`text-[8px] font-black uppercase tracking-[0.4em] px-3 py-1 rounded-full bg-white/5 ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">
                          PROTOCOL: {booking.id.slice(0, 8)}
                        </span>
                      </div>
                      <h4 className="text-2xl font-serif font-black uppercase tracking-tighter mb-2 group-hover:text-gold transition-all">
                        {booking.professional?.name || 'Searching for Salon...'}
                      </h4>
                      <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-black">
                        {new Date(booking.appointment_time).toLocaleDateString()} AT {new Date(booking.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div className="flex gap-4">
                      {role === 'professional' && booking.status === 'searching' && (
                        <button className="px-10 py-5 bg-gold text-dark-900 text-[10px] font-black rounded-2xl uppercase shadow-xl shadow-gold/30 hover:scale-[1.05] transition-all">
                          Authorize Match
                        </button>
                      )}
                      <button className="px-10 py-5 border border-white/10 text-white/40 text-[10px] font-black rounded-2xl uppercase hover:text-white hover:border-gold hover:text-gold transition-all">
                        Registry Data
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
            <div className="lg:col-span-1 glass p-10 rounded-[2.5rem] border border-white/10 h-fit shadow-2xl">
              <div className="w-28 h-28 bg-white/5 rounded-full mx-auto mb-8 flex items-center justify-center border border-gold/20 relative">
                <span className="text-3xl font-serif text-gold font-black">AC</span>
                {isOnline && <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-dark-900 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]" />}
              </div>
              <h3 className="text-center font-black uppercase tracking-[0.2em] text-xl mb-3">Artisan Unit</h3>
              <p className="text-center text-[10px] text-white/30 uppercase tracking-[0.4em] mb-12">Identification: MKTP-{role.toUpperCase()}</p>
              <button className="w-full py-5 border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-white hover:border-gold hover:text-gold transition-all">De-authenticate</button>
            </div>
            <div className="lg:col-span-2 glass p-12 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <h3 className="text-sm font-black tracking-widest uppercase text-white/40 mb-12 block border-b border-white/5 pb-4">Architectural Permissions</h3>
              <div className="space-y-10">
                <div className="flex justify-between items-center border-b border-white/5 pb-5">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Registry Authority</span>
                  <span className="text-gold font-black uppercase tracking-widest text-[10px] bg-gold/5 px-4 py-1.5 rounded-full border border-gold/20">{role}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-5">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Marketplace Matching Protocol</span>
                  <span className="text-white/60 font-black uppercase tracking-widest text-[10px]">Instant Architecture (Tier 1)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Cloud Payout Authorization</span>
                  <span className="text-green-400 font-black uppercase tracking-widest text-[10px] bg-green-500/5 px-4 py-1.5 rounded-full border border-green-500/20">Verified Protocol</span>
                </div>
                <p className="text-white/20 italic text-[9px] uppercase tracking-[0.4em] pt-12 text-center">Architectural settings are synchronized with the marketplace cloud core.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
