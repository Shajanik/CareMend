
import React from 'react';
import { Doctor } from '../types';
import CustomButton from '../components/CustomButton';

interface Props {
  doc: Doctor;
  onBack: () => void;
  onBook: () => void;
}

const DocDetail: React.FC<Props> = ({ doc, onBack, onBook }) => {
  return (
    <div className="w-full flex flex-col lg:flex-row h-screen bg-white overflow-hidden">
      {/* Left Side - Doctor Profile (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#a32626] flex-col justify-center items-center relative overflow-hidden text-center px-10 py-12">
        <div className="relative z-10 w-full flex flex-col items-center gap-4">
          <div className="w-40 h-40 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-white text-7xl shadow-2xl border-4 border-white/30">
            <i className="fas fa-user-md"></i>
          </div>
          <h1 className="text-white text-4xl font-black uppercase tracking-tighter leading-none">
            {doc.name}
          </h1>
          <p className="text-white/70 text-sm font-bold uppercase tracking-widest">
            {doc.specialist}
          </p>
          <div className="px-5 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-black uppercase tracking-[0.2em]">
            {doc.experience} Experience
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-black/10 rounded-full blur-2xl"></div>
      </div>

      {/* Right Side - Details & Booking */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-8 pt-6 pb-2">
          <button onClick={onBack} className="btn-back" aria-label="Go back">
            <i className="fas fa-arrow-left icon-md"></i>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-8 md:px-16 pb-8">
          <div className="max-w-xl mx-auto w-full space-y-6">

            {/* Mobile doctor info */}
            <div className="lg:hidden flex flex-col items-center mb-4 text-center">
              <div className="w-28 h-28 bg-[#fdf2f2] rounded-[2rem] flex items-center justify-center text-[#a32626] text-5xl shadow-xl mb-4 border-4 border-white">
                <i className="fas fa-user-md"></i>
              </div>
              <h2 className="text-[#a32626] text-3xl font-black uppercase tracking-tighter leading-none mb-1">{doc.name}</h2>
              <p className="text-neutral-400 font-bold text-xs uppercase tracking-widest">{doc.specialist}</p>
            </div>

            {/* Professional Details */}
            <div className="space-y-3">
              <h3 className="text-neutral-400 font-black text-xs uppercase tracking-[0.2em]">Professional Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: 'fa-hospital',        label: 'Affiliated Hospital', value: doc.hospital },
                  { icon: 'fa-map-marker-alt',  label: 'Location',            value: doc.location },
                ].map(item => (
                  <div key={item.label} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex flex-col gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#a32626] shadow-sm">
                      <i className={`fas ${item.icon} icon-md`}></i>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] uppercase font-black tracking-widest mb-0.5">{item.label}</p>
                      <p className="text-[#a32626] font-black text-base uppercase tracking-tight leading-tight">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Background */}
            <div className="space-y-3">
              <h3 className="text-neutral-400 font-black text-xs uppercase tracking-[0.2em]">Clinical Background</h3>
              <div className="bg-[#fdf2f2] p-6 rounded-2xl border border-[#a32626]/10">
                <h4 className="text-[#a32626] font-black text-base uppercase tracking-tighter mb-3 flex items-center gap-2">
                  <i className="fas fa-info-circle icon-md"></i> About Doctor
                </h4>
                <p className="text-neutral-600 font-medium text-sm leading-relaxed italic">
                  "Highly skilled {doc.specialist} with over {doc.experience} in the field of {doc.disease} care. Recognised for clinical excellence at {doc.hospital}. Dedicated to providing comprehensive, patient-centred care with a focus on long-term bone health and recovery."
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <CustomButton label="Book an Appointment" onClick={onBook} />
              <p className="text-center text-neutral-400 text-[10px] font-bold uppercase tracking-widest mt-4">
                Instant confirmation • Verified specialist
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocDetail;




