
import React, { useState } from 'react';
import { Professional, Service, Category } from '../types';

interface BookingPageProps {
  type: Category;
  professionals: Professional[];
  services: Service[];
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({ professionals, services, onSubmit, onBack }) => {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => step === 1 ? onBack() : setStep(step - 1);

  const handleFinalize = () => {
    // Uber-style matching: professionalId is determined after the request is broadcasted to salons
    onSubmit({
      professionalId: null, // No specific professional selected, system matches available salons
      serviceId: selectedService,
      date: selectedDate,
      time: selectedTime,
      category: selectedCategory
    });
  };

  const TOTAL_STEPS = 6;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 animate-fadeIn flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-2 block">Instruction {step} OF {TOTAL_STEPS}</span>
            <h2 className="text-4xl font-serif font-black uppercase tracking-tighter gold-gradient">Reserve Artisan Unit</h2>
          </div>
          <button onClick={handleBack} className="text-white/40 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase border-b border-transparent hover:border-gold pb-1">Previous Instruction</button>
        </div>

        <div className="glass rounded-[2.5rem] p-10 md:p-16 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex space-x-2 mb-12 max-w-xs relative z-10">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(212,175,55,0.1)] ${step >= i + 1 ? 'bg-gold' : 'bg-white/5'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-center text-white/90 italic">Identify Category Protocol</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <button onClick={() => { setSelectedCategory('gents'); handleNext(); }} className="p-16 border border-white/5 bg-white/[0.02] rounded-[2.5rem] hover:border-gold hover:bg-gold/5 transition-all text-center group shadow-xl">
                  <h4 className="text-2xl font-serif font-black uppercase tracking-widest mb-3 group-hover:text-gold transition-colors">Artisan Barber</h4>
                  <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.3em]">Executive Grooming Suite</p>
                </button>
                <button onClick={() => { setSelectedCategory('ladies'); handleNext(); }} className="p-16 border border-white/5 bg-white/[0.02] rounded-[2.5rem] hover:border-gold hover:bg-gold/5 transition-all text-center group shadow-xl">
                  <h4 className="text-2xl font-serif font-black uppercase tracking-widest mb-3 group-hover:text-gold transition-colors">Artisan Parlour</h4>
                  <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.3em]">Couture Aesthetic Suite</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-white/90 italic">Select Unit Service</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
                {services.filter(s => s.category === selectedCategory).map((s) => (
                  <button key={s.id} onClick={() => setSelectedService(s.id)} className={`p-10 rounded-[2rem] border transition-all text-left flex justify-between items-center group shadow-lg ${selectedService === s.id ? 'border-gold bg-gold/10' : 'border-white/5 bg-white/[0.01] hover:border-white/20'}`}>
                    <div>
                      <p className="font-bold uppercase tracking-tight group-hover:text-gold transition-colors mb-1">{s.name}</p>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{s.duration_mins} MIN PROTOCOL</p>
                    </div>
                    <p className="text-3xl font-serif font-black gold-gradient">₹{s.price}</p>
                  </button>
                ))}
              </div>
              <button disabled={!selectedService} onClick={handleNext} className="w-full py-6 bg-gold text-dark-900 text-[11px] font-black tracking-[0.4em] rounded-2xl uppercase shadow-xl shadow-gold/20 transform hover:scale-[1.01] transition-all disabled:opacity-30 disabled:grayscale">Advance Protocol</button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-white/90 italic">Temporal Date Selection</h3>
              <input type="date" className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-white focus:border-gold outline-none mb-12 shadow-inner font-black uppercase tracking-widest text-[11px]" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              <button disabled={!selectedDate} onClick={handleNext} className="w-full py-6 bg-gold text-dark-900 text-[11px] font-black tracking-[0.4em] rounded-2xl uppercase shadow-xl shadow-gold/20 transform hover:scale-[1.01] transition-all disabled:opacity-30">Advance Protocol</button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-white/90 italic">Temporal Slot Allocation</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-12">
                {times.map((t) => (
                  <button key={t} onClick={() => setSelectedTime(t)} className={`py-5 rounded-2xl border text-[10px] font-black tracking-widest transition-all shadow-sm ${selectedTime === t ? 'border-gold bg-gold text-dark-900 shadow-gold/20' : 'border-white/5 bg-white/[0.01] hover:border-white/20'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <button disabled={!selectedTime} onClick={handleNext} className="w-full py-6 bg-gold text-dark-900 text-[11px] font-black tracking-[0.4em] rounded-2xl uppercase shadow-xl shadow-gold/20 transform hover:scale-[1.01] transition-all disabled:opacity-30">Audit Reservation</button>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-center text-white/90 italic">Reservation Audit</h3>
              <div className="glass p-10 rounded-[2.5rem] border border-white/5 mb-12 space-y-6 shadow-inner">
                <div className="flex justify-between items-center border-b border-white/5 pb-5">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Protocol Category</span>
                  <span className="font-bold uppercase tracking-widest text-gold text-[11px]">{selectedCategory} Suite</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-5">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Instruction Set</span>
                  <span className="font-bold uppercase tracking-widest text-[11px]">{services.find(s=>s.id===selectedService)?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Temporal Registry</span>
                  <span className="font-bold uppercase tracking-widest text-[11px]">{selectedDate} @ {selectedTime}</span>
                </div>
              </div>
              <button onClick={handleNext} className="w-full py-6 bg-gold text-dark-900 text-[11px] font-black tracking-[0.4em] rounded-2xl uppercase shadow-xl shadow-gold/20 transform hover:scale-[1.01] transition-all">Proceed to Financial Authorization</button>
            </div>
          )}

          {step === 6 && (
            <div className="animate-fadeIn text-center py-16 relative z-10">
              <div className="w-24 h-24 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-10 bg-gold/5 relative">
                <div className="w-8 h-8 bg-gold/20 rounded-full animate-ping" />
                <div className="absolute inset-0 border border-gold/40 rounded-full animate-pulse" />
              </div>
              <h3 className="text-3xl font-serif font-black uppercase tracking-widest mb-4 gold-gradient italic">Initializing Secure Session</h3>
              <p className="text-white/30 mb-16 text-xs uppercase tracking-[0.3em] font-black">Establishing atomic connection to architectural checkout gateway...</p>
              <button onClick={handleFinalize} className="w-full py-6 bg-gold text-dark-900 text-[11px] font-black tracking-[0.4em] rounded-2xl uppercase shadow-2xl shadow-gold/30 transform hover:scale-[1.01] transition-all">Finalize Financials</button>
            </div>
          )}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[120px] -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 blur-[120px] translate-y-32 -translate-x-32" />
        </div>
      </div>
    </div>
  );
};
