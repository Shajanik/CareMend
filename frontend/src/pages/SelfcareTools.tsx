
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  onBack: () => void;
  onSelectCategory: (cat: string) => void;
}

const SelfcareTools: React.FC<Props> = ({ onBack, onSelectCategory }) => {
  const categories = [
    { id: 'MEDITATION', title: "Meditation",            icon: "fa-om",       img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=300&auto=format&fit=crop" },
    { id: 'WALKING',    title: "Walking Tracker",       icon: "fa-walking",  img: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=300&auto=format&fit=crop" },
    { id: 'EXERCISE_COACH', title: "Personalized Exercise Coach", icon: "fa-dumbbell", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=300&auto=format&fit=crop" },
  ];

  return (
    <div className="w-full flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="cm-header">
        <div className="cm-header-inner">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="btn-back" aria-label="Go back">
              <i className="fas fa-arrow-left icon-md"></i>
            </button>
            <h2 className="text-[#a32626] text-xl font-black uppercase tracking-tighter">Selfcare Tools</h2>
          </div>
          <p className="hidden md:block text-neutral-400 font-bold text-xs uppercase tracking-widest">Nurture your body and mind</p>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 max-w-4xl mx-auto">
          {categories.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-neutral-100 hover:shadow-2xl hover:-translate-y-2 transition-all text-left group h-full"
            >
              <div className="relative h-48 w-full overflow-hidden">
                 <img src={cat.img} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                 <div className="absolute top-4 right-4 card-icon-box-dark">
                    <i className={`fas ${cat.icon} icon-md`}></i>
                 </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <span className="text-[#a32626] font-black text-lg leading-tight uppercase tracking-tight mb-4">
                  {cat.title}
                </span>
                <div className="flex items-center gap-2 text-neutral-400 font-bold text-xs uppercase tracking-[0.15em] group-hover:text-[#a32626] transition-colors">
                  <span>Explore Now</span>
                  <i className="fas fa-chevron-right icon-sm"></i>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SelfcareTools;




