
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Doctor } from '../types';

interface Props {
  disease: 'Osteoporosis';
  onBack: () => void;
  onSelectDoc: (doc: Doctor) => void;
}

interface ConsultRequest {
  doctorId: string;
  doctorName: string;
  date: string;
  symptoms: string;
  phone: string;
}

// Only bone-health-relevant specialties
const ALLOWED_SPECIALTIES = [
  'Orthopedic Surgeon',
  'Bone Health Specialist',
  'Rheumatologist',
  'Spine Specialist',
  'Geriatric Orthopedic Specialist',
];

const SPECIALTY_ICON: Record<string, string> = {
  'Orthopedic Surgeon':             '',
  'Bone Health Specialist':         '',
  'Rheumatologist':                 '',
  'Spine Specialist':               '',
  'Geriatric Orthopedic Specialist':'',
};;

const SPECIALTY_COLOR: Record<string, string> = {
  'Orthopedic Surgeon':             'bg-blue-50 text-blue-700 border-blue-200',
  'Bone Health Specialist':         'bg-purple-50 text-purple-700 border-purple-200',
  'Rheumatologist':                 'bg-green-50 text-green-700 border-green-200',
  'Spine Specialist':               'bg-orange-50 text-orange-700 border-orange-200',
  'Geriatric Orthopedic Specialist':'bg-teal-50 text-teal-700 border-teal-200',
};

// Bone-health-only doctor database
const DOCTOR_DATABASE: { [key: string]: Doctor[] } = {
  'Chennai': [
    { id: '1',  name: 'Dr. Priya Sharma',    location: 'Chennai',    hospital: 'Apollo Hospitals',      specialist: 'Orthopedic Surgeon',             experience: '15 Years', disease: 'Osteoporosis', distance: '2.3 km', rating: 4.8, timings: 'Monday 9:00 AM',  phone: '+91 98765 43210' },
    { id: '3',  name: 'Dr. Meera Nair',      location: 'Chennai',    hospital: 'MIOT International',    specialist: 'Rheumatologist',                 experience: '18 Years', disease: 'Osteoporosis', distance: '5.1 km', rating: 4.7, timings: 'Monday 9:00 AM',  phone: '+91 98765 43212' },
    { id: '9',  name: 'Dr. Vikram Singh',    location: 'Chennai',    hospital: 'Max Healthcare',        specialist: 'Orthopedic Surgeon',             experience: '14 Years', disease: 'Osteoporosis', distance: '1.9 km', rating: 4.7, timings: 'Monday 9:00 AM',  phone: '+91 98765 43218' },
    { id: '13', name: 'Dr. Lakshmi Iyer',    location: 'Chennai',    hospital: 'Sri Ramachandra Hospital', specialist: 'Bone Health Specialist',      experience: '11 Years', disease: 'Osteoporosis', distance: '4.2 km', rating: 4.6, timings: 'Monday 9:00 AM', phone: '+91 98765 43222' },
    { id: '14', name: 'Dr. Suresh Babu',     location: 'Chennai',    hospital: 'Kauvery Hospital',      specialist: 'Spine Specialist',               experience: '17 Years', disease: 'Osteoporosis', distance: '3.3 km', rating: 4.5, timings: 'Monday 9:00 AM',  phone: '+91 98765 43223' },
  ],
  'Bangalore': [
    { id: '4',  name: 'Dr. Arun Krishnan',   location: 'Bangalore',  hospital: 'Manipal Hospital',      specialist: 'Orthopedic Surgeon',             experience: '20 Years', disease: 'Osteoporosis', distance: '1.8 km', rating: 4.9, timings: 'Monday 9:00 AM',  phone: '+91 98765 43213' },
    { id: '10', name: 'Dr. Deepak Verma',    location: 'Bangalore',  hospital: 'Fortis Hospital',       specialist: 'Rheumatologist',                 experience: '16 Years', disease: 'Osteoporosis', distance: '2.7 km', rating: 4.8, timings: 'Monday 9:00 AM',  phone: '+91 98765 43219' },
    { id: '15', name: 'Dr. Nandita Rao',     location: 'Bangalore',  hospital: 'Narayana Health',       specialist: 'Bone Health Specialist',         experience: '12 Years', disease: 'Osteoporosis', distance: '3.5 km', rating: 4.6, timings: 'Monday 9:00 AM', phone: '+91 98765 43224' },
    { id: '16', name: 'Dr. Ramesh Gowda',    location: 'Bangalore',  hospital: 'BGS Gleneagles',        specialist: 'Geriatric Orthopedic Specialist', experience: '19 Years', disease: 'Osteoporosis', distance: '4.0 km', rating: 4.7, timings: 'Monday 9:00 AM',  phone: '+91 98765 43225' },
  ],
  'Coimbatore': [
    { id: '6',  name: 'Dr. Karthik Raman',   location: 'Coimbatore', hospital: 'Kovai Medical Center',  specialist: 'Orthopedic Surgeon',             experience: '16 Years', disease: 'Osteoporosis', distance: '2.1 km', rating: 4.6, timings: 'Monday 9:00 AM',  phone: '+91 98765 43215' },
    { id: '17', name: 'Dr. Preethi Selvam',  location: 'Coimbatore', hospital: 'PSG Hospitals',         specialist: 'Bone Health Specialist',         experience: '10 Years', disease: 'Osteoporosis', distance: '3.0 km', rating: 4.5, timings: 'Monday 9:00 AM',  phone: '+91 98765 43226' },
    { id: '18', name: 'Dr. Murugan Pillai',  location: 'Coimbatore', hospital: 'G. Kuppuswamy Hospital', specialist: 'Spine Specialist',              experience: '14 Years', disease: 'Osteoporosis', distance: '2.8 km', rating: 4.6, timings: 'Monday 9:00 AM',  phone: '+91 98765 43227' },
  ],
  'Mumbai': [
    { id: '7',  name: 'Dr. Vikram Patel',    location: 'Mumbai',     hospital: 'Lilavati Hospital',     specialist: 'Rheumatologist',                 experience: '22 Years', disease: 'Osteoporosis', distance: '3.5 km', rating: 4.8, timings: 'Monday 9:00 AM', phone: '+91 98765 43216' },
    { id: '12', name: 'Dr. Rohan Desai',     location: 'Mumbai',     hospital: 'Apollo Hospitals',      specialist: 'Orthopedic Surgeon',             experience: '19 Years', disease: 'Osteoporosis', distance: '2.2 km', rating: 4.9, timings: 'Monday 9:00 AM',  phone: '+91 98765 43221' },
    { id: '19', name: 'Dr. Sneha Kulkarni',  location: 'Mumbai',     hospital: 'Hinduja Hospital',      specialist: 'Bone Health Specialist',         experience: '13 Years', disease: 'Osteoporosis', distance: '2.9 km', rating: 4.7, timings: 'Monday 9:00 AM',  phone: '+91 98765 43228' },
    { id: '20', name: 'Dr. Ashok Mehta',     location: 'Mumbai',     hospital: 'Kokilaben Hospital',    specialist: 'Geriatric Orthopedic Specialist', experience: '24 Years', disease: 'Osteoporosis', distance: '4.1 km', rating: 4.8, timings: 'Monday 9:00 AM', phone: '+91 98765 43229' },
  ],
  'Hyderabad': [
    { id: '21', name: 'Dr. Padma Reddy',     location: 'Hyderabad',  hospital: 'KIMS Hospital',         specialist: 'Orthopedic Surgeon',             experience: '17 Years', disease: 'Osteoporosis', distance: '2.5 km', rating: 4.7, timings: 'Monday 9:00 AM',  phone: '+91 98765 43230' },
    { id: '22', name: 'Dr. Srinivas Rao',    location: 'Hyderabad',  hospital: 'Yashoda Hospitals',     specialist: 'Rheumatologist',                 experience: '15 Years', disease: 'Osteoporosis', distance: '3.2 km', rating: 4.6, timings: 'Monday 9:00 AM', phone: '+91 98765 43231' },
    { id: '23', name: 'Dr. Kavitha Nair',    location: 'Hyderabad',  hospital: 'Apollo Hospitals',      specialist: 'Bone Health Specialist',         experience: '12 Years', disease: 'Osteoporosis', distance: '1.7 km', rating: 4.8, timings: 'Monday 9:00 AM',  phone: '+91 98765 43232' },
  ],
};

const DocList: React.FC<Props> = ({ disease, onBack, onSelectDoc }) => {
  const [selectedCity, setSelectedCity] = useState('Chennai');
  const [filteredDocs, setFilteredDocs] = useState<Doctor[]>([]);
  const [savedDoctors, setSavedDoctors] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'experience'>('rating');
  const [consultModal, setConsultModal] = useState<{ open: boolean; doc: Doctor | null }>({ open: false, doc: null });
  const [consultForm, setConsultForm] = useState({ date: '', symptoms: '', phone: '' });
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  useEffect(() => {
    let cityDoctors = DOCTOR_DATABASE[selectedCity] || [];
    // Only bone-health-relevant specialties
    cityDoctors = cityDoctors.filter(d =>
      d.disease === disease && ALLOWED_SPECIALTIES.includes(d.specialist)
    );
    if (selectedSpecialty) {
      cityDoctors = cityDoctors.filter(d => d.specialist === selectedSpecialty);
    }
    const sorted = [...cityDoctors].sort((a, b) => {
      if (sortBy === 'rating')     return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'distance')   return parseFloat(a.distance || '0') - parseFloat(b.distance || '0');
      if (sortBy === 'experience') return parseInt(b.experience) - parseInt(a.experience);
      return 0;
    });
    setFilteredDocs(sorted);
  }, [selectedCity, disease, selectedSpecialty, sortBy]);

  useEffect(() => {
    const saved = localStorage.getItem('caremend_saved_doctors');
    if (saved) {
      setSavedDoctors(JSON.parse(saved));
    }
  }, []);

  const toggleSaveDoctor = (doctorId: string) => {
    const newSaved = savedDoctors.includes(doctorId)
      ? savedDoctors.filter(id => id !== doctorId)
      : [...savedDoctors, doctorId];
    
    setSavedDoctors(newSaved);
    localStorage.setItem('caremend_saved_doctors', JSON.stringify(newSaved));
  };

  const handleCallClinic = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleGetDirections = (hospital: string, location: string) => {
    const query = `${hospital} ${location}`;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const msg = `Hi, I'd like to inquire about a bone health consultation with ${name}.`;
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const openConsultModal = (doc: Doctor) => {
    setConsultModal({ open: true, doc });
    setConsultForm({ date: '', symptoms: '', phone: '' });
    setConsultSubmitted(false);
  };

  const submitConsultRequest = () => {
    if (!consultForm.date || !consultForm.phone) return;
    const requests: ConsultRequest[] = JSON.parse(localStorage.getItem('caremend_consult_requests') || '[]');
    requests.push({
      doctorId:   consultModal.doc!.id,
      doctorName: consultModal.doc!.name,
      date:       consultForm.date,
      symptoms:   consultForm.symptoms,
      phone:      consultForm.phone,
    });
    localStorage.setItem('caremend_consult_requests', JSON.stringify(requests));
    setConsultSubmitted(true);
    setTimeout(() => setConsultModal({ open: false, doc: null }), 2000);
  };

  // Available specialties for current city (bone-health only)
  const availableSpecialties = Array.from(
    new Set((DOCTOR_DATABASE[selectedCity] || [])
      .filter(d => ALLOWED_SPECIALTIES.includes(d.specialist))
      .map(d => d.specialist))
  );

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack}
              className="w-10 h-10 flex items-center justify-center text-[#a32626] hover:bg-red-50 rounded-xl transition-colors">
              <i className="fas fa-arrow-left text-lg" />
            </button>
            <div className="w-10 h-10 bg-[#fdf2f2] rounded-xl flex items-center justify-center text-[#a32626]">
              <i className="fas fa-bone" />
            </div>
            <div>
              <h1 className="text-[#a32626] font-black text-lg uppercase tracking-tight">Doctor Connectivity</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Bone Health Specialists</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[#a32626] font-black text-2xl leading-none">{filteredDocs.length}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Available</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                <i className="fas fa-map-marker-alt text-[#a32626]" /> City
              </p>
              <select value={selectedCity}
                onChange={e => { setSelectedCity(e.target.value); setSelectedSpecialty(null); }}
                className="w-full text-[#a32626] font-black text-sm bg-transparent border-none outline-none cursor-pointer">
                {['Chennai','Bangalore','Coimbatore','Mumbai','Hyderabad'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                <i className="fas fa-sort text-[#a32626]" /> Sort
              </p>
              <select value={sortBy}
                onChange={e => setSortBy(e.target.value as 'rating' | 'distance' | 'experience')}
                className="w-full text-[#a32626] font-black text-sm bg-transparent border-none outline-none cursor-pointer">
                <option value="rating">Top Rated</option>
                <option value="distance">Nearest First</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>
          </div>

          {/* Specialty chips */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedSpecialty(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight border transition-all ${
                selectedSpecialty === null ? 'bg-[#a32626] text-white border-[#a32626]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#a32626] hover:text-[#a32626]'
              }`}>All</button>
            {availableSpecialties.map(s => (
              <button key={s} onClick={() => setSelectedSpecialty(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight border transition-all ${
                  selectedSpecialty === s ? 'bg-[#a32626] text-white border-[#a32626]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#a32626] hover:text-[#a32626]'
                }`}>
                {s.replace(' Specialist','').replace(' Surgeon','')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Doctor Cards ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-user-md text-2xl text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold mb-1">No specialists found</p>
            <p className="text-sm text-gray-400">Try a different city or specialty filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {filteredDocs.map((doc, idx) => (
              <motion.div key={doc.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Card header */}
                <div className="p-5 flex items-start gap-4">
                  <div className="w-16 h-16 bg-[#fdf2f2] rounded-2xl flex items-center justify-center text-[#a32626] text-3xl flex-shrink-0">
                    <i className="fas fa-user-md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-gray-900 font-black text-base leading-tight">{doc.name}</h3>
                      <button onClick={() => toggleSaveDoctor(doc.id)}
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          savedDoctors.includes(doc.id) ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}>
                        <i className="fas fa-heart text-xs" />
                      </button>
                    </div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${SPECIALTY_COLOR[doc.specialist] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {SPECIALTY_ICON[doc.specialist]} {doc.specialist}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="px-5 pb-3 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-50 border border-yellow-100 rounded-full text-[10px] font-black text-yellow-700">
                    <i className="fas fa-star text-yellow-400 text-[9px]" />{doc.rating}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full text-[10px] font-black text-green-700">
                    <i className="fas fa-map-marker-alt text-[9px]" />{doc.distance}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black text-blue-700">
                    <i className="fas fa-briefcase-medical text-[9px]" />{doc.experience}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-100 rounded-full text-[10px] font-black text-purple-700">
                    <i className="fas fa-shield-alt text-[9px]" />Verified
                  </span>
                </div>

                {/* Details */}
                <div className="px-5 pb-4 space-y-2 border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-hospital text-[#a32626] w-4 text-center text-xs" />
                    <span className="font-semibold">{doc.hospital}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-clock text-[#a32626] w-4 text-center text-xs" />
                    <span>{doc.timings}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-map-marker-alt text-[#a32626] w-4 text-center text-xs" />
                    <span>{doc.location}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-5 pb-5 mt-auto space-y-2">
                  {/* Quick actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleCallClinic(doc.phone || '')}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700 text-xs font-bold rounded-xl shadow-sm transition-all">
                      <i className="fas fa-phone text-green-600 text-[11px]" />Call
                    </button>
                    <button onClick={() => handleGetDirections(doc.hospital, doc.location)}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-bold rounded-xl shadow-sm transition-all">
                      <i className="fas fa-directions text-blue-600 text-[11px]" />Route
                    </button>
                    <button onClick={() => handleWhatsApp(doc.phone || '', doc.name)}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700 text-xs font-bold rounded-xl shadow-sm transition-all">
                      <i className="fab fa-whatsapp text-green-500 text-[11px]" />Chat
                    </button>
                  </div>

                  {/* Offline consultation */}
                  <button onClick={() => openConsultModal(doc)}
                    className="w-full py-2.5 bg-white border border-gray-200 hover:border-[#a32626] hover:bg-red-50 text-gray-700 hover:text-[#a32626] font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-calendar-check text-[#a32626]" />
                    Request Offline Consultation
                  </button>

                  {/* Book appointment */}
                  <button 
                    type="button"
                    onClick={() => onSelectDoc(doc)}
                    style={{ backgroundColor: '#a32626', color: '#ffffff', fontWeight: '900' }}
                    className="w-full py-3 hover:opacity-90 text-white font-black text-sm uppercase tracking-tight rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-calendar-plus" />
                    Book Appointment
                    <i className="fas fa-arrow-right text-xs" />
                  </button>

                  {/* Reply time note */}
                  <p className="text-center text-[10px] text-gray-400 font-semibold">
                    <i className="fas fa-clock mr-1" />Doctor usually replies within 24 hours
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Map section */}
        {filteredDocs.length > 0 && (
          <div className="max-w-6xl mx-auto mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-[#a32626] font-black text-base uppercase tracking-tight">Clinic Locations</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {filteredDocs.length} specialist{filteredDocs.length !== 1 ? 's' : ''} in {selectedCity}
                </p>
              </div>
              <div className="w-10 h-10 bg-[#fdf2f2] rounded-xl flex items-center justify-center text-[#a32626]">
                <i className="fas fa-map-marked-alt" />
              </div>
            </div>
            <div className="relative h-52 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
              <div className="absolute inset-0 opacity-10 grid grid-cols-10 grid-rows-6">
                {[...Array(60)].map((_, i) => <div key={i} className="border border-blue-300" />)}
              </div>
              {filteredDocs.slice(0, 5).map((doc, i) => (
                <motion.div key={doc.id}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute group cursor-pointer"
                  style={{ left: `${12 + i * 14}%`, top: `${22 + (i % 2) * 28}%` }}
                  title={`${doc.name} — ${doc.hospital}`}>
                  <motion.i animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    className="fas fa-map-marker-alt text-2xl text-[#a32626] drop-shadow-md" />
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-lg shadow-md text-[10px] font-black text-[#a32626] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-100 z-10">
                    {doc.name}
                  </div>
                </motion.div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 px-6 py-4 text-center">
                  <p className="text-gray-900 font-black text-sm uppercase tracking-tight mb-1">{filteredDocs.length} Clinics in {selectedCity}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    Avg {(filteredDocs.reduce((s, d) => s + parseFloat(d.distance || '0'), 0) / filteredDocs.length).toFixed(1)} km away
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(`bone health orthopedic specialists ${selectedCity}`)}`, '_blank')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-[#a32626] hover:bg-red-50 text-gray-700 hover:text-[#a32626] text-xs font-bold rounded-lg shadow-sm transition-all">
                      <i className="fas fa-external-link-alt text-[10px]" />View on Map
                    </button>
                    <button onClick={() => { const n = filteredDocs.reduce((p, c) => parseFloat(p.distance||'99') < parseFloat(c.distance||'99') ? p : c); window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${n.hospital} ${n.location}`)}`, '_blank'); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700 text-xs font-bold rounded-lg shadow-sm transition-all">
                      <i className="fas fa-route text-[10px]" />Get Directions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Offline Consultation Modal ── */}
      <AnimatePresence>
        {consultModal.open && consultModal.doc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto my-8 overflow-hidden"
              style={{ maxHeight: '90vh', boxSizing: 'border-box' }}>

              {/* Modal header */}
              <div className="bg-[#fdf2f2] px-4 sm:px-6 py-4 sm:py-5 border-b border-[#a32626]/10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-[#a32626] rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <i className="fas fa-calendar-check" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[#a32626] font-black text-sm sm:text-base uppercase tracking-tight truncate">Offline Consultation</h3>
                      <p className="text-[10px] text-gray-500 font-bold truncate">{consultModal.doc.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setConsultModal({ open: false, doc: null })}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                    <i className="fas fa-times text-xs" />
                  </button>
                </div>
              </div>

              {/* Modal content with scroll */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                {consultSubmitted ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-check text-2xl text-green-600" />
                    </div>
                    <h4 className="text-gray-900 font-black text-lg mb-2">Request Sent!</h4>
                    <p className="text-gray-500 text-sm">
                      {consultModal.doc.name} will contact you within 24 hours to confirm your appointment.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div className="w-full">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                        Preferred Date <span className="text-red-500">*</span>
                      </label>
                      <input type="date"
                        value={consultForm.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setConsultForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-[#a32626] focus:ring-1 focus:ring-[#a32626]/20 transition-all box-border" />
                    </div>
                    
                    <div className="w-full">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                        Symptoms / Reason
                      </label>
                      <textarea
                        value={consultForm.symptoms}
                        onChange={e => setConsultForm(f => ({ ...f, symptoms: e.target.value }))}
                        placeholder="Briefly describe your symptoms or reason for visit..."
                        rows={3}
                        className="w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm resize-none focus:outline-none focus:border-[#a32626] focus:ring-1 focus:ring-[#a32626]/20 transition-all box-border" />
                    </div>
                    
                    <div className="w-full">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                        Your Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input type="tel"
                        value={consultForm.phone}
                        onChange={e => setConsultForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-[#a32626] focus:ring-1 focus:ring-[#a32626]/20 transition-all box-border" />
                    </div>
                    
                    <div className="w-full flex flex-col sm:flex-row gap-3 pt-3">
                      <button 
                        type="button"
                        onClick={() => setConsultModal({ open: false, doc: null })}
                        className="w-full sm:flex-1 py-3 px-4 bg-white border-2 border-gray-300 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors box-border"
                        style={{ minWidth: '120px' }}>
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={submitConsultRequest}
                        disabled={!consultForm.date || !consultForm.phone}
                        style={{
                          minWidth: '120px',
                          backgroundColor: (!consultForm.date || !consultForm.phone) ? '#9ca3af' : '#a32626',
                          color: '#ffffff',
                          fontWeight: '900'
                        }}
                        className="w-full sm:flex-1 py-3 px-4 text-sm rounded-xl shadow-md transition-all box-border disabled:cursor-not-allowed hover:opacity-90">
                        Send Request
                      </button>
                    </div>
                    
                    <div className="w-full pt-2">
                      <p className="text-center text-[10px] sm:text-xs text-gray-400 leading-relaxed px-2">
                        <i className="fas fa-lock mr-1" />
                        <span className="inline-block">Your information is kept private and secure</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocList;
