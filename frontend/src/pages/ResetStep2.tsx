import React, { useState, useEffect } from 'react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import FormLayout from '../components/FormLayout';
import { FormHeader, FormField } from '../components/FormStep';

interface Props {
  onBack: () => void;
  onComplete: () => void;
  onShowError: (m: string) => void;
}

const ResetStep2: React.FC<Props> = ({ onBack, onComplete, onShowError }) => {
  const [otp, setOtp]         = useState('');
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (timeLeft === 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')} left`;
  };

  const handleEnter = () => {
    if (!otp) { onShowError("Please fill in all the required details"); return; }
    onComplete();
  };

  return (
    <FormLayout
      onBack={onBack}
      leftPanel={{
        icon: 'fa-shield-halved',
        title: 'Verify Identity.',
        subtitle: "We've sent a secure code to your registered device.",
        stepDots: [false, true, false],
      }}
    >
      <FormHeader title="Enter OTP" subtitle="Enter the 6-digit verification code." icon="fa-lock" />

      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex justify-between items-center px-1">
            <label className="font-black uppercase" style={{ fontSize: '0.68rem', color: '#a3a3a3', letterSpacing: '0.18em' }}>
              Verification Code
            </label>
            <span className="font-black uppercase px-2 py-1 rounded-lg text-[10px]"
              style={{ background: '#fdf2f2', color: '#a32626', letterSpacing: '0.1em' }}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <CustomInput placeholder="000000" value={otp} onChange={setOtp} />
        </div>

        <CustomButton label="Verify & Continue" onClick={handleEnter} />

        <div className="flex items-center justify-between">
          <p className="font-bold uppercase" style={{ fontSize: '0.68rem', color: '#a3a3a3', letterSpacing: '0.14em' }}>
            Didn't receive the code?
          </p>
          <button
            onClick={() => setTimeLeft(120)}
            className="font-black uppercase hover:underline"
            style={{ fontSize: '0.68rem', color: '#a32626', letterSpacing: '0.14em' }}
          >
            Resend OTP
          </button>
        </div>
      </div>

      <p className="text-center font-bold uppercase mt-8" style={{ fontSize: '0.68rem', color: '#d4d4d4', letterSpacing: '0.14em' }}>
        Secure Verification · CareMend Support
      </p>
    </FormLayout>
  );
};

export default ResetStep2;
