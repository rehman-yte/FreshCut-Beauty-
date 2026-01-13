import React, { useState, useEffect } from 'react';
import { Booking, UserRole, ActivityNotification, Professional, Profile, Service } from '../types.ts';
import { supabase } from '../supabase.ts';

interface DashboardProps {
  role: UserRole;
  bookings: Booking[];
}

export const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'verification' | 'services'>('overview');
  const [liveBookings, setLiveBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<ActivityNotification[]>([]);
  
  // Service management states
  const [professionalServices, setProfessionalServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);

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
      if (partner) {
        query = query.or(`professional_id.eq.${partner.id},status.eq.searching`);
        const { data: srvs } = await supabase.from('services').select('*').eq('professional_id', partner.id);
        if (srvs) setProfessionalServices(srvs as any);
      }
    }

    const { data } = await query;
    if (data) setLiveBookings(data as any);

    const { data: ls } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
    if (ls) setActivities(ls as any);
  };

  const handleAddService = async () => {
    if (!newServiceName || !newServicePrice || !newServiceDuration) {
      alert("All service parameters mandatory.");
      return;
    }
    setIsAddingService(true);
    
    try {
      const { data: partner } = await supabase.from('partners').select('id, category').eq('owner_id', profile?.id).single();
      if (!partner) throw new Error("Artisan identity not synchronized.");

      const newService = {
        name: newServiceName,
        price: parseInt(newServicePrice),
        duration_mins: parseInt(newServiceDuration),
        category: partner.category,
        professional_id: partner.id
      };

      const { error } = await supabase.from('services').insert([newService]);
      if (error) throw error;

      await supabase.from('notifications').insert([{
        type: 'service_added',
        actor_role: 'professional',
        message: `Artisan ${profile?.full_name} added protocol: ${newServiceName} at ₹${newServicePrice}`,
        is_read: false
      }]);

      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration('');
      fetchDashboardData();
    } catch (e: any) {
      alert(`System Exception: ${e.message}`);
    } finally {
      setIsAddingService(false);
    }
  };

  const handleVerifyDocs = async () => {
    if (!panNumber || !panImage || !shopImage) {
      alert("Full documentation required for Marketplace Onboarding.");
      return;
    }
    setIsVerifying(true);
    
    // Simulate upload and sync to admin
    setTimeout(async () => {
      setIsVerifying(false);
      const updatedProfile = { ...profile, pan_number: panNumber, status: 'pending' as any };
      setProfile(updatedProfile);
      localStorage.setItem('freshcut_session', JSON.stringify(updatedProfile));
      
      await supabase.from('notifications').insert([{
        type: 'verification_pending',
        actor_role: 'professional',
        message: `Artisan ${profile?.full_name} submitted documents for oracle audit.`,
        is_read: false
      }]);

      alert("Documents uploaded to Secure Vault. Oracle audit in progress.");
      setActiveTab('overview');
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'searching': return 'text-gold animate-pulse';
      case 'accepted': return 'text-green-400';
      case 'locked': return 'text-gold/60 italic';
      case 'booked': return 'text-gold';
      case 'completed': return 'text-white/40';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Marketplace Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <h1 className="text-5xl font-serif font-black gold-gradient mb-3 uppercase tracking-tighter">Marketplace Hub</h1>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Entity: {role}</span>
               <div className="h-1 w-1 rounded-full bg-white/20" />
               <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${profile?.status === 'active' ? 'text-green-400' : 'text-gold animate-pulse'}`}>
                  Registry: {profile?.status?.toUpperCase() || 'UNKNOWN'}
               </span>
            </div>
          </div>
          
          <div className="flex gap-2 p-1.5 glass rounded-2xl border border-white/10">
            <button onClick={() => setActiveTab('overview')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Intelligence</button>
            <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bookings' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Sessions</button>
            {role === 'professional' && (
              <>
                <button onClick={() => setActiveTab('services')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'services' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Service Suite</button>
                <button onClick={() => setActiveTab('verification')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'verification' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Verification</button>
              </>
            )}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
             <div className="glass p-12 rounded-[2.5rem] border border-white/10 group hover:border-gold/30 transition-all">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Trust Index</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-serif font-black text-gold">95</span>
                  <span className="text-sm font-black text-gold/60 mb-2 uppercase tracking-widest">Verified Tier</span>
                </div>
             </div>

             <div className="glass p-12 rounded-[2.5rem] border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Active Signals</p>
                <span className="text-4xl font-serif font-black text-white">{liveBookings.length} Units</span>
                <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-white/40 leading-relaxed">Structural sync optimized.</p>
             </div>

             <div className="glass p-12 rounded-[2.5rem] border border-gold/20 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Oracle Flow</p>
                  <span className={`text-xl font-black uppercase tracking-tighter ${profile?.status === 'active' ? 'text-green-400' : 'text-gold'}`}>
                    {profile?.status === 'active' ? 'Marketplace Live' : 'Audit Pending'}
                  </span>
                </div>
                {profile?.status !== 'active' && role === 'professional' && (
                   <button onClick={() => setActiveTab('verification')} className="mt-8 w-full py-4 bg-gold text-dark-900 rounded-2xl text-[10px] font-black uppercase tracking-widest">Complete Registry</button>
                )}
             </div>
             
             <div className="md:col-span-3 glass p-12 rounded-[2.5rem] border border-white/10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-10 block border-b border-white/5 pb-4">Activity Audit Stream</h3>
                <div className="space-y-6">
                  {activities.map(act => (
                    <div key={act.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 group">
                       <div className="flex items-center gap-6">
                          <div className={`w-2 h-2 rounded-full ${act.type.includes('success') ? 'bg-green-400' : 'bg-gold'} animate-pulse`} />
                          <p className="text-xs font-bold uppercase tracking-widest text-white/70">{act.message}</p>
                       </div>
                       <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">{new Date(act.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'services' && role === 'professional' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="max-w-4xl mx-auto glass p-12 rounded-[2.5rem] border border-white/10">
              <h2 className="text-3xl font-serif font-black gold-gradient mb-8 uppercase tracking-tighter">Artisan Registry Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-3">Protocol Name</label>
                  <input type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-3">Artisan Pricing (₹)</label>
                  <input type="number" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-3">Duration (Min)</label>
                  <input type="number" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" />
                </div>
              </div>
              <button onClick={handleAddService} disabled={isAddingService} className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-xl shadow-gold/20 disabled:opacity-50">
                {isAddingService ? 'Synchronizing...' : 'Register Protocol'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
               {professionalServices.map(srv => (
                 <div key={srv.id} className="glass p-10 rounded-[2.5rem] border border-white/10 flex justify-between items-center group hover:border-gold/30 transition-all">
                    <div>
                      <h4 className="text-xl font-bold mb-1 group-hover:text-gold transition-colors">{srv.name}</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{srv.duration_mins} MIN PROTOCOL</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-serif font-black text-white">₹{srv.price}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'verification' && role === 'professional' && (
          <div className="max-w-2xl mx-auto glass p-12 rounded-[2.5rem] border border-white/10 animate-fadeIn">
            <h2 className="text-3xl font-serif font-black gold-gradient mb-8 uppercase tracking-tighter">Artisan Document Audit</h2>
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-3">Permanent Account Number (PAN)</label>
                <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-3">Registry Document</label>
                  <input type="file" onChange={(e) => setPanImage(e.target.files?.[0] || null)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px]" />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-3">Interior Showcase</label>
                  <input type="file" onChange={(e) => setShopImage(e.target.files?.[0] || null)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px]" />
                </div>
              </div>
              <button onClick={handleVerifyDocs} disabled={isVerifying} className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-xl shadow-gold/20 disabled:opacity-50">
                {isVerifying ? 'Validating Registry...' : 'Submit Audit Payload'}
              </button>
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