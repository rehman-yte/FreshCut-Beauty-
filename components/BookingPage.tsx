
import React, { useState } from 'react';
import { Professional, Service, Category } from '../types';

interface BookingPageProps {
  type: Category;
  professionals: Professional[];
  services: Service[];
  onSubmit: (data: { professionalId: string; serviceId: string; date: string; time: string }) => void;
  onBack: () => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({ type, professionals, services, onSubmit, onBack }) => {
  const [step, setStep] = useState(1);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 animate-fadeIn flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-2 block">{type} experience</span>
            <h2 className="text-4xl font-serif font-black uppercase tracking-tighter gold-gradient">Reserve Your Slot</h2>
          </div>
          <button onClick={onBack} className="text-white/40 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase">Go Back</button>
        </div>

        <div className="glass rounded-[2.5rem] p-10 md:p-16 border border-white/10">
          {/* Progress Bar */}
          <div className="flex space-x-2 mb-12 max-w-xs">
            {[1, 2, 3].map((i) => <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= i ? 'bg-gold' : 'bg-white/10'}`} />)}
          </div>

          {step === 1 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Select Service</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {services.map((s) => (
                  <button key={s.id} onClick={() => setSelectedService(s.id)} className={`p-8 rounded-3xl border transition-all text-left flex justify-between items-center group ${selectedService === s.id ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-white/30'}`}>
                    <div>
                      <p className="font-bold uppercase tracking-tight group-hover:text-gold transition-colors">{s.name}</p>
                      <p className="text-[10px] font-black text-white/30 uppercase">{s.duration_mins} MINS</p>
                    </div>
                    <p className="text-2xl font-serif font-black gold-gradient">₹{s.price}</p>
                  </button>
                ))}
              </div>
              <button disabled={!selectedService} onClick={() => setStep(2)} className="w-full py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl disabled:opacity-20 transition-all uppercase">Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Select Specialist</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                {professionals.map((p) => (
                  <button key={p.id} onClick={() => setSelectedProfessional(p.id)} className={`p-6 rounded-3xl border transition-all flex items-center gap-6 ${selectedProfessional === p.id ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-white/30'}`}>
                    <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-full object-cover grayscale" />
                    <div className="text-left">
                      <p className="font-bold uppercase tracking-tight">{p.name}</p>
                      <p className="text-[9px] text-white/40 uppercase">{p.specialties.join(', ')}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-5 border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase">Back</button>
                <button disabled={!selectedProfessional} onClick={() => setStep(3)} className="flex-[2] py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl disabled:opacity-20 uppercase">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Pick Slot</h3>
              <div className="space-y-8 mb-12">
                <div>
                  <label className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-3 block">Date</label>
                  <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:border-gold outline-none" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-3 block">Time</label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {times.map((t) => (
                      <button key={t} onClick={() => setSelectedTime(t)} className={`py-4 rounded-xl border text-[10px] font-black tracking-widest transition-all ${selectedTime === t ? 'border-gold bg-gold text-dark-900' : 'border-white/10 hover:border-white/30'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 py-5 border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase">Back</button>
                <button disabled={!selectedDate || !selectedTime} onClick={() => onSubmit({ professionalId: selectedProfessional, serviceId: selectedService, date: selectedDate, time: selectedTime })} className="flex-[2] py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20">Confirm Booking</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
