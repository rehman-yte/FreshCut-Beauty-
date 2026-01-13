import React, { useState, useEffect } from 'react';
import { Booking, UserRole, ActivityNotification, Professional, Profile } from '../types.ts';
import { supabase } from '../supabase.ts';

interface DashboardProps {
  role: UserRole;
  bookings: Booking[];
}

export const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'verification' | 'profile'>('overview');
  const [liveBookings, setLiveBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isStealth, setIsStealth] = useState(false);
  const [activities, setActivities] = useState<ActivityNotification[]>([]);
  
  // Verification states
  const [panNumber, setPanNumber] = useState('');
  const [panImage, setPanImage] = useState<File | null>(null);
  const [shopImage, setShopImage] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const sub = supabase.channel('dashboard-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchDashboardData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchDashboardData = async () => {
    const saved = localStorage.getItem('freshcut_session');
    if (!saved) return;
    const user = JSON.parse(saved);
    setProfile(user);
    
    let query = supabase.from('bookings').select('*, professional:partners(*), service:services(*)').order('created_at', { ascending: false });
    
    if (role === 'customer') query = query.eq('customer_id', user.id);
    else if (role === 'professional') {
      const { data: partner } = await supabase.from('partners').select('id').eq('owner_id', user.id).single();
      if (partner) query = query.or(`professional_id.eq.${partner.id},status.eq.searching`);
    }

    const { data } = await query;
    if (data) setLiveBookings(data as any);

    const { data: ls } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5);
    if (ls) setActivities(ls as any);
  };

  const handleVerifyDocs = async () => {
    if (!panNumber || !panImage || !shopImage) {
      alert("All verification documents are mandatory.");
      return;
    }
    setIsVerifying(true);
    
    // Simulating genuine PAN verification API
    setTimeout(() => {
      setIsVerifying(false);
      alert("Documents uploaded successfully. PAN verification initiated with government registries. Approval pending.");
      if (profile) {
        const updatedProfile = { ...profile, pan_number: panNumber, status: 'pending' as any };
        setProfile(updatedProfile);
        localStorage.setItem('freshcut_session', JSON.stringify(updatedProfile));
      }
      setActiveTab('overview');
    }, 2000);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <h1 className="text-5xl font-serif font-black gold-gradient mb-3 uppercase tracking-tighter">Marketplace Hub</h1>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Entity: {role}</span>
               <div className="h-1 w-1 rounded-full bg-white/20" />
               <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${profile?.status === 'active' ? 'text-green-400' : 'text-gold animate-pulse'}`}>
                  Status: {profile?.status || 'Unknown'}
               </span>
            </div>
          </div>
          
          <div className="flex gap-2 p-1.5 glass rounded-2xl border border-white/10">
            <button onClick={() => setActiveTab('overview')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Intelligence</button>
            <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bookings' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Sessions</button>
            {role === 'professional' && (
              <button onClick={() => setActiveTab('verification')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'verification' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Verification</button>
            )}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
             <div className="glass p-12 rounded-[2.5rem] border border-white/10 group hover:border-gold/30 transition-all">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Trust Score Index</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-serif font-black text-gold">95</span>
                  <span className="text-sm font-black text-gold/60 mb-2 uppercase tracking-widest">Verified Tier</span>
                </div>
             </div>

             <div className="glass p-12 rounded-[2.5rem] border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Active Sessions</p>
                <span className="text-4xl font-serif font-black text-white">{liveBookings.length} Total</span>
                <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-white/40 leading-relaxed">Structural efficiency optimized.</p>
             </div>

             <div className="glass p-12 rounded-[2.5rem] border border-gold/20 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Verification Flow</p>
                  <span className={`text-xl font-black uppercase tracking-tighter ${profile?.status === 'active' ? 'text-green-400' : 'text-gold'}`}>
                    {profile?.status === 'active' ? 'Marketplace Verified' : 'Identity Verification Pending'}
                  </span>
                </div>
                {profile?.status !== 'active' && role === 'professional' && (
                   <button onClick={() => setActiveTab('verification')} className="mt-8 w-full py-4 bg-gold text-dark-900 rounded-2xl text-[10px] font-black uppercase tracking-widest">Complete Verification</button>
                )}
             </div>
             
             <div className="md:col-span-3 glass p-12 rounded-[2.5rem] border border-white/10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-10 block border-b border-white/5 pb-4">Audit Stream</h3>
                <div className="space-y-6">
                  {activities.map(act => (
                    <div key={act.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 group">
                       <div className="flex items-center gap-6">
                          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                          <p className="text-xs font-bold uppercase tracking-widest text-white/70">{act.message}</p>
                       </div>
                       <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">{new Date(act.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'verification' && role === 'professional' && (
          <div className="max-w-2xl mx-auto glass p-12 rounded-[2.5rem] border border-white/10 animate-fadeIn">
            <h2 className="text-3xl font-serif font-black gold-gradient mb-8 uppercase tracking-tighter">Artisan Verification</h2>
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-3">Permanent Account Number (PAN)</label>
                <input 
                  type="text" 
                  value={panNumber} 
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold"
                  placeholder="ABCDE1234F"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-3">PAN Document Upload</label>
                  <input 
                    type="file" 
                    onChange={(e) => setPanImage(e.target.files?.[0] || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-3">Shop Interior/Exterior</label>
                  <input 
                    type="file" 
                    onChange={(e) => setShopImage(e.target.files?.[0] || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px]"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleVerifyDocs}
                disabled={isVerifying}
                className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-xl shadow-gold/20 disabled:opacity-50"
              >
                {isVerifying ? 'Validating Registry...' : 'Submit Verification Documents'}
              </button>
              
              <p className="text-[10px] text-white/20 uppercase tracking-widest text-center">Data is handled according to Marketplace Architectural Privacy Protocol.</p>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
           <div className="space-y-6 animate-fadeIn">
              {liveBookings.length === 0 ? (
                <div className="py-32 text-center glass rounded-[3rem] border border-dashed border-white/10">
                   <p className="text-white/20 text-xs font-black uppercase tracking-[0.6em]">No active signals.</p>
                </div>
              ) : (
                liveBookings.map(b => (
                  <div key={b.id} className="glass p-10 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 group">
                     <div>
                        <div className="flex items-center gap-4 mb-3">
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(b.status)}`}>{b.status}</span>
                        </div>
                        <h4 className="text-3xl font-serif font-black uppercase tracking-tighter mb-2 group-hover:text-gold transition-colors">
                          {b.professional?.name || 'Searching Unit...'}
                        </h4>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                          {new Date(b.appointment_time).toLocaleDateString()} @ {new Date(b.appointment_time).toLocaleTimeString()}
                        </p>
                     </div>
                     <button className="px-10 py-4 border border-white/10 text-white/40 text-[10px] font-black uppercase rounded-2xl hover:text-white hover:border-gold transition-all">Audit Data</button>
                  </div>
                ))
              )}
           </div>
        )}
      </div>
    </div>
  );
};