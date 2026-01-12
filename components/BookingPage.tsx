
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
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => step === 1 ? onBack() : setStep(step - 1);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 animate-fadeIn flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-2 block">Step {step} of 7</span>
            <h2 className="text-4xl font-serif font-black uppercase tracking-tighter gold-gradient">Reserve Your Slot</h2>
          </div>
          <button onClick={handleBack} className="text-white/40 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase">Go Back</button>
        </div>

        <div className="glass rounded-[2.5rem] p-10 md:p-16 border border-white/10">
          <div className="flex space-x-2 mb-12 max-w-xs">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= i ? 'bg-gold' : 'bg-white/10'}`} />)}
          </div>

          {step === 1 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8 text-center">Select Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <button onClick={() => { setSelectedCategory('gents'); handleNext(); }} className="p-12 border border-white/10 rounded-3xl hover:border-gold transition-all text-center">
                  <h4 className="text-xl font-bold uppercase tracking-widest mb-2">Gents Barber</h4>
                  <p className="text-white/40 text-xs uppercase font-black tracking-widest">Master Grooming</p>
                </button>
                <button onClick={() => { setSelectedCategory('ladies'); handleNext(); }} className="p-12 border border-white/10 rounded-3xl hover:border-gold transition-all text-center">
                  <h4 className="text-xl font-bold uppercase tracking-widest mb-2">Ladies Parlour</h4>
                  <p className="text-white/40 text-xs uppercase font-black tracking-widest">Aesthetic Luxury</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Select Service</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {services.filter(s => s.category === selectedCategory).map((s) => (
                  <button key={s.id} onClick={() => setSelectedService(s.id)} className={`p-8 rounded-3xl border transition-all text-left flex justify-between items-center group ${selectedService === s.id ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-white/30'}`}>
                    <div>
                      <p className="font-bold uppercase tracking-tight group-hover:text-gold transition-colors">{s.name}</p>
                      <p className="text-[10px] font-black text-white/30 uppercase">{s.duration_mins} MINS</p>
                    </div>
                    <p className="text-2xl font-serif font-black gold-gradient">₹{s.price}</p>
                  </button>
                ))}
              </div>
              <button disabled={!selectedService} onClick={handleNext} className="w-full py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl uppercase">Continue</button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Select Professional</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                {professionals.filter(p => p.category === selectedCategory).map((p) => (
                  <button key={p.id} onClick={() => setSelectedProfessional(p.id)} className={`p-6 rounded-3xl border transition-all flex items-center gap-6 ${selectedProfessional === p.id ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-white/30'}`}>
                    <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-full object-cover grayscale" />
                    <div className="text-left">
                      <p className="font-bold uppercase tracking-tight">{p.name}</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest">Master Artist</p>
                    </div>
                  </button>
                ))}
              </div>
              <button disabled={!selectedProfessional} onClick={handleNext} className="w-full py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl uppercase">Continue</button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Select Date</h3>
              <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:border-gold outline-none mb-12" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              <button disabled={!selectedDate} onClick={handleNext} className="w-full py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl uppercase">Continue</button>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Select Time Slot</h3>
              <div className="grid grid-cols-4 gap-2 mb-12">
                {times.map((t) => (
                  <button key={t} onClick={() => setSelectedTime(t)} className={`py-4 rounded-xl border text-[10px] font-black tracking-widest transition-all ${selectedTime === t ? 'border-gold bg-gold text-dark-900' : 'border-white/10 hover:border-white/30'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <button disabled={!selectedTime} onClick={handleNext} className="w-full py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl uppercase">Review Details</button>
            </div>
          )}

          {step === 6 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8 text-center">Review Booking</h3>
              <div className="glass p-8 rounded-3xl border border-white/10 mb-12 space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-4">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">Category</span>
                  <span className="font-bold uppercase tracking-tighter">{selectedCategory}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-4">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">Service</span>
                  <span className="font-bold uppercase tracking-tighter">{services.find(s=>s.id===selectedService)?.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-4">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">Specialist</span>
                  <span className="font-bold uppercase tracking-tighter">{professionals.find(p=>p.id===selectedProfessional)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">Schedule</span>
                  <span className="font-bold uppercase tracking-tighter">{selectedDate} @ {selectedTime}</span>
                </div>
              </div>
              <button onClick={handleNext} className="w-full py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl uppercase">Proceed to Payment</button>
            </div>
          )}

          {step === 7 && (
            <div className="animate-fadeIn text-center py-10">
              <div className="w-20 h-20 border-2 border-gold rounded-full flex items-center justify-center mx-auto mb-8">
                <div className="w-10 h-10 bg-gold/20 rounded-full animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-4">Initializing Secure Session</h3>
              <p className="text-white/40 mb-12">Connecting to our secure payment gateway...</p>
              <button onClick={() => onSubmit({})} className="w-full py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl uppercase">Pay Now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
