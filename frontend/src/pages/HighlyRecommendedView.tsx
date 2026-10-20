
import React from 'react';

interface Props {
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  onBack: () => void;
}

const HighlyRecommendedView: React.FC<Props> = ({ riskCategory, onBack }) => {
  const walkingDetails = {
    HIGH: {
      time: "10:00 AM - 11:00 AM",
      duration: "10-15 Minutes",
      pace: "Comfortable Pace",
      intensity: "Very Light",
      tips: [
        "Focus on slow, steady steps.",
        "Ensure you are walking on a level surface.",
        "Take breaks as soon as you feel any discomfort."
      ]
    },
    MEDIUM: {
      time: "7:00 AM - 9:00 AM",
      duration: "20-30 Minutes",
      pace: "Brisk Walking",
      intensity: "Moderate",
      tips: [
        "Maintain a steady rhythm.",
        "Swing arms naturally to improve balance.",
        "Hydrate properly before and after."
      ]
    },
    LOW: {
      time: "6:00 AM - 8:00 AM",
      duration: "30-45 Minutes",
      pace: "Jogging / Strenuous",
      intensity: "High Impact",
      tips: [
        "Use proper running form to avoid joint strain.",
        "Mix jogging with short intervals of walking.",
        "Ideal for maintaining high bone mineral density."
      ]
    }
  };

  const current = walkingDetails[riskCategory];

  return (
    <div className="w-full flex flex-col min-h-screen bg-white relative overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="w-full flex items-center py-6 px-8 border-b border-neutral-100 sticky top-0 bg-white z-[100]">
        <button 
          onClick={onBack} 
          className="w-10 h-10 flex items-center justify-center text-[#a32626] text-2xl hover:bg-[#fdf2f2] rounded-xl transition-colors mr-4"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="w-10 h-10 bg-[#fdf2f2] rounded-xl flex items-center justify-center text-[#a32626] mr-3">
          <i className="fas fa-star"></i>
        </div>
        <div>
          <h3 className="text-[#a32626] font-black text-lg uppercase tracking-tight">Highly Recommended</h3>
          <div className="flex items-center space-x-2">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Plan for</p>
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black text-white ${
              riskCategory === 'HIGH' ? 'bg-red-600' : riskCategory === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-600'
            }`}>
              {riskCategory} RISK
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Image Section */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#a32626] rounded-[4rem] rotate-3 group-hover:rotate-0 transition-transform duration-500 opacity-10"></div>
            <div className="relative h-[500px] w-full rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=800" 
                alt="Walking" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#a32626]/60 to-transparent"></div>
              <div className="absolute bottom-10 left-10">
                <span className="bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] border border-white/30">
                  Targeted Activity
                </span>
                <h4 className="text-white text-5xl font-black uppercase tracking-tighter mt-4 leading-none">
                  {current.pace}
                </h4>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-10">
            <div className="space-y-4">
              <h4 className="text-neutral-400 font-black text-xs uppercase tracking-[0.2em]">Activity Overview</h4>
              <p className="text-neutral-500 font-bold text-sm leading-relaxed max-w-md uppercase tracking-widest text-[10px]">
                A tailored activity plan based on your {riskCategory.toLowerCase()} risk profile to maximize bone-building stimulus while ensuring maximum safety.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="bg-neutral-50 p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#a32626] mb-4 shadow-sm">
                    <i className="fas fa-clock"></i>
                  </div>
                  <p className="text-neutral-400 font-black text-[9px] uppercase tracking-widest mb-1">Time Range</p>
                  <p className="text-[#a32626] font-black text-sm leading-tight">{current.time}</p>
               </div>
               <div className="bg-neutral-50 p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#a32626] mb-4 shadow-sm">
                    <i className="fas fa-hourglass-half"></i>
                  </div>
                  <p className="text-neutral-400 font-black text-[9px] uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-[#a32626] font-black text-sm">{current.duration}</p>
               </div>
            </div>

            <section className="bg-[#fdf2f2] p-10 rounded-[3rem] border border-[#a32626]/10 shadow-xl">
               <div className="flex items-center space-x-4 mb-8">
                 <div className="w-12 h-12 bg-[#a32626] rounded-2xl flex items-center justify-center text-white text-xl">
                   <i className="fas fa-shield-alt"></i>
                 </div>
                 <h4 className="text-[#a32626] font-black text-xl uppercase tracking-tighter">Recommended Strategy</h4>
               </div>
               <ul className="space-y-6">
                  {current.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start space-x-4 text-neutral-600 font-bold text-xs leading-relaxed">
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#a32626] shadow-sm flex-shrink-0 mt-0.5">
                        <i className="fas fa-check text-[8px]"></i>
                      </div>
                      <span>{tip}</span>
                    </li>
                  ))}
               </ul>
            </section>

            <div className="pt-4 flex items-center justify-between border-t border-neutral-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <i className="fas fa-info-circle"></i>
                </div>
                <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-widest">
                  Consult your physiotherapist <br/>before starting any new routine.
                </p>
              </div>
              <button className="text-[#a32626] font-black text-[10px] uppercase tracking-widest underline hover:opacity-70 transition-opacity">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlyRecommendedView;




