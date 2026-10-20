
import React, { useState } from 'react';
import CustomButton from '../components/CustomButton';

interface Props {
  onBack: () => void;
  onConfirmed: () => void;
}

const DocCalendar: React.FC<Props> = ({ onBack, onConfirmed }) => {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleBook = () => {
    if (selectedDate === null) return;
    setIsBooking(true);
    // Simulate booking process: checking doctor's availability
    setTimeout(() => {
      onConfirmed();
    }, 2500);
  };

  if (isBooking) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-screen text-center space-y-12 bg-white">
        <div className="relative">
          <div className="w-48 h-48 border-[12px] border-[#a32626]/10 border-t-[#a32626] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[#a32626] text-4xl">
            <i className="fas fa-calendar-check animate-bounce"></i>
          </div>
        </div>
        <div className="space-y-6 max-w-md">
          <h2 className="text-[#a32626] text-5xl font-black uppercase tracking-tighter leading-none">
            Verifying <br/>Availability
          </h2>
          <p className="text-neutral-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
            Connecting with the specialist's schedule to confirm your appointment request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-white relative overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="w-full flex items-center py-6 px-8 border-b border-neutral-100 sticky top-0 bg-white z-[50]">
        <button 
          onClick={onBack} 
          className="w-10 h-10 flex items-center justify-center text-[#a32626] text-2xl hover:bg-[#fdf2f2] rounded-xl transition-colors mr-4"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="w-10 h-10 bg-[#fdf2f2] rounded-xl flex items-center justify-center text-[#a32626] mr-3">
          <i className="fas fa-calendar-alt"></i>
        </div>
        <div>
          <h3 className="text-[#a32626] font-black text-lg uppercase tracking-tight">Schedule Appointment</h3>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Select your preferred date</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Calendar Section */}
          <div className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-[#a32626] font-black text-3xl uppercase tracking-tighter">October 2024</h3>
              <div className="flex space-x-4">
                 <button className="w-10 h-10 rounded-xl bg-[#fdf2f2] flex items-center justify-center text-[#a32626] hover:scale-110 transition-transform">
                   <i className="fas fa-chevron-left"></i>
                 </button>
                 <button className="w-10 h-10 rounded-xl bg-[#fdf2f2] flex items-center justify-center text-[#a32626] hover:scale-110 transition-transform">
                   <i className="fas fa-chevron-right"></i>
                 </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-3">
              {weekDays.map(d => (
                <div key={d} className="text-[#a32626] font-black text-[10px] uppercase text-center mb-4 tracking-widest opacity-50">{d}</div>
              ))}
              {days.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`aspect-square flex items-center justify-center rounded-2xl font-black text-sm transition-all
                    ${selectedDate === d 
                      ? 'bg-[#a32626] text-white shadow-xl scale-110' 
                      : 'text-neutral-500 hover:bg-[#fdf2f2] hover:text-[#a32626]'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Selection Summary Section */}
          <div className="space-y-8 lg:pt-10">
            <div className="space-y-4">
              <h4 className="text-neutral-400 font-black text-xs uppercase tracking-[0.2em]">Appointment Summary</h4>
              <div className={`p-10 rounded-[3rem] border-2 transition-all duration-500 ${
                selectedDate 
                  ? 'bg-[#fdf2f2] border-[#a32626]/20' 
                  : 'bg-neutral-50 border-neutral-100'
              }`}>
                {selectedDate ? (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-white rounded-[1.5rem] flex flex-col items-center justify-center text-[#a32626] shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">OCT</span>
                        <span className="text-3xl font-black leading-none">{selectedDate}</span>
                      </div>
                      <div>
                        <h5 className="text-[#a32626] font-black text-2xl uppercase tracking-tighter leading-tight">Confirmed <br/>Selection</h5>
                        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mt-1">October {selectedDate}, 2024</p>
                      </div>
                    </div>
                    <p className="text-neutral-500 font-bold text-xs leading-relaxed italic">
                      "Your request will be sent to the specialist for final confirmation. You will receive a notification once approved."
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-neutral-200 text-3xl">
                      <i className="fas fa-calendar-plus"></i>
                    </div>
                    <p className="text-neutral-400 font-bold text-sm uppercase tracking-widest">
                      Please select a date <br/>from the calendar
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6">
              <CustomButton 
                label="Confirm Appointment" 
                onClick={handleBook} 
                className={selectedDate === null ? 'opacity-50 pointer-events-none grayscale' : ''} 
              />
              <p className="text-center text-neutral-400 text-[10px] font-bold uppercase tracking-widest mt-6">
                Secure Booking • 24/7 Support
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocCalendar;




