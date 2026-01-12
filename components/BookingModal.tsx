
import React, { useState, useEffect } from 'react';
// Changed Barber to Professional as per types.ts
import { Professional, Service } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Changed barbers to professionals
  professionals: Professional[];
  services: Service[];
  onSubmit: (data: { professionalId: string; serviceId: string; date: string; time: string }) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, professionals, services, onSubmit }) => {
  const [step, setStep] = useState(1);
  // Changed selectedBarber to selectedProfessional
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  if (!isOpen) return null;

  const handleBack = () => setStep(step - 1);
  const handleNext = () => setStep(step + 1);

  const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-2xl border border-white/20">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-gold">Schedule Your Appointment</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex space-x-2 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-gold' : 'bg-white/10'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <p className="text-lg font-medium">Select a Specialist</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {professionals.map((professional) => (
                  <button
                    key={professional.id}
                    onClick={() => setSelectedProfessional(professional.id)}
                    className={`p-4 rounded-2xl border transition-all ${selectedProfessional === professional.id ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <img src={professional.image_url} alt={professional.name} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-gold/30" />
                    <p className="text-sm font-semibold text-center">{professional.name}</p>
                  </button>
                ))}
              </div>
              <button 
                disabled={!selectedProfessional}
                onClick={handleNext}
                className="w-full py-4 bg-gold text-dark-900 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-light transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <p className="text-lg font-medium">Choose a Service</p>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`w-full flex justify-between items-center p-4 rounded-xl border transition-all ${selectedService === service.id ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="text-left">
                      <p className="font-bold">{service.name}</p>
                      <p className="text-sm text-white/50">{service.duration_mins} mins</p>
                    </div>
                    <p className="font-serif font-bold text-gold">₹{service.price}</p>
                  </button>
                ))}
              </div>
              <div className="flex space-x-4">
                <button onClick={handleBack} className="flex-1 py-4 border border-white/20 rounded-xl font-bold hover:bg-white/5">Back</button>
                <button 
                  disabled={!selectedService}
                  onClick={handleNext}
                  className="flex-[2] py-4 bg-gold text-dark-900 font-bold rounded-xl disabled:opacity-50 hover:bg-gold-light transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <p className="text-lg font-medium">Select Date & Time</p>
              <div className="space-y-4">
                <input 
                  type="date" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-gold"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <div className="grid grid-cols-4 gap-2">
                  {times.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`py-3 rounded-lg border text-sm transition-all ${selectedTime === t ? 'border-gold bg-gold text-dark-900 font-bold' : 'border-white/10 hover:border-white/30'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4">
                <button onClick={handleBack} className="flex-1 py-4 border border-white/20 rounded-xl font-bold hover:bg-white/5">Back</button>
                <button 
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => onSubmit({ professionalId: selectedProfessional, serviceId: selectedService, date: selectedDate, time: selectedTime })}
                  className="flex-[2] py-4 bg-gold text-dark-900 font-bold rounded-xl disabled:opacity-50 hover:bg-gold-light transition-all"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
