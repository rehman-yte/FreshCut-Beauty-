
import React, { useState } from 'react';
import { Barber, Service } from '../types';

interface BookingPageProps {
  type: 'gents' | 'ladies';
  barbers: Barber[];
  services: Service[];
  onSubmit: (data: { barberId: string; serviceId: string; date: string; time: string }) => void;
  onBack: () => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({ type, barbers, services, onSubmit, onBack }) => {
  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => step === 1 ? onBack() : setStep(step - 1);

  const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 animate-fadeIn flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-2 block">{type} experience</span>
            <h2 className="text-4xl font-serif font-black uppercase tracking-tighter gold-gradient">Book Your Slot</h2>
          </div>
          <button onClick={onBack} className="text-white/40 hover:text-white transition-all flex items-center gap-2 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-[10px] font-black tracking-widest uppercase">Go Back</span>
          </button>
        </div>

        <div className="glass rounded-[2.5rem] p-10 md:p-16 border border-white/10 relative overflow-hidden">
          <div className="flex space-x-2 mb-12 max-w-xs">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= i ? 'bg-gold' : 'bg-white/10'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Select Service</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`p-8 rounded-3xl border transition-all duration-300 flex justify-between items-center group ${selectedService === service.id ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-lg mb-1 uppercase tracking-tight group-hover:text-gold transition-colors">{service.name}</p>
                      <p className="text-xs font-black tracking-widest text-white/30 uppercase">{service.duration_mins} MINS</p>
                    </div>
                    <p className="text-2xl font-serif font-black gold-gradient">₹{service.price}</p>
                  </button>
                ))}
              </div>
              <button 
                disabled={!selectedService}
                onClick={handleNext}
                className="w-full py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl hover:bg-gold-light disabled:opacity-20 disabled:cursor-not-allowed transition-all transform active:scale-95"
              >
                CONTINUE TO EXPERTS
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Select Specialist</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                {barbers.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => setSelectedBarber(barber.id)}
                    className={`p-6 rounded-3xl border transition-all duration-300 flex items-center gap-6 ${selectedBarber === barber.id ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <img src={barber.image_url} alt={barber.name} className="w-20 h-20 rounded-2xl object-cover grayscale group-hover:grayscale-0" />
                    <div className="text-left">
                      <p className="font-bold uppercase tracking-tight">{barber.name}</p>
                      <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2 mt-1">{barber.bio}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={handlePrev} className="flex-1 py-5 border border-white/10 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-white/5 transition-all">Back</button>
                <button 
                  disabled={!selectedBarber}
                  onClick={handleNext}
                  className="flex-[2] py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl hover:bg-gold-light disabled:opacity-20 transition-all transform active:scale-95"
                >
                  PICK YOUR TIME
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Schedule Slot</h3>
              <div className="space-y-8 mb-12">
                <div>
                  <label className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-3 block">Pick Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-gold transition-colors"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-3 block">Pick Time</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {times.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`py-4 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all ${selectedTime === t ? 'border-gold bg-gold text-dark-900' : 'border-white/10 hover:border-white/30'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={handlePrev} className="flex-1 py-5 border border-white/10 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-white/5 transition-all">Back</button>
                <button 
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => onSubmit({ barberId: selectedBarber, serviceId: selectedService, date: selectedDate, time: selectedTime })}
                  className="flex-[2] py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl hover:bg-gold-light disabled:opacity-20 transition-all transform active:scale-95"
                >
                  CONFIRM APPOINTMENT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
