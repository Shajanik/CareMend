// Personalized Exercise Service
// Generates exercises based on clinical assessment results

// Updated Exercise Categories
export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'gentle' | 'moderate' | 'challenging';
  category: 'warmup' | 'weight-bearing' | 'balance' | 'strengthening' | 'posture' | 'mobility' | 'stretching';
  safetyLevel: 'low-risk' | 'medium-risk' | 'high-risk';
  instructions: string[];
  benefits: string[];
  whyRecommended?: string;
  targetAreas: string[];
  contraindications?: string[];
}

export interface ExercisePlan {
  exercises: Exercise[];
  totalDuration: number;
  personalizationReasons: string[];
  riskLevel: string;
  focusAreas: string[];
}

export interface SessionFeedback {
  difficulty: 'easy' | 'moderate' | 'difficult';
  completed: boolean;
}

export interface UserProfile {
  risk_level: string;
  risk_percentage: number;
  age: number;
  gender: string;
  risk_factors?: string[];
  recommendations?: string[];
  activity_level?: string;
  mobility_issues?: string[];
  balance_problems?: boolean;
  pain_areas?: string[];
}

// Exercise Database - Organized by WHO guidelines and osteoporosis prevention
const EXERCISE_DATABASE: Exercise[] = [
  // WEIGHT-BEARING EXERCISES (WHO Priority)
  {
    id: 'brisk-walking',
    name: 'Brisk Walking',
    description: 'Moderate-intensity weight-bearing cardiovascular exercise',
    duration: 10,
    difficulty: 'moderate',
    category: 'weight-bearing',
    safetyLevel: 'low-risk',
    instructions: [
      'Walk at a pace where you can talk but feel slightly breathless',
      'Maintain good posture with shoulders back',
      'Land on heel, roll through to toe',
      'Swing arms naturally for balance'
    ],
    benefits: ['Builds bone density', 'Improves cardiovascular health', 'Weight-bearing exercise'],
    targetAreas: ['bones', 'cardiovascular', 'legs'],
    contraindications: ['severe joint pain', 'recent fractures']
  },

  {
    id: 'marching-in-place',
    name: 'Marching in Place',
    description: 'Standing weight-bearing exercise for bone health',
    duration: 5,
    difficulty: 'moderate',
    category: 'weight-bearing',
    safetyLevel: 'low-risk',
    instructions: [
      'Stand tall with feet hip-width apart',
      'Lift one knee up to hip level',
      'Lower and repeat with other leg',
      'Maintain steady rhythm for 2-3 minutes'
    ],
    benefits: ['Stimulates bone formation', 'Improves balance', 'Cardiovascular benefit'],
    targetAreas: ['bones', 'balance', 'legs'],
    contraindications: ['severe balance problems', 'recent leg injury']
  },

  {
    id: 'step-ups',
    name: 'Step-ups',
    description: 'Weight-bearing exercise using stairs or platform',
    duration: 4,
    difficulty: 'moderate',
    category: 'weight-bearing',
    safetyLevel: 'medium-risk',
    instructions: [
      'Use bottom step of stairs or sturdy platform',
      'Step up with right foot, bring left foot up',
      'Step down with right foot, then left',
      'Hold handrail for balance if needed'
    ],
    benefits: ['High bone-loading exercise', 'Strengthens legs', 'Functional movement'],
    targetAreas: ['bones', 'legs', 'balance'],
    contraindications: ['severe knee pain', 'balance problems', 'recent falls']
  },

  // RESISTANCE TRAINING (WHO Priority)
  {
    id: 'wall-push-ups',
    name: 'Wall Push-ups',
    description: 'Upper body resistance exercise against wall',
    duration: 3,
    difficulty: 'moderate',
    category: 'strengthening',
    safetyLevel: 'low-risk',
    instructions: [
      'Stand arm\'s length from wall',
      'Place palms flat against wall at shoulder height',
      'Push away from wall and return with control',
      'Keep body straight throughout movement'
    ],
    benefits: ['Builds upper body strength', 'Improves bone density', 'Functional strength'],
    targetAreas: ['arms', 'chest', 'shoulders', 'bones'],
    contraindications: ['severe shoulder pain']
  },

  {
    id: 'resistance-band-exercises',
    name: 'Resistance Band Training',
    description: 'Progressive resistance training for bone health',
    duration: 6,
    difficulty: 'moderate',
    category: 'strengthening',
    safetyLevel: 'low-risk',
    instructions: [
      'Use light to moderate resistance band',
      'Perform bicep curls, chest pulls, and rows',
      'Control both lifting and lowering phases',
      'Complete 8-12 repetitions per exercise'
    ],
    benefits: ['Progressive overload', 'Builds muscle and bone', 'Versatile training'],
    targetAreas: ['arms', 'back', 'chest', 'bones'],
    contraindications: ['recent surgery', 'severe joint pain']
  },

  {
    id: 'sit-to-stand-squats',
    name: 'Sit-to-Stand Squats',
    description: 'Functional leg strengthening exercise',
    duration: 4,
    difficulty: 'moderate',
    category: 'strengthening',
    safetyLevel: 'medium-risk',
    instructions: [
      'Sit in chair with feet flat on floor',
      'Cross arms over chest or use for balance',
      'Stand up using leg muscles, sit back down',
      'Control the movement both up and down'
    ],
    benefits: ['Functional strength', 'Bone loading', 'Fall prevention'],
    targetAreas: ['legs', 'glutes', 'bones', 'balance'],
    contraindications: ['severe knee pain', 'recent leg surgery']
  },

  // BALANCE TRAINING (WHO Priority for Fall Prevention)
  {
    id: 'heel-to-toe-walk',
    name: 'Heel-to-Toe Walking',
    description: 'Dynamic balance exercise for fall prevention',
    duration: 3,
    difficulty: 'moderate',
    category: 'balance',
    safetyLevel: 'medium-risk',
    instructions: [
      'Walk in straight line placing heel directly in front of toes',
      'Look straight ahead, not down at feet',
      'Use wall for support if needed initially',
      'Take 10-20 steps forward and backward'
    ],
    benefits: ['Improves dynamic balance', 'Fall prevention', 'Coordination'],
    targetAreas: ['balance', 'coordination', 'legs'],
    contraindications: ['severe balance problems', 'recent falls', 'dizziness']
  },

  {
    id: 'single-leg-stand',
    name: 'Single Leg Standing',
    description: 'Static balance exercise with progression',
    duration: 3,
    difficulty: 'moderate',
    category: 'balance',
    safetyLevel: 'medium-risk',
    instructions: [
      'Stand near wall or chair for support',
      'Lift one foot slightly off ground',
      'Hold for 10-30 seconds',
      'Progress to eyes closed or no support'
    ],
    benefits: ['Static balance', 'Ankle strength', 'Fall prevention'],
    targetAreas: ['balance', 'ankles', 'core'],
    contraindications: ['severe balance problems', 'recent falls']
  },

  {
    id: 'tree-pose-supported',
    name: 'Supported Tree Pose',
    description: 'Yoga balance pose with wall support',
    duration: 4,
    difficulty: 'moderate',
    category: 'balance',
    safetyLevel: 'medium-risk',
    instructions: [
      'Stand next to wall for support',
      'Place one foot on inner calf or thigh (not knee)',
      'Use wall for balance as needed',
      'Hold for 15-30 seconds each side'
    ],
    benefits: ['Balance and focus', 'Leg strength', 'Mind-body connection'],
    targetAreas: ['balance', 'legs', 'core'],
    contraindications: ['severe balance problems', 'knee problems']
  },

  // POSTURE AND SPINE HEALTH
  {
    id: 'tadasana-mountain-pose',
    name: 'Tadasana (Mountain Pose)',
    description: 'Foundational posture exercise for spinal alignment',
    duration: 3,
    difficulty: 'gentle',
    category: 'posture',
    safetyLevel: 'low-risk',
    instructions: [
      'Stand tall with feet hip-width apart',
      'Engage core, lengthen spine',
      'Shoulders back and down, crown reaching up',
      'Hold for 30 seconds, breathe deeply'
    ],
    benefits: ['Improves posture', 'Spinal awareness', 'Core activation'],
    targetAreas: ['posture', 'spine', 'core'],
    contraindications: ['severe back pain']
  },

  {
    id: 'shoulder-blade-squeezes',
    name: 'Shoulder Blade Squeezes',
    description: 'Upper back strengthening for posture correction',
    duration: 3,
    difficulty: 'moderate',
    category: 'posture',
    safetyLevel: 'low-risk',
    instructions: [
      'Sit or stand with arms at sides',
      'Squeeze shoulder blades together',
      'Hold for 5 seconds, release slowly',
      'Repeat 10-15 times'
    ],
    benefits: ['Strengthens upper back', 'Corrects rounded shoulders', 'Improves posture'],
    targetAreas: ['upper back', 'shoulders', 'posture'],
    contraindications: ['severe shoulder pain']
  },

  {
    id: 'spinal-extension-exercise',
    name: 'Spinal Extension Exercise',
    description: 'Gentle back extension for spine health',
    duration: 4,
    difficulty: 'moderate',
    category: 'posture',
    safetyLevel: 'medium-risk',
    instructions: [
      'Lie face down with hands under shoulders',
      'Gently lift chest off ground using back muscles',
      'Keep hips on ground, look straight ahead',
      'Hold for 3-5 seconds, lower slowly'
    ],
    benefits: ['Strengthens back extensors', 'Improves spinal mobility', 'Counters forward posture'],
    targetAreas: ['back', 'spine', 'posture'],
    contraindications: ['severe back pain', 'recent spinal surgery']
  },

  // LOW-IMPACT MOBILITY (for limitations)
  {
    id: 'chair-yoga-sequence',
    name: 'Chair Yoga Sequence',
    description: 'Gentle mobility exercises performed seated',
    duration: 8,
    difficulty: 'gentle',
    category: 'mobility',
    safetyLevel: 'low-risk',
    instructions: [
      'Sit tall in chair with feet flat on floor',
      'Perform gentle spinal twists, side bends',
      'Add shoulder rolls and neck stretches',
      'Move slowly and breathe deeply'
    ],
    benefits: ['Maintains mobility', 'Reduces stiffness', 'Safe for all levels'],
    targetAreas: ['spine', 'shoulders', 'neck'],
    contraindications: ['severe pain during movement']
  },

  {
    id: 'seated-leg-extensions',
    name: 'Seated Leg Extensions',
    description: 'Gentle quadriceps strengthening while seated',
    duration: 3,
    difficulty: 'gentle',
    category: 'strengthening',
    safetyLevel: 'low-risk',
    instructions: [
      'Sit in chair with back straight',
      'Slowly extend one leg straight out',
      'Hold for 2 seconds, lower slowly',
      'Complete 8-12 repetitions each leg'
    ],
    benefits: ['Strengthens quadriceps', 'Improves knee stability', 'Very safe'],
    targetAreas: ['quadriceps', 'knees'],
    contraindications: ['severe knee pain']
  },

  // WARMUP AND COOLDOWN
  {
    id: 'dynamic-warmup',
    name: 'Dynamic Warmup',
    description: 'Movement-based warmup to prepare for exercise',
    duration: 5,
    difficulty: 'gentle',
    category: 'warmup',
    safetyLevel: 'low-risk',
    instructions: [
      'Gentle arm circles and leg swings',
      'Marching in place with arm movements',
      'Shoulder rolls and neck rotations',
      'Gradually increase range of motion'
    ],
    benefits: ['Prepares body for exercise', 'Increases circulation', 'Reduces injury risk'],
    targetAreas: ['whole body', 'circulation'],
    contraindications: ['severe joint pain']
  },

  {
    id: 'gentle-stretching-cooldown',
    name: 'Gentle Stretching Cooldown',
    description: 'Static stretches to end exercise session',
    duration: 6,
    difficulty: 'gentle',
    category: 'stretching',
    safetyLevel: 'low-risk',
    instructions: [
      'Hold each stretch for 15-30 seconds',
      'Focus on major muscle groups used',
      'Breathe deeply and relax into stretches',
      'Never force or bounce in stretches'
    ],
    benefits: ['Improves flexibility', 'Aids recovery', 'Promotes relaxation'],
    targetAreas: ['flexibility', 'recovery'],
    contraindications: ['acute muscle strain']
  },

  // HIGH-RISK SPECIFIC EXERCISES
  {
    id: 'assisted-balance-exercises',
    name: 'Assisted Balance Exercises',
    description: 'Balance training with full support for high-risk users',
    duration: 4,
    difficulty: 'gentle',
    category: 'balance',
    safetyLevel: 'low-risk',
    instructions: [
      'Hold onto sturdy chair or counter',
      'Practice weight shifts side to side',
      'Lift one foot slightly while holding on',
      'Focus on feeling balanced and stable'
    ],
    benefits: ['Safe balance training', 'Fall prevention', 'Confidence building'],
    targetAreas: ['balance', 'confidence'],
    contraindications: ['severe dizziness', 'recent falls']
  },

  {
    id: 'breathing-and-relaxation',
    name: 'Deep Breathing and Relaxation',
    description: 'Stress reduction and breathing exercise',
    duration: 5,
    difficulty: 'gentle',
    category: 'stretching',
    safetyLevel: 'low-risk',
    instructions: [
      'Sit comfortably with good posture',
      'Breathe in slowly through nose for 4 counts',
      'Hold breath for 2 counts',
      'Exhale slowly through mouth for 6 counts'
    ],
    benefits: ['Reduces stress', 'Improves breathing', 'Promotes relaxation'],
    targetAreas: ['breathing', 'relaxation', 'stress'],
    contraindications: ['severe respiratory issues']
  }
];

// WHO-based recommendation mapping - connects assessment recommendations to exercises
const RECOMMENDATION_EXERCISE_MAP: Record<string, string[]> = {
  // Weight-bearing activity (WHO Priority #1)
  'increase weight-bearing activity': ['brisk-walking', 'marching-in-place', 'step-ups', 'sit-to-stand-squats'],
  'weight-bearing exercise': ['brisk-walking', 'marching-in-place', 'step-ups', 'wall-push-ups'],
  'bone density improvement': ['brisk-walking', 'step-ups', 'resistance-band-exercises', 'sit-to-stand-squats'],
  
  // Resistance training (WHO Priority #2)
  'resistance training': ['resistance-band-exercises', 'wall-push-ups', 'sit-to-stand-squats', 'spinal-extension-exercise'],
  'strength training': ['wall-push-ups', 'resistance-band-exercises', 'sit-to-stand-squats', 'shoulder-blade-squeezes'],
  'muscle strengthening': ['resistance-band-exercises', 'wall-push-ups', 'sit-to-stand-squats'],
  
  // Balance training (WHO Priority #3 - Fall Prevention)
  'improve balance': ['heel-to-toe-walk', 'single-leg-stand', 'tree-pose-supported', 'assisted-balance-exercises'],
  'balance training': ['single-leg-stand', 'heel-to-toe-walk', 'tree-pose-supported'],
  'fall prevention': ['heel-to-toe-walk', 'single-leg-stand', 'sit-to-stand-squats', 'assisted-balance-exercises'],
  
  // Posture and spine health
  'improve posture': ['tadasana-mountain-pose', 'shoulder-blade-squeezes', 'spinal-extension-exercise'],
  'spine health': ['spinal-extension-exercise', 'tadasana-mountain-pose', 'shoulder-blade-squeezes'],
  'posture correction': ['shoulder-blade-squeezes', 'tadasana-mountain-pose', 'spinal-extension-exercise'],
  
  // Low-impact alternatives (for limitations)
  'low-impact movement': ['chair-yoga-sequence', 'seated-leg-extensions', 'assisted-balance-exercises'],
  'gentle exercise': ['chair-yoga-sequence', 'breathing-and-relaxation', 'gentle-stretching-cooldown'],
  'mobility improvement': ['chair-yoga-sequence', 'gentle-stretching-cooldown', 'dynamic-warmup']
};

// Risk factor to exercise mapping (clinical indicators)
const RISK_FACTOR_EXERCISE_MAP: Record<string, string[]> = {
  'low physical activity': ['brisk-walking', 'marching-in-place', 'wall-push-ups', 'sit-to-stand-squats'],
  'sedentary lifestyle': ['brisk-walking', 'marching-in-place', 'dynamic-warmup', 'resistance-band-exercises'],
  'balance problems': ['assisted-balance-exercises', 'heel-to-toe-walk', 'single-leg-stand'],
  'poor posture': ['shoulder-blade-squeezes', 'tadasana-mountain-pose', 'spinal-extension-exercise'],
  'muscle weakness': ['resistance-band-exercises', 'wall-push-ups', 'sit-to-stand-squats'],
  'joint stiffness': ['chair-yoga-sequence', 'gentle-stretching-cooldown', 'dynamic-warmup'],
  'fall risk': ['assisted-balance-exercises', 'heel-to-toe-walk', 'sit-to-stand-squats'],
  'bone density concerns': ['brisk-walking', 'step-ups', 'resistance-band-exercises', 'wall-push-ups']
};

export function generatePersonalizedExercises(profile: UserProfile): ExercisePlan {
  const selectedExerciseIds = new Set<string>();
  const personalizationReasons: string[] = [];
  const focusAreas: string[] = [];

  console.log('Generating exercises for profile:', profile);

  // STEP 1: Determine risk-based exercise capacity
  const riskLevel = profile.risk_level.toUpperCase();
  let exerciseCapacity: 'full' | 'moderate' | 'limited' = 'full';
  
  switch (riskLevel) {
    case 'LOW':
      exerciseCapacity = 'full'; // Can do moderate-intensity exercises
      break;
    case 'MEDIUM':
      exerciseCapacity = 'moderate'; // Controlled movements, some restrictions
      break;
    case 'HIGH':
      exerciseCapacity = 'limited'; // Gentle exercises only
      break;
  }

  // STEP 2: Process WHO-priority recommendations from assessment
  if (profile.recommendations && profile.recommendations.length > 0) {
    profile.recommendations.forEach(recommendation => {
      const lowerRec = recommendation.toLowerCase();
      console.log('Processing recommendation:', lowerRec);
      
      // Find matching exercises for this recommendation
      Object.entries(RECOMMENDATION_EXERCISE_MAP).forEach(([key, exerciseIds]) => {
        if (lowerRec.includes(key)) {
          exerciseIds.forEach(id => selectedExerciseIds.add(id));
          personalizationReasons.push(`Assessment recommended: "${recommendation}"`);
          focusAreas.push(key);
          console.log(`Added exercises for "${key}":`, exerciseIds);
        }
      });
    });
  }

  // STEP 3: Process risk factors (clinical indicators)
  if (profile.risk_factors && profile.risk_factors.length > 0) {
    profile.risk_factors.forEach(riskFactor => {
      const lowerRisk = riskFactor.toLowerCase();
      console.log('Processing risk factor:', lowerRisk);
      
      Object.entries(RISK_FACTOR_EXERCISE_MAP).forEach(([key, exerciseIds]) => {
        if (lowerRisk.includes(key)) {
          exerciseIds.forEach(id => selectedExerciseIds.add(id));
          personalizationReasons.push(`Addressing: ${riskFactor}`);
          console.log(`Added exercises for risk factor "${key}":`, exerciseIds);
        }
      });
    });
  }

  // STEP 4: Add WHO guideline-based exercises by risk level
  if (exerciseCapacity === 'full') {
    // LOW RISK: Full WHO guidelines - weight-bearing, resistance, balance
    ['brisk-walking', 'resistance-band-exercises', 'heel-to-toe-walk', 'wall-push-ups'].forEach(id => 
      selectedExerciseIds.add(id)
    );
    personalizationReasons.push('WHO guidelines: weight-bearing, resistance, and balance training');
    focusAreas.push('comprehensive_fitness');
    
  } else if (exerciseCapacity === 'moderate') {
    // MEDIUM RISK: Modified WHO guidelines - controlled movements
    ['marching-in-place', 'wall-push-ups', 'single-leg-stand', 'shoulder-blade-squeezes'].forEach(id => 
      selectedExerciseIds.add(id)
    );
    personalizationReasons.push('Modified WHO guidelines for medium-risk profile');
    focusAreas.push('controlled_strengthening');
    
  } else {
    // HIGH RISK: Gentle mobility and assisted exercises
    ['assisted-balance-exercises', 'chair-yoga-sequence', 'seated-leg-extensions'].forEach(id => 
      selectedExerciseIds.add(id)
    );
    personalizationReasons.push('Gentle exercises appropriate for high-risk status');
    focusAreas.push('safe_mobility');
  }

  // STEP 5: Add condition-specific exercises
  
  // Balance problems (critical for fall prevention)
  if (profile.balance_problems) {
    if (exerciseCapacity === 'limited') {
      selectedExerciseIds.add('assisted-balance-exercises');
    } else {
      ['heel-to-toe-walk', 'single-leg-stand', 'tree-pose-supported'].forEach(id => 
        selectedExerciseIds.add(id)
      );
    }
    personalizationReasons.push('Balance training for fall prevention');
  }

  // Activity level considerations
  if (profile.activity_level === 'sedentary' || profile.activity_level === 'low') {
    if (exerciseCapacity === 'full') {
      ['brisk-walking', 'marching-in-place', 'wall-push-ups'].forEach(id => 
        selectedExerciseIds.add(id)
      );
      personalizationReasons.push('Progressive exercises to increase activity level');
    } else {
      ['chair-yoga-sequence', 'seated-leg-extensions', 'dynamic-warmup'].forEach(id => 
        selectedExerciseIds.add(id)
      );
      personalizationReasons.push('Gentle exercises to gradually increase activity');
    }
  }

  // STEP 6: Age considerations (NOT primary filter)
  if (profile.age >= 65) {
    // Add age-appropriate exercises but don't restrict to only gentle ones
    if (exerciseCapacity === 'full') {
      selectedExerciseIds.add('tadasana-mountain-pose'); // Good for posture
      selectedExerciseIds.add('shoulder-blade-squeezes'); // Upper back strength
    }
    // Age is considered but doesn't override risk-based capacity
    personalizationReasons.push('Age-appropriate exercise modifications included');
  }

  // STEP 7: Apply safety filtering based on exercise capacity
  let allowedSafetyLevels: string[] = [];
  let allowedDifficulties: string[] = [];
  
  switch (exerciseCapacity) {
    case 'full':
      allowedSafetyLevels = ['low-risk', 'medium-risk'];
      allowedDifficulties = ['gentle', 'moderate'];
      break;
    case 'moderate':
      allowedSafetyLevels = ['low-risk', 'medium-risk'];
      allowedDifficulties = ['gentle', 'moderate'];
      break;
    case 'limited':
      allowedSafetyLevels = ['low-risk'];
      allowedDifficulties = ['gentle'];
      break;
  }

  // STEP 8: Filter and enhance exercises
  const filteredExercises = EXERCISE_DATABASE
    .filter(exercise => 
      selectedExerciseIds.has(exercise.id) && 
      allowedSafetyLevels.includes(exercise.safetyLevel) &&
      allowedDifficulties.includes(exercise.difficulty)
    )
    .map(exercise => ({
      ...exercise,
      whyRecommended: generateWhyRecommended(exercise, profile, exerciseCapacity)
    }));

  console.log('Filtered exercises:', filteredExercises.map(e => e.name));

  // STEP 9: Ensure comprehensive plan structure
  const exercisesByCategory = filteredExercises.reduce((acc, exercise) => {
    if (!acc[exercise.category]) acc[exercise.category] = [];
    acc[exercise.category].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  // Add missing essential categories
  if (!exercisesByCategory.warmup) {
    const warmup = EXERCISE_DATABASE.find(ex => ex.id === 'dynamic-warmup');
    if (warmup) {
      filteredExercises.unshift({
        ...warmup,
        whyRecommended: 'Essential warmup to prepare your body for exercise safely'
      });
    }
  }

  if (!exercisesByCategory.stretching) {
    const cooldown = EXERCISE_DATABASE.find(ex => ex.id === 'gentle-stretching-cooldown');
    if (cooldown) {
      filteredExercises.push({
        ...cooldown,
        whyRecommended: 'Important cooldown to help your body recover and maintain flexibility'
      });
    }
  }

  // STEP 10: Ensure minimum effective dose
  if (filteredExercises.length < 5) {
    // Add safe foundational exercises
    const additionalExercises = EXERCISE_DATABASE
      .filter(exercise => 
        !selectedExerciseIds.has(exercise.id) && 
        allowedSafetyLevels.includes(exercise.safetyLevel) &&
        allowedDifficulties.includes(exercise.difficulty) &&
        ['strengthening', 'balance', 'posture'].includes(exercise.category)
      )
      .slice(0, 5 - filteredExercises.length)
      .map(exercise => ({
        ...exercise,
        whyRecommended: 'Added as foundational exercise for comprehensive bone health'
      }));
    
    filteredExercises.push(...additionalExercises);
  }

  // STEP 11: Calculate total duration and finalize
  const totalDuration = filteredExercises.reduce((sum, exercise) => sum + exercise.duration, 0);

  // Add default personalization reason if none exist
  if (personalizationReasons.length === 0) {
    personalizationReasons.push(`Exercises selected based on ${riskLevel.toLowerCase()}-risk assessment and WHO guidelines`);
  }

  console.log('Final exercise plan:', {
    exerciseCount: filteredExercises.length,
    totalDuration,
    exerciseCapacity,
    categories: Object.keys(exercisesByCategory)
  });

  return {
    exercises: filteredExercises,
    totalDuration,
    personalizationReasons,
    riskLevel: profile.risk_level,
    focusAreas
  };
}

function generateWhyRecommended(exercise: Exercise, profile: UserProfile, exerciseCapacity: string): string {
  const reasons: string[] = [];

  // Risk level reasoning
  if (profile.risk_level.toUpperCase() === 'LOW' && exercise.difficulty === 'moderate') {
    reasons.push('your low-risk status allows for moderate-intensity exercise');
  } else if (profile.risk_level.toUpperCase() === 'HIGH' && exercise.difficulty === 'gentle') {
    reasons.push('your high-risk status requires gentle, safe exercises');
  }

  // WHO guideline reasoning
  if (exercise.category === 'weight-bearing' && exerciseCapacity === 'full') {
    reasons.push('WHO guidelines recommend weight-bearing exercise for bone health');
  } else if (exercise.category === 'balance') {
    reasons.push('balance training is essential for fall prevention');
  } else if (exercise.category === 'strengthening') {
    reasons.push('resistance training builds both muscle and bone strength');
  }

  // Assessment-specific reasoning
  if (profile.recommendations) {
    if (profile.recommendations.some(r => r.toLowerCase().includes('weight-bearing')) && 
        exercise.targetAreas.includes('bones')) {
      reasons.push('your assessment specifically recommended weight-bearing activity');
    }
    
    if (profile.recommendations.some(r => r.toLowerCase().includes('balance')) && 
        exercise.targetAreas.includes('balance')) {
      reasons.push('your assessment identified need for balance improvement');
    }
    
    if (profile.recommendations.some(r => r.toLowerCase().includes('posture')) && 
        exercise.targetAreas.includes('posture')) {
      reasons.push('your assessment showed posture concerns');
    }
  }

  // Risk factor reasoning
  if (profile.risk_factors) {
    if (profile.risk_factors.some(rf => rf.toLowerCase().includes('activity')) && 
        exercise.category === 'weight-bearing') {
      reasons.push('your low activity level needs progressive weight-bearing exercise');
    }
    
    if (profile.risk_factors.some(rf => rf.toLowerCase().includes('balance')) && 
        exercise.targetAreas.includes('balance')) {
      reasons.push('your balance concerns require targeted training');
    }
  }

  // Activity level reasoning
  if (profile.activity_level === 'sedentary' && exercise.category === 'weight-bearing') {
    reasons.push('gradual increase from sedentary lifestyle with safe weight-bearing exercise');
  }

  // Default reasoning
  if (reasons.length === 0) {
    reasons.push(`your ${profile.risk_level.toLowerCase()}-risk profile and clinical assessment results`);
  }

  return `Recommended because of ${reasons.join(' and ')}.`;
}