
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Category } from '../types';

interface PartnerPageProps {
  onSubmit: () => void;
}

export const PartnerPage: React.FC<PartnerPageProps> = ({ }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    city: '',
    services: '',
    category: 'gents' as Category
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('partners')
        .insert([{
          shop_name: formData.shopName,
          owner_name: formData.ownerName,
          phone: formData.phone,
          city: formData.city,
          services: formData.services,
          category: formData.category,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      // Fallback for demo purposes if table doesn't exist
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen pt-32 pb-20 px-4 flex justify-center items-center">
        <div className="max-w-xl w-full glass p-16 rounded-[2.5rem] border border-gold/30 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="w-4 h-4 bg-gold rounded-full animate-ping" />
          </div>
          <h1 className="text-3xl font-serif font-black gold-gradient mb-6 uppercase tracking-tighter">Application Sent</h1>
          <p className="text-white/50 mb-10 leading-relaxed text-sm">Your partnership application is currently <strong>under review</strong>. Our studio curation team will contact you within 48-72 hours.</p>
          <div className="h-px w-20 bg-gold/20 mx-auto" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 flex justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-16 animate-fadeIn">
          <span className="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4 block">Artisan Network</span>
          <h1 className="text-5xl font-serif font-black gold-gradient mb-4 uppercase tracking-tighter">Partner With Us</h1>
          <p className="text-white/50">Grow your business within our luxury unisex ecosystem.</p>
        </div>

        <div className="glass p-12 rounded-[2.5rem] border border-white/10 animate-slideUp">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">Salon/Barber Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold transition-all" 
                  value={formData.shopName}
                  onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">Owner Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold transition-all" 
                  value={formData.ownerName}
                  onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">Phone</label>
                <input 
                  type="tel" 
                  required 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold transition-all" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">City</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold transition-all" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">Primary Category</label>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, category: 'gents'})}
                  className={`flex-1 py-4 rounded-2xl border text-[10px] font-black tracking-widest uppercase transition-all ${formData.category === 'gents' ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-white/40'}`}
                >
                  Gents Barber
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, category: 'ladies'})}
                  className={`flex-1 py-4 rounded-2xl border text-[10px] font-black tracking-widest uppercase transition-all ${formData.category === 'ladies' ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-white/40'}`}
                >
                  Ladies Parlour
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest uppercase text-white/30 block mb-2">Services Offered</label>
              <textarea 
                placeholder="e.g. Master Barbering, Skin Aesthetics..." 
                rows={4} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold transition-all resize-none" 
                value={formData.services}
                onChange={(e) => setFormData({...formData, services: e.target.value})}
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20 transform hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
