import React, { useState, useEffect } from 'react';
import { Booking, Professional, Profile, PartnerRequest } from '../types';
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
  const [priceVisibility, setPriceVisibility] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchPendingPartners();
    
    // Fixed: Added mandatory 'schema' property to 'postgres_changes' filter to resolve TypeScript overload mismatch errors on lines 32 and 35
    const channel = supabase
      .channel('partners-changes-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'partners' }, payload => {
        fetchPendingPartners();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'partners' }, payload => {
        fetchPendingPartners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) setUsers(data);
  };

  const fetchPendingPartners = async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPendingPartners(data);
      setNotificationCount(data.length);
    }
  };

  const handleUserAction = async (id: string, action: string) => {
    if (action === 'delete') {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (!error) {
        setUsers(users.filter(u => u.id !== id));
        alert('Action Confirmed: User deleted permanently.');
      }
    } else if (action === 'verify') {
      const { error } = await supabase.from('profiles').update({ is_partner_approved: true }).eq('id', id);
      if (!error) alert('Action Confirmed: User verified.');
    } else if (action === 'role') {
      const newRole = prompt('Assign new role (customer/professional/admin):');
      if (newRole) {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
        if (!error) fetchUsers();
      }
    }
  };

  const handlePartnerApproval = async (id: string, action: 'approve' | 'reject') => {
    const status = action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase
      .from('partners')
      .update({ status })
      .eq('id', id);

    if (!error) {
      alert(`Database Updated: Partner ${status}.`);
      fetchPendingPartners();
    } else {
      alert(`Sync Error: Could not update partner status.`);
    }
  };

  const handleGlobalAction = (action: string) => {
    if (action === 'toggle-prices') {
      setPriceVisibility(!priceVisibility);
      alert(`System Config: Prices are now ${!priceVisibility ? 'Visible' : 'Hidden'}.`);
    } else if (action === 'maintenance') {
      setMaintenanceMode(!maintenanceMode);
      alert(`System State: Maintenance is now ${!maintenanceMode ? 'ON' : 'OFF'}.`);
    } else {
      alert(`Global Broadcast Triggered: ${action}`);
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
    {id: 'users', label: 'User Management'},
    {id: 'partners', label: 'Shops & Partners'},
    {id: 'services', label: 'Services & Pricing'},
    {id: 'bookings', label: 'Booking Control'},
    {id: 'payments', label: 'Payments & Payouts'},
    {id: 'content', label: 'Content Control'},
    {id: 'security', label: 'Security & Auth'},
    {id: 'notifications', label: 'Communication'},
    {id: 'system', label: 'System Settings'},
  ];

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-72 glass rounded-[2.5rem] p-6 border border-white/10 h-fit sticky top-32">
          <h3 className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-8 ml-2">Studio Oversight</h3>
          <nav className="space-y-1.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`relative w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${activeSection === item.id ? 'bg-gold text-dark-900' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                {item.label}
                {item.id === 'partners' && notificationCount > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full animate-pulse border-2 border-dark-900">
                    {notificationCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 animate-fadeIn">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-serif font-black gold-gradient mb-2 uppercase tracking-tighter">{activeSection.replace('-', ' ')}</h1>
              <p className="text-white/40 text-xs font-medium tracking-wide">Architectural control panel & global state synchronization</p>
            </div>
          </div>

          {activeSection === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <ActionButton label="View Users" variant="gold" onClick={fetchUsers} />
                <ActionButton label="Verify All Pending" onClick={() => handleGlobalAction('verify-bulk')} />
              </div>
              <div className="glass rounded-[2rem] border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">User Identity</th>
                      <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">Role</th>
                      <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="px-8 py-6 font-bold uppercase tracking-tight">{user.full_name} ({user.email})</td>
                        <td className="px-8 py-6 text-xs text-white/40">{user.role}</td>
                        <td className="px-8 py-6 flex gap-2">
                          <ActionButton label="Toggle Status" onClick={() => handleUserAction(user.id, 'toggle')} />
                          <ActionButton label="Change Role" onClick={() => handleUserAction(user.id, 'role')} />
                          <ActionButton label="Verify" onClick={() => handleUserAction(user.id, 'verify')} />
                          <ActionButton label="Delete User" variant="danger" onClick={() => handleUserAction(user.id, 'delete')} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'partners' && (
            <div className="space-y-10">
              <div className="glass p-8 rounded-[2rem] border border-white/10">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest">Pending Requests ({pendingPartners.length})</h4>
                  <ActionButton label="Sync Requests" onClick={fetchPendingPartners} />
                </div>
                <div className="space-y-4">
                  {pendingPartners.length === 0 ? (
                    <p className="text-white/20 text-xs italic py-10 text-center uppercase tracking-widest">Awaiting new artisan applications...</p>
                  ) : (
                    pendingPartners.map(req => (
                      <div key={req.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-gold/20 transition-all">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="text-xl font-bold uppercase tracking-tight">{req.shop_name}</h5>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${req.category === 'gents' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                                {req.category === 'gents' ? 'Barber' : 'Beauty'}
                              </span>
                            </div>
                            <p className="text-xs text-white/60">Owner: <span className="text-white font-bold">{req.owner_name}</span> | {req.city}</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-4">Log: {new Date(req.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex md:flex-col justify-end gap-3">
                            <ActionButton label="Approve" variant="gold" onClick={() => handlePartnerApproval(req.id, 'approve')} />
                            <ActionButton label="Reject" variant="danger" onClick={() => handlePartnerApproval(req.id, 'reject')} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Revenue', value: '₹124.5k', trend: '+12%' },
                  { label: 'Total Bookings', value: '482', trend: '+5%' },
                  { label: 'Active Partners', value: '12', trend: 'Stable' },
                ].map((stat, i) => (
                  <div key={i} className="glass p-8 rounded-[2rem] border border-white/10">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">{stat.label}</span>
                    <span className="text-3xl font-serif font-black text-gold block mb-4">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'services' && (
            <div className="glass p-8 rounded-[2rem] border border-white/10 space-y-8">
              <div className="flex flex-wrap gap-4">
                <ActionButton label="Toggle Price Visibility" onClick={() => handleGlobalAction('toggle-prices')} />
                <ActionButton label="Add Service" variant="gold" onClick={() => handleGlobalAction('service-add')} />
                <ActionButton label="Maintenance Mode" variant="danger" onClick={() => handleGlobalAction('maintenance')} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};