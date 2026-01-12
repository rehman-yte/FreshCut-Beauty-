
import React from 'react';
import { Booking, UserRole } from '../types';

interface DashboardProps {
  role: UserRole;
  bookings: Booking[];
  onUpdateStatus?: (id: string, status: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ role, bookings, onUpdateStatus }) => {
  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold gold-gradient mb-2 capitalize">
            {role} Dashboard
          </h1>
          <p className="text-white/50">
            {role === 'customer' ? 'Manage your upcoming appointments' : 'Manage your client schedule'}
          </p>
        </div>

        <div className="glass rounded-3xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-xs font-black tracking-widest text-white/50 uppercase">
                    {role === 'barber' ? 'Customer' : 'Barber'}
                  </th>
                  <th className="px-6 py-4 text-xs font-black tracking-widest text-white/50 uppercase">Service</th>
                  <th className="px-6 py-4 text-xs font-black tracking-widest text-white/50 uppercase">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-black tracking-widest text-white/50 uppercase">Status</th>
                  {role === 'barber' && (
                    <th className="px-6 py-4 text-xs font-black tracking-widest text-white/50 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-white/30 italic">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold">
                        {role === 'barber' ? booking.customer?.full_name : booking.barber?.name}
                      </td>
                      <td className="px-6 py-4 text-white/70">{booking.service?.name}</td>
                      <td className="px-6 py-4 text-white/70">{booking.appointment_time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          booking.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      {role === 'barber' && onUpdateStatus && (
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => onUpdateStatus(booking.id, 'accepted')}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded hover:bg-blue-500/40 transition-all"
                            >
                              ACCEPT
                            </button>
                            <button 
                              onClick={() => onUpdateStatus(booking.id, 'completed')}
                              className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black rounded hover:bg-green-500/40 transition-all"
                            >
                              DONE
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
