import React, { useState } from 'react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import FormLayout from '../components/FormLayout';
import { FormHeader, FormField } from '../components/FormStep';

interface Props {
  onComplete: () => void;
  onShowError: (m: string) => void;
}

const ResetPassword: React.FC<Props> = ({ onComplete, onShowError }) => {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');

  const handleUpdate = () => {
    if (!p1 || !p2) { onShowError("Please fill in all the required details"); return; }
    if (p1 !== p2)  { onShowError("Passwords do not match"); return; }
    onComplete();
  };

  return (
    <FormLayout
      showBackButton={false}
      leftPanel={{
        icon: 'fa-lock-open',
        title: 'New Security.',
        subtitle: 'Create a strong, unique password to keep your health data protected.',
        stepDots: [false, false, true],
      }}
    >
      <FormHeader title="Set Password" subtitle="Choose a strong password (min. 8 characters)." icon="fa-key" />

      <div className="flex flex-col gap-5 w-full">
        <FormField label="New Password">
          <CustomInput placeholder="Enter strong password" value={p1} onChange={setP1} type="password" />
        </FormField>

        <FormField label="Confirm Password">
          <CustomInput placeholder="Repeat new password" value={p2} onChange={setP2} type="password" />
        </FormField>

        <div className="pt-2">
          <CustomButton label="Update Password" onClick={handleUpdate} />
        </div>
      </div>

      <p className="text-center font-bold uppercase mt-8" style={{ fontSize: '0.68rem', color: '#d4d4d4', letterSpacing: '0.14em' }}>
        Secure Update · CareMend Support
      </p>
    </FormLayout>
  );
};

export default ResetPassword;
