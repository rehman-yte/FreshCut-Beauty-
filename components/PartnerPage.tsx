
import React, { useState } from 'react';

interface PartnerPageProps {
  onSubmit: () => void;
}

export const PartnerPage: React.FC<PartnerPageProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({ name: '', businessName: '', type: 'barber', message: '' });

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 flex justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-serif font-black gold-gradient mb-4 uppercase tracking-tighter">Partner With Us</h1>
          <p className="text-white/50">Grow your grooming business within our luxury network.</p>
        </div>

        <div className="glass p-12 rounded-[2.5rem] border border-white/10">
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
            <div>
              <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">Owner Name</label>
              <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">Business Type</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold">
                <option value="barber">Barber Shop</option>
                <option value="parlour">Beauty Parlour</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">Experience (Years)</label>
              <input type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">Portfolio/Details</label>
              <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" />
            </div>
            <button type="submit" className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase">Submit Application</button>
          </form>
        </div>
      </div>
    </main>
  );
};
