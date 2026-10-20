import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  percentage: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  totalScore: number;
  confidenceScore?: number;
  confidenceLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  size?: number;
  showDetails?: boolean;
}

const RiskGauge: React.FC<Props> = ({ 
  percentage, 
  riskLevel, 
  totalScore, 
  confidenceScore = 0,
  confidenceLevel = 'MEDIUM',
  size = 240, 
  showDetails = true 
}) => {
  const getColor = () => {
    switch (riskLevel) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getGradient = () => {
    switch (riskLevel) {
      case 'LOW': return 'from-green-400 to-green-600';
      case 'MEDIUM': return 'from-yellow-400 to-orange-500';
      case 'HIGH': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRiskDescription = () => {
    switch (riskLevel) {
      case 'LOW': return 'Minimal risk factors detected. Continue preventive care.';
      case 'MEDIUM': return 'Moderate risk factors present. Consider lifestyle modifications.';
      case 'HIGH': return 'Significant risk factors identified. Medical consultation recommended.';
      default: return '';
    }
  };

  const getConfidenceColor = () => {
    switch (confidenceLevel) {
      case 'HIGH': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          style={{
            transform: 'none',
            rotate: '0deg',
            overflow: 'visible'
          }}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background track - starts from top */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f3f4f6"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: 'rotateZ(-90deg)'
            }}
          />
          
          {/* Risk level segments */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#dcfce7"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={`${circumference * 0.15} ${circumference * 0.85}`}
            opacity="0.6"
            style={{
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: 'rotateZ(-90deg)'
            }}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#fef3c7"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={`${circumference * 0.15} ${circumference * 0.7} ${circumference * 0.15}`}
            strokeDashoffset={-circumference * 0.15}
            opacity="0.6"
            style={{
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: 'rotateZ(-90deg)'
            }}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#fee2e2"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={`${circumference * 0.7} ${circumference * 0.3}`}
            strokeDashoffset={-circumference * 0.3}
            opacity="0.6"
            style={{
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: 'rotateZ(-90deg)'
            }}
          />
          
          {/* Progress circle with animation */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth="12"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${getColor()}40)`,
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: 'rotateZ(-90deg)'
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 0.6, type: "spring" }}
            className="text-center"
          >
            <div className="text-5xl font-black text-gray-800 mb-1">
              {percentage}%
            </div>
            <div 
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: getColor() }}
            >
              {riskLevel} Risk
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Score: {totalScore} pts
            </div>
            {confidenceScore > 0 && (
              <div className="text-xs mt-1" style={{ color: getConfidenceColor() }}>
                Confidence: {confidenceScore}%
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Animated glow effect */}
        <motion.div 
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${getGradient()} opacity-20 blur-xl`}
          style={{ transform: 'scale(0.9)' }}
          animate={{ 
            scale: [0.9, 1.1, 0.9],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </div>
      
      {showDetails && (
        <motion.div 
          className="mt-6 text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <p className="text-sm text-gray-600 mb-4">
            {getRiskDescription()}
          </p>
          
          {/* Risk level indicators */}
          <div className="flex items-center justify-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Low (0-15)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Medium (16-30)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">High (30+)</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RiskGauge;