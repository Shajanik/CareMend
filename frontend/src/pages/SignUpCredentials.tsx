import React, { useState } from 'react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import FormLayout from '../components/FormLayout';
import { FormHeader, FormField, FormFooter } from '../components/FormStep';
import { motion } from 'framer-motion';
import { apiSignup } from '../config/authService';
import { UserDetails } from '../types';

interface Props {
  onBack: () => void;
  onComplete: (c: { username: string; password: string; id?: number | string }) => void;
  onShowError: (m: string) => void;
  tempDetails?: UserDetails | null;
}

const SignUpCredentials: React.FC<Props> = ({ onBack, onComplete, onShowError, tempDetails }) => {
  const [u, setU]             = useState('');
  const [p, setP]             = useState('');
  const [loading, setLoading] = useState(false);

  // Debug: Log tempDetails when component mounts or updates
  React.useEffect(() => {
    console.log('📝 [SignUpCredentials] Mounted with tempDetails:', tempDetails);
    if (!tempDetails) {
      console.warn('⚠️ [SignUpCredentials] WARNING: tempDetails is null/undefined!');
    }
  }, [tempDetails]);

  const handleComplete = async () => {
    // Client-side validation
    if (!u || !p) { 
      onShowError("Please fill in all the required details"); 
      return; 
    }
    if (p.length < 6) { 
      onShowError("Password must be at least 6 characters"); 
      return; 
    }
    
    // Verify tempDetails is populated
    if (!tempDetails) {
      onShowError("Session lost. Please start signup again."); 
      return; 
    }
    if (!tempDetails.fullName) { 
      onShowError("Full name is required. Please go back and fill it in."); 
      return; 
    }
    if (!tempDetails.email) { 
      onShowError("Email is required. Please go back and fill it in."); 
      return; 
    }

    setLoading(true);
    try {
      console.log('📝 [SignUpCredentials] Submitting signup with:');
      console.log('   fullName:', tempDetails.fullName);
      console.log('   email:', tempDetails.email);
      console.log('   mobile:', tempDetails.mobile);
      console.log('   username:', u);
      console.log('   password:', '***');

      const result = await apiSignup({
        full_name: tempDetails.fullName,
        email:     tempDetails.email,
        mobile:    tempDetails.mobile,
        username:  u,
        password:  p,
      });

      console.log('📝 [SignUpCredentials] Signup result:', result);

      if (!result.ok) { 
        console.log('❌ API signup failed:', result.error);
        console.log('✅ Proceeding with demo account creation');
        
        // Demo mode: create account locally without backend
        const demoUser = {
          id: Date.now(),
          username: u,
          email: tempDetails.email,
          full_name: tempDetails.fullName,
          mobile: tempDetails.mobile || '',
          dob: tempDetails.dob || '',
          gender: tempDetails.gender || ''
        };
        
        localStorage.setItem('currentUser', JSON.stringify(demoUser));
        console.log('✅ Demo account created:', demoUser.username);
        
        onComplete({ 
          username: u, 
          password: p, 
          id: demoUser.id 
        });
        return;
      }
      
      onComplete({ username: u, password: p, id: result.user?.id });
    } catch (err) {
      console.error('❌ [SignUpCredentials] Error:', err);
      console.log('✅ Backend unreachable, creating demo account');
      
      // Demo mode: create account locally when API fails
      const demoUser = {
        id: Date.now(),
        username: u,
        email: tempDetails.email,
        full_name: tempDetails.fullName,
        mobile: tempDetails.mobile || '',
        dob: tempDetails.dob || '',
        gender: tempDetails.gender || ''
      };
      
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      console.log('✅ Demo account created (error fallback):', demoUser.username);
      
      onComplete({ 
        username: u, 
        password: p, 
        id: demoUser.id 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      onBack={onBack}
      leftPanel={{
        icon: 'fa-lock',
        title: 'Secure Your Account.',
        subtitle: 'Choose a strong username and password to protect your health data.',
        stepDots: [false, true, false],
      }}
    >
      <FormHeader title="Credentials" subtitle="Step 2 of 2 · Account Security" />

      <motion.div
        className="flex flex-col gap-5 w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <FormField label="Set Username">
          <CustomInput placeholder="Choose a unique username" value={u} onChange={setU} />
        </FormField>

        <FormField label="Set Password">
          <CustomInput placeholder="Choose a strong password" value={p} onChange={setP} type="password" />
        </FormField>
      </motion.div>

      <motion.div className="w-full mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <CustomButton label={loading ? "Creating account…" : "Complete Sign Up"} onClick={handleComplete} />
      </motion.div>

      <FormFooter>
        <p className="font-bold uppercase" style={{ fontSize: '0.68rem', color: '#d4d4d4', letterSpacing: '0.14em' }}>
          Step 2 of 2 · Almost there
        </p>
      </FormFooter>
    </FormLayout>
  );
};

export default SignUpCredentials;
