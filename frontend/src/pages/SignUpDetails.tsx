import React, { useState } from 'react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import FormLayout from '../components/FormLayout';
import { FormHeader, FormField, FormFooter } from '../components/FormStep';
import { UserDetails } from '../types';
import { motion } from 'framer-motion';

interface Props {
  onBack: () => void;
  onNext: (d: UserDetails) => void;
  onShowError: (m: string) => void;
}

const SignUpDetails: React.FC<Props> = ({ onBack, onNext, onShowError }) => {
  const [data, setData] = useState({
    fullName: '', mobile: '', dob: '', gender: '', country: 'India', city: '', email: ''
  });

  const handleNext = () => {
    if (Object.values(data).some(v => !v)) { onShowError("Please fill in all the required details"); return; }
    if (!/^\d+$/.test(data.mobile)) { onShowError("Mobile number must contain only digits"); return; }
    if (data.mobile.length !== 10) { onShowError("Mobile number must be exactly 10 digits"); return; }
    if (data.mobile.startsWith('0')) { onShowError("Mobile number cannot start with zero"); return; }
    if (!data.email.includes('@')) { onShowError("Email must contain the '@' symbol"); return; }
    onNext(data as UserDetails);
  };

  const set = (k: keyof typeof data) => (v: string) => setData(d => ({ ...d, [k]: v }));

  return (
    <FormLayout
      onBack={onBack}
      leftPanel={{
        icon: 'fa-user-plus',
        title: 'Join Our Community.',
        subtitle: 'Start your journey towards better bone health today.',
        stepDots: [true, false, false],
      }}
    >
      <FormHeader title="Sign Up" subtitle="Step 1 of 2 · Personal Information" />

      <motion.div
        className="flex flex-col gap-4 w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <FormField label="Full Name">
          <CustomInput placeholder="Enter your full name" value={data.fullName} onChange={set('fullName')} />
        </FormField>

        <FormField label="Mobile Number">
          <CustomInput placeholder="Enter 10-digit mobile number" value={data.mobile} onChange={set('mobile')} />
        </FormField>

        <div className="grid grid-cols-2 gap-3 w-full">
          <FormField label="Date of Birth">
            <CustomInput placeholder="DD/MM/YYYY" value={data.dob} onChange={set('dob')} />
          </FormField>
          <FormField label="Gender">
            <CustomInput placeholder="Gender" value={data.gender} onChange={set('gender')} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <FormField label="Country">
            <CustomInput placeholder="India" value={data.country} onChange={set('country')} />
          </FormField>
          <FormField label="City">
            <CustomInput placeholder="City" value={data.city} onChange={set('city')} />
          </FormField>
        </div>

        <FormField label="Email Address">
          <CustomInput placeholder="Enter your email" value={data.email} onChange={set('email')} />
        </FormField>
      </motion.div>

      <motion.div className="w-full mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <CustomButton label="Continue" onClick={handleNext} />
      </motion.div>

      <FormFooter>
        <p className="font-bold uppercase" style={{ fontSize: '0.72rem', color: '#a3a3a3', letterSpacing: '0.14em' }}>
          Already have an account?
        </p>
        <button
          onClick={onBack}
          className="font-black uppercase transition-all duration-200 hover:opacity-70 active:scale-95"
          style={{ fontSize: '0.85rem', color: '#a32626', letterSpacing: '0.16em' }}
        >
          Log In
        </button>
      </FormFooter>
    </FormLayout>
  );
};

export default SignUpDetails;
