
import React, { useState } from 'react';
// Changed Barber to Professional to match types.ts
import { Booking, Professional, Profile } from '../types';

interface AdminPanelProps {
  bookings: Booking[];
  // Renamed barbers to professionals to match App.tsx usage
  professionals: Professional[];
  // Made optional as they are not passed from App.tsx
  customers?: Profile[];
  onUpdateStatus: (id: string, status: string) => void;
  onDeleteProfessional?: (id: string) => void;
  onCreateProfessional?: (data: Partial<Professional>) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  bookings, 
  professionals, 
  onUpdateStatus,
  onDeleteProfessional,
  onCreateProfessional
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'professionals'>('bookings');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfessional, setNewProfessional] = useState({ name: '', bio: '', specialties: '', image_url: '' });

  const handleSubmitProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateProfessional) {
      onCreateProfessional({
        ...newProfessional,
        specialties: newProfessional.specialties.split(',').map(s => s.trim())
      });
    }
    setNewProfessional({ name: '', bio: '', specialties: '', image_url: '' });
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold gold-gradient mb-2">Studio Management</h1>
            <p className="text-white/50">Oversee your unisex grooming and beauty parlour operations</p>
          </div>
          <div className="flex space-x-4 glass p-2 rounded-full">
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-gold text-dark-900' : 'hover:text-gold'}`}
            >
              Bookings
            </button>
            <button 
              onClick={() => setActiveTab('professionals')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'professionals' ? 'bg-gold text-dark-900' : 'hover:text-gold'}`}
            >
              Our Experts
            </button>
          </div>
        </div>

        {activeTab === 'bookings' && (
          <div className="glass rounded-3xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase">Customer</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase">Specialist</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase">Service</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase">Date/Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium">{booking.customer?.full_name || 'N/A'}</td>
                      {/* Changed booking.barber to booking.professional */}
                      <td className="px-6 py-4 font-medium">{booking.professional?.name}</td>
                      <td className="px-6 py-4 text-white/70">{booking.service?.name}</td>
                      <td className="px-6 py-4 text-white/70">{booking.appointment_time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          booking.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={booking.status}
                          onChange={(e) => onUpdateStatus(booking.id, e.target.value)}
                          className="bg-dark-800 border border-white/10 rounded-lg px-3 py-1 text-xs outline-none focus:border-gold text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'professionals' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {professionals.map((professional) => (
              <div key={professional.id} className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden group">
                <img src={professional.image_url} alt={professional.name} className="w-24 h-24 rounded-2xl object-cover mb-4 border-2 border-gold/50" />
                <h3 className="text-xl font-bold mb-1">{professional.name}</h3>
                <p className="text-sm text-white/50 mb-4 h-12 overflow-hidden line-clamp-2">{professional.bio}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {professional.specialties.map(s => (
                    <span key={s} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-wider text-gold">{s}</span>
                  ))}
                </div>
                <button 
                  onClick={() => onDeleteProfessional && onDeleteProfessional(professional.id)}
                  className="w-full py-3 border border-red-500/50 text-red-500 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-red-500 hover:text-white transition-all"
                >
                  Remove Specialist
                </button>
              </div>
            ))}
            
            {showAddForm ? (
              <form onSubmit={handleSubmitProfessional} className="glass rounded-3xl p-6 border border-gold/30 space-y-4 animate-fadeIn">
                <input 
                  type="text" placeholder="Specialist Name" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
                  value={newProfessional.name} onChange={e => setNewProfessional({...newProfessional, name: e.target.value})}
                />
                <input 
                  type="text" placeholder="Image URL" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
                  value={newProfessional.image_url} onChange={e => setNewProfessional({...newProfessional, image_url: e.target.value})}
                />
                <input 
                  type="text" placeholder="Specialties (comma separated)" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
                  value={newProfessional.specialties} onChange={e => setNewProfessional({...newProfessional, specialties: e.target.value})}
                />
                <textarea 
                  placeholder="Specialist Bio" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none h-20"
                  value={newProfessional.bio} onChange={e => setNewProfessional({...newProfessional, bio: e.target.value})}
                />
                <div className="flex space-x-2">
                  <button type="submit" className="flex-1 py-3 bg-gold text-dark-900 rounded-xl font-black text-[10px] tracking-widest uppercase">Save</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-3 border border-white/10 rounded-xl text-xs font-bold">Cancel</button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setShowAddForm(true)}
                className="glass rounded-3xl p-8 border border-white/10 border-dashed flex flex-col items-center justify-center hover:bg-white/5 transition-all text-white/30 hover:text-gold"
              >
                <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-bold uppercase tracking-widest text-xs">Add New Expert</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
