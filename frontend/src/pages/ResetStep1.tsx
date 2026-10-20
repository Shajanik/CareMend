import React, { useState } from 'react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import FormLayout from '../components/FormLayout';
import { FormHeader, FormField } from '../components/FormStep';

interface Props {
  onBack: () => void;
  onNext: () => void;
  onShowError: (m: string) => void;
}

const ResetStep1: React.FC<Props> = ({ onBack, onNext, onShowError }) => {
  const [v, setV]       = useState('');
  const [sent, setSent] = useState(false);

  const handleEnter = () => {
    if (!v) { onShowError("Please fill in all the required details"); return; }
    const isNumeric = /^\d+$/.test(v);
    if (isNumeric) {
      if (v.length !== 10) { onShowError("Mobile number must be exactly 10 digits"); return; }
      if (v.startsWith('0')) { onShowError("Mobile number cannot start with zero"); return; }
    } else {
      if (!v.includes('@')) { onShowError("Email must contain '@' symbol, or enter a valid 10-digit mobile number"); return; }
    }
    setSent(true);
  };

  return (
    <FormLayout
      onBack={onBack}
      leftPanel={{
        icon: 'fa-key',
        title: 'Account Recovery.',
        subtitle: "Don't worry, we'll help you get back into your account in just a few steps.",
        stepDots: [true, false, false],
      }}
    >
      <FormHeader title="Reset Password" subtitle="Enter your registered phone or email to receive a code." icon="fa-user-shield" />

      <div className="flex flex-col gap-6 w-full">
        <FormField label="Identifier">
          <CustomInput placeholder="Phone or Email" value={v} onChange={setV} />
        </FormField>

        {!sent ? (
          <CustomButton label="Send Verification Code" onClick={handleEnter} />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="p-6 rounded-2xl border text-center" style={{ background: '#fdf2f2', borderColor: 'rgba(163,38,38,0.1)' }}>
              <p className="font-black text-sm uppercase tracking-widest leading-relaxed" style={{ color: '#a32626' }}>
                Verification code sent successfully!
              </p>
            </div>
            <CustomButton label="Continue to OTP" onClick={onNext} />
          </div>
        )}
      </div>

      <p className="text-center font-bold uppercase mt-8" style={{ fontSize: '0.68rem', color: '#d4d4d4', letterSpacing: '0.14em' }}>
        Secure Recovery · CareMend Support
      </p>
    </FormLayout>
  );
};

export default ResetStep1;
