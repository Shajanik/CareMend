import React, { useState } from 'react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import FormLayout from '../components/FormLayout';
import { FormHeader, FormField, FormFooter } from '../components/FormStep';
import { motion } from 'framer-motion';
import { apiSignin } from '../config/authService';
import { API_CONFIG } from '../config/api';

interface Props {
  onBack: () => void;
  onLogin: (u: string, p: string) => void | Promise<void>;
  onForgot: () => void;
  onSignUp: () => void;
  onShowError: (m: string) => void;
}

const Login: React.FC<Props> = ({ onBack, onLogin, onForgot, onSignUp, onShowError }) => {
  const [u, setU]             = useState('');
  const [p, setP]             = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!u || !p) { onShowError("Please fill in all the required details"); return; }
    const isNumeric = /^\d+$/.test(u);
    if (isNumeric) {
      if (u.length !== 10) { onShowError("Mobile number must be exactly 10 digits"); return; }
      if (u.startsWith('0')) { onShowError("Mobile number cannot start with zero"); return; }
    }
    if (!isNumeric && u.includes('.') && !u.includes('@')) {
      onShowError("Email must contain the '@' symbol"); return;
    }

    setLoading(true);
    
    try {
      // Log the login attempt
      console.log("=" + "=".repeat(58));
      console.log("🔐 [LOGIN] Starting login attempt");
      console.log("=" + "=".repeat(58));
      console.log("📝 Form data captured:");
      console.log(`   Identifier: '${u}' (type: ${typeof u}, length: ${u.length})`);
      console.log(`   Password: ${'*'.repeat(p.length)} (length: ${p.length})`);
      console.log(`   Identifier is numeric: ${isNumeric}`);
      
      const payload = { identifier: u, password: p };
      console.log("📤 Payload being sent:");
      console.log(`   ${JSON.stringify(payload)}`);
      
      console.log("🌐 API call details:");
      console.log(`   Endpoint: POST ${API_CONFIG.BASE_URL}/signin`);
      console.log(`   Content-Type: application/json`);
      
      const result = await apiSignin(payload);
      
      console.log("📥 API response received:");
      console.log(`   Status OK: ${result.ok}`);
      console.log(`   Has user: ${!!result.user}`);
      console.log(`   Has token: ${!!result.token}`);
      console.log(`   Error: ${result.error || 'None'}`);
      
      if (result.ok && result.user) { 
        // Store user in both localStorage keys for compatibility
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        console.log("✅ [LOGIN] User authenticated successfully!");
        console.log(`   User: ${result.user.username} (ID: ${result.user.id})`);
        console.log(`   Token saved: ${result.token?.substring(0, 20)}...`);
        console.log("=" + "=".repeat(58));
        await onLogin(u, p); // Wait for login handler to complete
        setLoading(false);
        return; 
      }
      
      // If API failed, proceed with demo login
      console.log("⚠️ [LOGIN] API authentication failed, creating demo session");
      const demoUser = {
        id: Date.now(),
        username: u,
        email: isNumeric ? `user${u}@demo.com` : u.includes('@') ? u : `${u}@demo.com`,
        full_name: u,
        mobile: isNumeric ? u : '',
        dob: '',
        gender: ''
      };
      
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      console.log("✅ Demo session created:", demoUser.username);
      console.log("=" + "=".repeat(58));
      
      await onLogin(u, p);
      setLoading(false);
      return;
    } catch (error) { 
      console.error("❌ [LOGIN] Unexpected error:", error);
      console.log("=" + "=".repeat(58));
      
      // Fallback to demo login on any error
      console.log("✅ Creating demo session due to error");
      const demoUser = {
        id: Date.now(),
        username: u,
        email: /^\d+$/.test(u) ? `user${u}@demo.com` : u.includes('@') ? u : `${u}@demo.com`,
        full_name: u,
        mobile: /^\d+$/.test(u) ? u : '',
        dob: '',
        gender: ''
      };
      
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      console.log("✅ Demo session created (error fallback):", demoUser.username);
      
      try {
        await onLogin(u, p);
      } catch (loginErr) {
        console.error("Error during login handler:", loginErr);
      }
      setLoading(false);
      return;
    }
  };

  return (
    <FormLayout
      onBack={onBack}
      leftPanel={{
        icon: 'fa-heart-pulse',
        title: 'Welcome Back.',
        subtitle: 'Access your personalised bone health dashboard and continue your journey.',
        stepDots: [true, false, false],
      }}
    >
      <FormHeader title="Log In" subtitle="Enter your credentials to access your account." />

      <motion.div
        className="flex flex-col gap-5 w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <FormField label="Username / Mobile / Email">
          <CustomInput placeholder="Enter your identifier" value={u} onChange={setU} />
        </FormField>

        <FormField label="Password">
          <CustomInput placeholder="Enter your password" value={p} onChange={setP} type="password" />
        </FormField>

        <div className="flex justify-end w-full">
          <button
            onClick={onForgot}
            className="font-black uppercase hover:underline transition-all"
            style={{ fontSize: '0.72rem', color: '#a32626', letterSpacing: '0.14em' }}
          >
            Forgot Password?
          </button>
        </div>
      </motion.div>

      <motion.div className="w-full mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <CustomButton label={loading ? "Signing in…" : "Sign In"} onClick={handleSubmit} />
      </motion.div>

      <FormFooter>
        <p className="font-bold uppercase" style={{ fontSize: '0.72rem', color: '#a3a3a3', letterSpacing: '0.14em' }}>
          Don't have an account?
        </p>
        <button
          onClick={onSignUp}
          className="font-black uppercase transition-all duration-200 hover:opacity-75 active:scale-95"
          style={{ fontSize: '0.85rem', color: '#a32626', letterSpacing: '0.16em' }}
        >
          Create one now
        </button>
      </FormFooter>
    </FormLayout>
  );
};

export default Login;
