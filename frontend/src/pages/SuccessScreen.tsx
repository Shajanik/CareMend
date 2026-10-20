import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onContinue: () => void;
}

const SuccessScreen: React.FC<Props> = ({ onContinue }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
  }, []);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Blobs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-red-100 to-pink-100 rounded-full blur-3xl opacity-40"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-red-50 to-orange-50 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-gradient-to-br from-pink-100 to-red-100 rounded-full blur-2xl opacity-20"
        />

        {/* Floating Healthcare Icons */}
        {[
          { icon: 'fa-heartbeat', top: '15%', left: '10%', delay: 0 },
          { icon: 'fa-shield-alt', top: '25%', right: '15%', delay: 0.5 },
          { icon: 'fa-activity', bottom: '20%', left: '15%', delay: 1 },
          { icon: 'fa-bone', top: '60%', right: '20%', delay: 1.5 },
          { icon: 'fa-brain', top: '40%', left: '8%', delay: 2 },
          { icon: 'fa-dna', bottom: '30%', right: '10%', delay: 2.5 },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.2, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: item.delay,
              ease: "easeInOut"
            }}
            className="absolute text-red-300 text-4xl blur-sm"
            style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
          >
            <i className={`fas ${item.icon}`} />
          </motion.div>
        ))}

        {/* Particle Effects */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [0, -100],
              x: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute w-1 h-1 bg-red-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: '0%',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
          
          {/* Left Side - Icon & Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-shrink-0"
          >
            <div className="relative">
              {/* Glow Effect */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-[3rem] blur-3xl"
                style={{ background: 'linear-gradient(to bottom right, #ef4444, #ec4899)' }}
              />
              
              {/* Main Icon */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-[3rem] flex items-center justify-center border-8 shadow-2xl"
                style={{ 
                  background: 'linear-gradient(to bottom right, #a32626, #8b1f1f)',
                  borderColor: '#ffffff',
                  transform: 'none'
                }}
              >
                <motion.i
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="fas fa-check text-7xl"
                  style={{ 
                    color: '#ffffff',
                    transform: 'none',
                    rotate: '0deg'
                  }}
                />
                
                {/* Pulse Rings */}
                <motion.div
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border-4 rounded-[3rem]"
                  style={{ borderColor: '#f87171' }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6 max-w-xl">
            
            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <motion.h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none bg-gradient-to-r from-[#a32626] via-[#c92a2a] to-[#a32626] bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: '200% auto' }}
              >
                Access<br />Granted
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-gray-500 font-semibold text-sm uppercase tracking-widest mt-3"
              >
                Authentication successful. Your personalized bone health journey begins now.
              </motion.p>
            </motion.div>

            {/* Welcome Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(163, 38, 38, 0.15)" }}
              className="w-full bg-white/80 backdrop-blur-xl px-6 py-5 rounded-2xl border border-gray-200 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{
                    background: 'linear-gradient(to bottom right, #ef4444, #ec4899)',
                    color: '#ffffff'
                  }}
                >
                  <i className="fas fa-heart text-xl" style={{ color: '#ffffff' }} />
                </motion.div>
                <div className="text-left">
                  <p className="text-gray-900 font-black text-xl tracking-tight">
                    Welcome to <span className="text-[#a32626]">CareMend</span>
                  </p>
                  <p className="text-gray-500 text-xs font-semibold">Your AI-powered health companion</p>
                </div>
              </div>
            </motion.div>

            {/* Status Chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex flex-wrap gap-2 justify-center lg:justify-start"
            >
              {[
                { icon: 'fa-shield-check', text: 'LOW RISK', color: 'green' },
                { icon: 'fa-clipboard-check', text: 'Plan Ready', color: 'blue' },
                { icon: 'fa-robot', text: 'AI Enabled', color: 'purple' },
                { icon: 'fa-running', text: 'Tracking Active', color: 'orange' },
              ].map((chip, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + idx * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm
                    ${chip.color === 'green' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                    ${chip.color === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
                    ${chip.color === 'purple' ? 'bg-purple-50 text-purple-700 border border-purple-200' : ''}
                    ${chip.color === 'orange' ? 'bg-orange-50 text-orange-700 border border-orange-200' : ''}
                  `}
                >
                  <i className={`fas ${chip.icon} text-xs`} style={{ transform: 'none', rotate: '0deg' }} />
                  <span>{chip.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(163, 38, 38, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onContinue}
              style={{
                backgroundColor: '#a32626',
                color: '#ffffff',
                fontWeight: '900'
              }}
              className="group relative w-full sm:w-auto px-8 py-4 text-white font-black text-base uppercase tracking-wide rounded-full shadow-xl overflow-hidden"
            >
              {/* Button Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-red-400 blur-xl opacity-40 pointer-events-none"
              />
              
              <span className="relative flex items-center justify-center gap-3 z-10" style={{ color: '#ffffff' }}>
                Go to Dashboard
                <motion.i
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="fas fa-arrow-right"
                  style={{ color: '#ffffff', transform: 'none', rotate: '0deg' }}
                />
              </span>
            </motion.button>

            {/* Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1.8, duration: 1 }}
              className="w-full h-1 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 rounded-full"
              style={{ transformOrigin: 'left' }}
            />
          </div>
        </div>
      </div>

      {/* Ambient Heartbeat Pulse */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"
      />
    </div>
  );
};

export default SuccessScreen;
