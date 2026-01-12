
import React, { useState, useEffect } from 'react';
import { Booking, Professional, Profile, PartnerRequest, ActivityNotification } from '../types';
import { supabase } from '../supabase';

interface AdminPanelProps {
  bookings: Booking[];
  professionals: Professional[];
  onUpdateStatus: (id: string, status: string) => void;
}

type AdminSection = 'overview' | 'users' | 'partners' | 'services' | 'bookings' | 'payments' | 'content' | 'security' | 'notifications' | 'system';

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  bookings: initialBookings, 
  professionals: initialProfessionals,
  onUpdateStatus
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [pendingPartners, setPendingPartners] = useState<PartnerRequest[]>([]);
  const [activities, setActivities] = useState<ActivityNotification[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Global Config States
  const [priceVisibility, setPriceVisibility] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    fetchAllAdminData();
    
    // SETUP REAL-TIME SYNC
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, () => fetchPendingPartners())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchActivities())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchBookings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllAdminData = () => {
    fetchUsers();
    fetchPendingPartners();
    fetchActivities();
    fetchBookings();
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) setUsers(data);
  };

  const fetchPendingPartners = async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (!error && data) setPendingPartners(data);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, customer:profiles(full_name)')
      .order('created_at', { ascending: false });
    if (!error && data) setAllBookings(data);
  };

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setActivities(data);
      setNotificationCount(data.filter(n => !n.is_read).length);
    }
  };

  const handleUserAction = async (id: string, action: string) => {
    if (action === 'delete') {
      if (!confirm('Permanent Action: Remove user profile from database?')) return;
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (!error) {
        alert('User removed from registry.');
        fetchUsers();
      }
    } else if (action === 'role') {
      const newRole = prompt('Assign Authority Level (customer / professional / admin):');
      if (newRole && ['customer', 'professional', 'admin'].includes(newRole)) {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
        if (!error) {
          await supabase.from('notifications').insert([{
            type: 'system_action',
            message: `User role escalation to ${newRole} for ID ${id.slice(0, 8)}`,
            is_read: true
          }]);
          fetchUsers();
        }
      }
    }
  };

  const handlePartnerApproval = async (id: string, action: 'approve' | 'reject') => {
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    // 1. Update status atomically
    const { error: partnerError } = await supabase
      .from('partners')
      .update({ status })
      .eq('id', id);

    if (partnerError) {
      alert('Sync Failure: Check database connection.');
      return;
    }

    // 2. Clear relevant notification
    await supabase.from('notifications').update({ is_read: true }).eq('reference_id', id);

    // 3. Log administrative audit trail
    await supabase.from('notifications').insert([{
      type: `artisan_${status}`,
      message: `Artisan unit request ${id.slice(0,8)} was ${status} by Admin Protocol`,
      reference_id: id,
      is_read: true,
      created_at: new Date().toISOString()
    }]);

    alert(`Protocol Success: Artisan unit ${status}.`);
    fetchAllAdminData();
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchActivities();
  };

  const handleSystemControl = (type: string) => {
    if (type === 'toggle-prices') {
      setPriceVisibility(!priceVisibility);
      alert(`System Config: Global price visibility toggled.`);
    } else if (type === 'maintenance') {
      setMaintenanceMode(!maintenanceMode);
      alert(`System State: Maintenance protocol ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}.`);
    } else {
      alert(`Instruction Received: ${type}`);
    }
  };

  const ActionButton = ({ label, onClick, variant = 'outline' }: { label: string, onClick?: () => void, variant?: 'gold' | 'outline' | 'danger' }) => {
    const baseStyles = "px-4 py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all";
    const variants = {
      gold: "bg-gold text-dark-900 hover:bg-gold-light",
      outline: "border border-white/10 text-white/60 hover:border-gold hover:text-gold",
      danger: "border border-red-500/30 text-red-500 hover:bg-red-500/10"
    };
    return (
      <button onClick={onClick} className={`${baseStyles} ${variants[variant]}`}>
        {label}
      </button>
    );
  };

  const navItems: {id: AdminSection, label: string}[] = [
    {id: 'overview', label: 'Dashboard'},
    {id: 'users', label: 'User Registry'},
    {id: 'partners', label: 'Artisan Supply'},
    {id: 'services', label: 'Menu & Rates'},
    {id: 'bookings', label: 'Demand Control'},
    {id: 'payments', label: 'Financials'},
    {id: 'content', label: 'Studio CMS'},
    {id: 'security', label: 'Access Control'},
    {id: 'notifications', label: 'Activity Logs'},
    {id: 'system', label: 'System Protocols'},
  ];

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-72 glass rounded-[2.5rem] p-6 border border-white/10 h-fit sticky top-32">
          <h3 className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-8 ml-2">Studio Core</h3>
          <nav className="space-y-1.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`relative w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${activeSection === item.id ? 'bg-gold text-dark-900' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                {item.label}
                {item.id === 'partners' && pendingPartners.length > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full animate-pulse border-2 border-dark-900 shadow-xl">
                    {pendingPartners.length}
                  </span>
                )}
                {item.id === 'notifications' && notificationCount > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Dynamic Content Feed */}
        <div className="flex-1 animate-fadeIn">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-serif font-black gold-gradient mb-2 uppercase tracking-tighter">{activeSection.replace('-', ' ')}</h1>
              <p className="text-white/40 text-xs font-medium tracking-wide">Connected to live architectural stream</p>
            </div>
            <div className="flex gap-3">
              <ActionButton label="Resync Cloud" variant="gold" onClick={fetchAllAdminData} />
            </div>
          </div>

          {/* Overview Metrics */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-8 rounded-[2rem] border border-white/10 group hover:border-gold/20 transition-all">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Demand Signal</span>
                  <span className="text-3xl font-serif font-black text-gold block mb-4">{allBookings.filter(b=>b.status==='searching').length} Searching</span>
                  <ActionButton label="Manage Queue" onClick={() => setActiveSection('bookings')} />
                </div>
                <div className="glass p-8 rounded-[2rem] border border-white/10 group hover:border-gold/20 transition-all">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Artisan Intake</span>
                  <span className="text-3xl font-serif font-black text-gold block mb-4">{pendingPartners.length} New</span>
                  <ActionButton label="Review Intake" onClick={() => setActiveSection('partners')} />
                </div>
                <div className="glass p-8 rounded-[2rem] border border-white/10 group hover:border-gold/20 transition-all">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Platform Events</span>
                  <span className="text-3xl font-serif font-black text-gold block mb-4">{notificationCount} Unseen</span>
                  <ActionButton label="Audit Stream" onClick={() => setActiveSection('notifications')} />
                </div>
              </div>

              <div className="glass p-8 rounded-[2rem] border border-white/10">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-6 pb-4 border-b border-white/5">Artisan Activity Audit</h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {activities.slice(0, 15).map(act => (
                    <div key={act.id} className={`flex items-center justify-between p-5 bg-white/5 rounded-2xl border transition-all ${act.is_read ? 'border-white/5 opacity-60' : 'border-gold/30 bg-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.05)]'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${act.is_read ? 'bg-white/20' : 'bg-gold animate-pulse'}`} />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight text-white">{act.message}</p>
                          <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">{new Date(act.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      {!act.is_read && <button onClick={() => markNotificationRead(act.id)} className="text-[9px] font-black text-gold uppercase hover:underline">Acknowledge</button>}
                    </div>
                  ))}
                  {activities.length === 0 && <p className="text-center py-12 text-white/20 italic uppercase tracking-[0.3em] text-[10px]">Awaiting signals from the cloud...</p>}
                </div>
              </div>
            </div>
          )}

          {/* User Management Section */}
          {activeSection === 'users' && (
            <div className="glass rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">User Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">Access Authority</th>
                    <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-bold uppercase tracking-tight group-hover:text-gold transition-colors">{user.full_name}</p>
                        <p className="text-[10px] text-white/30 font-medium tracking-wide lowercase">{user.email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-gold uppercase tracking-widest shadow-lg">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 flex gap-3">
                        <ActionButton label="Modify Authority" onClick={() => handleUserAction(user.id, 'role')} />
                        <ActionButton label="Purge Unit" variant="danger" onClick={() => handleUserAction(user.id, 'delete')} />
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={3} className="px-8 py-24 text-center text-white/20 italic tracking-[0.4em] uppercase text-xs">Scanning cloud for units...</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Artisan Intake Section */}
          {activeSection === 'partners' && (
            <div className="space-y-10">
              <div className="glass p-10 rounded-[2.5rem] border border-white/10">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-10 border-b border-white/5 pb-4">Artisan Network Submissions</h4>
                <div className="space-y-6">
                  {pendingPartners.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <p className="text-white/20 text-xs italic uppercase tracking-[0.5em]">Network Intake Clear</p>
                    </div>
                  ) : (
                    pendingPartners.map(req => (
                      <div key={req.id} className="p-8 bg-white/5 rounded-[2rem] border border-white/10 hover:border-gold/40 transition-all group relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                          <div>
                            <div className="flex items-center gap-4 mb-5">
                              <h5 className="text-3xl font-serif font-black uppercase tracking-tight gold-gradient">{req.shop_name}</h5>
                              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${req.category === 'gents' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'}`}>
                                {req.category === 'gents' ? 'Artisan Barber' : 'Artisan Parlour'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-xs text-white/60 uppercase tracking-widest font-black">
                              <p>Proprietor: <span className="text-white">{req.owner_name}</span></p>
                              <p>District: <span className="text-white">{req.city}</span></p>
                            </div>
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mt-8 font-black">Submittion Logic Entry: {new Date(req.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex md:flex-col justify-end gap-3 h-fit">
                            <ActionButton label="Authorize Unit" variant="gold" onClick={() => handlePartnerApproval(req.id, 'approve')} />
                            <ActionButton label="Reject Unit" variant="danger" onClick={() => handlePartnerApproval(req.id, 'reject')} />
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -translate-y-16 translate-x-16 opacity-30" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Activity Logs Stream Section */}
          {activeSection === 'notifications' && (
            <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
               <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                 <h4 className="text-sm font-bold uppercase tracking-widest">Master Audit History</h4>
                 <ActionButton label="Flush Buffer" onClick={() => handleSystemControl('clear-notifications')} />
               </div>
               <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {activities.map(act => (
                    <div key={act.id} className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${act.is_read ? 'bg-transparent border-white/5 opacity-40' : 'bg-gold/5 border-gold/30 shadow-lg shadow-gold/5 animate-slideIn'}`}>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-[8px] font-black px-2.5 py-1 bg-white/10 text-white rounded-md uppercase tracking-widest">{act.type.replace('_', ' ')}</span>
                          <p className={`text-xs font-bold uppercase tracking-tight ${act.is_read ? 'text-white/40' : 'text-white'}`}>{act.message}</p>
                        </div>
                        <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] ml-2">{new Date(act.created_at).toLocaleString()}</p>
                      </div>
                      {!act.is_read && (
                        <button onClick={() => markNotificationRead(act.id)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gold/30 text-gold hover:bg-gold hover:text-dark-900 transition-all shadow-xl shadow-gold/10">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {activities.length === 0 && <p className="text-center py-32 text-white/20 uppercase tracking-[0.5em] text-xs animate-pulse">Scanning signal clouds...</p>}
               </div>
            </div>
          )}

          {/* Generic System Protocol Logic */}
          {(['services', 'bookings', 'payments', 'system', 'security'] as AdminSection[]).includes(activeSection) && (
            <div className="glass p-20 rounded-[3rem] border border-white/10 text-center space-y-12 animate-fadeIn shadow-2xl">
               <div className="w-24 h-24 border border-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 bg-gold/5 relative">
                  <div className="w-4 h-4 bg-gold rounded-full shadow-[0_0_20px_rgba(212,175,55,1)] animate-ping" />
                  <div className="absolute inset-0 border border-gold/20 rounded-full animate-pulse" />
               </div>
               <h3 className="text-3xl font-serif font-black uppercase tracking-widest gold-gradient italic">Structural Protocols Active</h3>
               <p className="text-white/40 text-sm max-w-lg mx-auto leading-relaxed uppercase tracking-[0.2em] font-medium">Cloud protocols for {activeSection.replace('-', ' ')} are synchronized. Architectural integrity preserved.</p>
               <div className="flex flex-wrap justify-center gap-5">
                  <ActionButton label="Synchronize Cloud" variant="gold" onClick={fetchAllAdminData} />
                  <ActionButton label="Logic Status" onClick={() => handleSystemControl(`${activeSection}-status`)} />
                  <ActionButton label="Maintenance Mode" variant="danger" onClick={() => handleSystemControl('maintenance')} />
               </div>
            </div>
          )}

        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.4); }
      `}</style>
    </div>
  );
};
