
import React, { useState, useEffect } from 'react';
import { Booking, Professional, Profile, ActivityNotification } from '../types';
import { supabase } from '../supabase';

interface AdminPanelProps {
  bookings: Booking[];
  professionals: Professional[];
  onUpdateStatus: (id: string, status: string) => void;
}

type AdminSection = 'overview' | 'verifications' | 'providers' | 'bookings' | 'logs';

export const AdminPanel: React.FC<AdminPanelProps> = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [allProviders, setAllProviders] = useState<Professional[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [logs, setLogs] = useState<ActivityNotification[]>([]);
  const [stats, setStats] = useState({ revenue: 0, pending: 0, verif_pending: 0 });

  useEffect(() => {
    fetchEverything();
    const sub = supabase.channel('admin-master').on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, fetchEverything).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchEverything = async () => {
    const { data: ps } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    const { data: bs } = await supabase.from('bookings').select('*, professional:partners(*), customer:profiles(*)').order('created_at', { ascending: false });
    const { data: us } = await supabase.from('profiles').select('*');
    const { data: ls } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);

    if (ps) setAllProviders(ps as any);
    if (bs) setBookings(bs as any);
    if (us) {
      setUsers(us);
      setPendingVerifications(us.filter(u => u.role === 'professional' && !u.pan_verified && u.status === 'pending'));
    }
    if (ls) setLogs(ls as any);

    setStats({
      revenue: (bs || []).filter(b => b.status === 'completed').length * 1048,
      pending: (ps || []).filter(p => p.status === 'pending').length,
      verif_pending: us?.filter(u => u.role === 'professional' && u.status === 'pending').length || 0
    });
  };

  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    // Approve the partner profile and set the corresponding professional status
    await supabase.from('profiles').update({ status: status === 'approved' ? 'active' : 'suspended', pan_verified: status === 'approved' }).eq('id', id);
    // Find the partner entry for this owner and update it
    await supabase.from('partners').update({ status }).eq('owner_id', id);
    
    await supabase.from('notifications').insert([{
      type: 'admin_action',
      actor_role: 'admin',
      message: `Artisan Entry ${id.slice(0, 6)} ${status.toUpperCase()} after document audit.`,
      is_read: true
    }]);
    fetchEverything();
  };

  const NavItem = ({ id, label }: { id: AdminSection, label: string }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === id ? 'bg-gold text-dark-900 shadow-xl shadow-gold/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
    >
      {label}
      {id === 'verifications' && stats.verif_pending > 0 && <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{stats.verif_pending}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-72 glass p-6 rounded-[2.5rem] border border-white/10 h-fit">
          <h3 className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-8 px-2">Curation Hub</h3>
          <nav className="space-y-1.5">
            <NavItem id="overview" label="Intelligence" />
            <NavItem id="verifications" label="Document Audit" />
            <NavItem id="providers" label="Marketplace Supply" />
            <NavItem id="bookings" label="Demand Stream" />
            <NavItem id="logs" label="Audit Trail" />
          </nav>
        </aside>

        <div className="flex-1 animate-fadeIn">
          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-10 rounded-[2.5rem] border border-gold/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Platform GMV</span>
                <span className="text-4xl font-serif font-black gold-gradient">₹{stats.revenue.toLocaleString()}</span>
              </div>
              <div className="glass p-10 rounded-[2.5rem] border border-gold/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Verified Units</span>
                <span className="text-4xl font-serif font-black text-gold">{allProviders.filter(p => p.status === 'approved').length}</span>
              </div>
              <div className="glass p-10 rounded-[2.5rem] border border-gold/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Audit Queue</span>
                <span className="text-4xl font-serif font-black text-white">{stats.verif_pending}</span>
              </div>
            </div>
          )}

          {activeSection === 'verifications' && (
            <div className="space-y-6">
              {pendingVerifications.length === 0 ? (
                <div className="py-24 text-center glass rounded-[2.5rem] border border-dashed border-white/10">
                  <p className="text-white/20 text-xs font-black uppercase tracking-widest">Verification queue clear.</p>
                </div>
              ) : (
                pendingVerifications.map(u => (
                  <div key={u.id} className="glass p-10 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row justify-between gap-10">
                    <div className="flex-1">
                      <h4 className="text-2xl font-serif font-black gold-gradient mb-2">{u.full_name}</h4>
                      <p className="text-[10px] text-white/40 uppercase mb-6 tracking-widest">ID: {u.id}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[8px] font-black text-white/20 uppercase mb-2">PAN Card Snapshot</p>
                          <div className="h-32 bg-white/10 rounded-xl flex items-center justify-center">
                            <span className="text-[8px] uppercase tracking-widest">View Image</span>
                          </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[8px] font-black text-white/20 uppercase mb-2">Shop Presence</p>
                          <div className="h-32 bg-white/10 rounded-xl flex items-center justify-center">
                            <span className="text-[8px] uppercase tracking-widest">View Image</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex md:flex-col justify-end gap-3 h-fit">
                      <button onClick={() => handleApproval(u.id, 'approved')} className="px-8 py-4 bg-gold text-dark-900 text-[10px] font-black rounded-xl uppercase">Approve Entry</button>
                      <button onClick={() => handleApproval(u.id, 'rejected')} className="px-8 py-4 border border-red-500/30 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500/10">Reject Entry</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSection === 'logs' && (
            <div className="glass p-10 rounded-[2.5rem] border border-white/10 space-y-4">
              {logs.map(log => (
                <div key={log.id} className="p-5 border-b border-white/5 flex justify-between items-center text-xs">
                  <p className="font-bold tracking-tight">{log.message}</p>
                  <span className="text-[10px] text-white/20 uppercase">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
