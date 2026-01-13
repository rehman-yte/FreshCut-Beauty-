import React, { useState } from 'react';
import { Professional, Service, Category } from '../types.ts';
import { supabase } from '../supabase.ts';

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
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'PhonePe' | 'GPay' | 'Paytm' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const selectedService = services.find(s => s.id === selectedServiceId);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => step === 1 ? onBack() : setStep(step - 1);

  const handlePaymentAndConfirm = async () => {
    setIsProcessing(true);
    // Simulate UPI Intent Gateway Transaction
    setTimeout(async () => {
      const { data: bookingData, error } = await supabase.from('bookings').insert([{
        customer_id: JSON.parse(localStorage.getItem('freshcut_session') || '{}').id,
        service_id: selectedServiceId,
        appointment_time: `${selectedDate}T${selectedTime}:00Z`,
        status: 'booked',
        notes: `Payment via ${paymentMethod}`
      }]).select().single();

      if (!error) {
        await supabase.from('notifications').insert([{
          type: 'booking_confirmed',
          message: `New booking: ${selectedService?.name} - Finalized via ${paymentMethod}`,
          reference_id: bookingData.id,
          is_read: false
        }]);
        onSubmit(bookingData);
      } else {
        alert("System encountered financial synchronization error.");
      }
      setIsProcessing(false);
    }, 2000);
  };

  const TOTAL_STEPS = 6;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 animate-fadeIn flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-2 block">Instruction {step} OF {TOTAL_STEPS}</span>
            <h2 className="text-4xl font-serif font-black uppercase tracking-tighter gold-gradient">Artisan Reservation</h2>
          </div>
          <button onClick={handleBack} className="text-white/40 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase border-b border-transparent hover:border-gold pb-1">Previous Instruction</button>
        </div>

        <div className="glass rounded-[2.5rem] p-10 md:p-16 border border-white/10 shadow-2xl relative overflow-hidden">
          {step === 1 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-center text-white/90 italic">Identify Category Protocol</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <button onClick={() => { setSelectedCategory('gents'); handleNext(); }} className="p-16 border border-white/5 bg-white/[0.02] rounded-[2.5rem] hover:border-gold hover:bg-gold/5 transition-all text-center group shadow-xl">
                  <h4 className="text-2xl font-serif font-black uppercase tracking-widest mb-3 group-hover:text-gold transition-colors">Artisan Barber</h4>
                  <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.3em]">Gents Exclusive Suite</p>
                </button>
                <button onClick={() => { setSelectedCategory('ladies'); handleNext(); }} className="p-16 border border-white/5 bg-white/[0.02] rounded-[2.5rem] hover:border-gold hover:bg-gold/5 transition-all text-center group shadow-xl">
                  <h4 className="text-2xl font-serif font-black uppercase tracking-widest mb-3 group-hover:text-gold transition-colors">Artisan Parlour</h4>
                  <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.3em]">Ladies Couture Suite</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-white/90 italic">Select Unit Service</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
                {services.filter(s => s.category === selectedCategory).map((s) => (
                  <button key={s.id} onClick={() => setSelectedServiceId(s.id)} className={`p-10 rounded-[2rem] border transition-all text-left flex justify-between items-center group shadow-lg ${selectedServiceId === s.id ? 'border-gold bg-gold/10' : 'border-white/5 bg-white/[0.01] hover:border-white/20'}`}>
                    <div>
                      <p className="font-bold uppercase tracking-tight group-hover:text-gold transition-colors mb-1">{s.name}</p>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{s.duration_mins} MIN PROTOCOL</p>
                    </div>
                    <span className="text-gold font-black">₹{s.price}</span>
                  </button>
                ))}
              </div>
              <button disabled={!selectedServiceId} onClick={handleNext} className="w-full py-6 bg-gold text-dark-900 text-[11px] font-black tracking-[0.4em] rounded-2xl uppercase shadow-xl shadow-gold/20 transform hover:scale-[1.01] transition-all disabled:opacity-30">Advance Protocol</button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-white/90 italic">Temporal Registry</h3>
              <input type="date" className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-white focus:border-gold outline-none mb-12 font-black uppercase tracking-widest text-[11px]" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              <button disabled={!selectedDate} onClick={handleNext} className="w-full py-6 bg-gold text-dark-900 text-[11px] font-black tracking-[0.4em] rounded-2xl uppercase shadow-xl shadow-gold/20 transform hover:scale-[1.01] transition-all disabled:opacity-30">Advance Protocol</button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-white/90 italic">Slot Allocation</h3>
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
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-center text-white/90 italic">Checkout Summary</h3>
              <div className="glass p-10 rounded-[2.5rem] border border-white/5 mb-12 space-y-6 shadow-inner">
                <div className="flex justify-between items-center border-b border-white/5 pb-5">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Protocol Set</span>
                  <span className="font-bold uppercase tracking-widest text-[11px]">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-5">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Temporal Slot</span>
                  <span className="font-bold uppercase tracking-widest text-[11px]">{selectedDate} @ {selectedTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Total Amount</span>
                  <span className="font-black text-gold text-2xl tracking-tighter">₹{selectedService?.price}</span>
                </div>
              </div>
              <button onClick={handleNext} className="w-full py-6 bg-gold text-dark-900 text-[11px] font-black tracking-[0.4em] rounded-2xl uppercase shadow-xl shadow-gold/20 transform hover:scale-[1.01] transition-all">Proceed to UPI Financials</button>
            </div>
          )}

          {step === 6 && (
            <div className="animate-fadeIn relative z-10">
              <h3 className="text-2xl font-serif font-black uppercase tracking-widest mb-10 text-center text-white/90 italic">Financial Authorization</h3>
              <div className="grid grid-cols-1 gap-4 mb-12">
                {['PhonePe', 'GPay', 'Paytm'].map((method) => (
                  <button key={method} onClick={() => setPaymentMethod(method as any)} className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${paymentMethod === method ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-white/30'}`}>
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/70">{method} Intent</span>
                    <div className={`w-3 h-3 rounded-full border-2 ${paymentMethod === method ? 'border-gold bg-gold' : 'border-white/20'}`} />
                  </button>
                ))}
              </div>
              <button disabled={!paymentMethod || isProcessing} onClick={handlePaymentAndConfirm} className="w-full py-6 bg-gold text-dark-900 text-[11px] font-black tracking-[0.4em] rounded-2xl uppercase shadow-2xl shadow-gold/30 transform hover:scale-[1.01] transition-all disabled:opacity-30">
                {isProcessing ? 'Synchronizing Ledger...' : 'Authorize Transaction'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};