import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Target, Activity, CheckCircle, Clock, Play, Award, TrendingUp, Zap, Heart, Shield, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_CONFIG } from '../config/api';
import { generatePersonalizedExercises, ExercisePlan, Exercise, SessionFeedback } from '../utils/exercisePersonalizationService';

interface UserProfile {
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

interface PersonalizedExerciseCoachProps {
  onBack: () => void;
  healthData?: any;
  riskCategory?: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ── Completed session record stored in localStorage ───────────────────────────
interface CompletedSession {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: string;
  durationMinutes: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  completedAt: string; // ISO date string
  date: string;        // YYYY-MM-DD
}

// ── Focus area labels derived from exercise categories ────────────────────────
const FOCUS_AREA_LABELS: Record<string, string> = {
  'warmup':         'Warm-Up & Mobility',
  'weight-bearing': 'Bone Health Mobility',
  'strengthening':  'Lower Back Strength',
  'balance':        'Balance Training',
  'posture':        'Posture Support',
  'mobility':       'Flexibility Improvement',
  'stretching':     'Recovery & Flexibility',
};

// ── Derive focus area from most-completed category ────────────────────────────
function deriveFocusArea(sessions: CompletedSession[]): string {
  if (sessions.length === 0) return 'Bone Health Mobility';
  const counts: Record<string, number> = {};
  sessions.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return FOCUS_AREA_LABELS[top] || 'Bone Health Mobility';
}

// ── Calculate streak from session history ─────────────────────────────────────
function calculateStreak(sessions: CompletedSession[]): number {
  if (sessions.length === 0) return 0;
  const activeDays = Array.from(new Set(sessions.map(s => s.date))).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  // Streak must include today or yesterday to be active
  if (activeDays[0] !== today && activeDays[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < activeDays.length; i++) {
    const prev = new Date(activeDays[i - 1]);
    const curr = new Date(activeDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ── Weekly sessions (last 7 days) ─────────────────────────────────────────────
function getWeeklySessions(sessions: CompletedSession[]): CompletedSession[] {
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  return sessions.filter(s => s.date >= cutoff);
}

// ── localStorage key helpers ──────────────────────────────────────────────────
function getSessionsKey(userId: string) { return `caremend_exercise_sessions_${userId}`; }
function loadSessions(userId: string): CompletedSession[] {
  try {
    const raw = localStorage.getItem(getSessionsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveSessions(userId: string, sessions: CompletedSession[]) {
  localStorage.setItem(getSessionsKey(userId), JSON.stringify(sessions));
}

const PersonalizedExerciseCoach: React.FC<PersonalizedExerciseCoachProps> = ({ onBack, healthData, riskCategory }) => {
  // Core state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [exercisePlan, setExercisePlan] = useState<ExercisePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Session state
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [sessionProgress, setSessionProgress] = useState(0);

  // Persisted session history (source of truth for all stats)
  const [allSessions, setAllSessions] = useState<CompletedSession[]>([]);

  // Derived stats — computed from allSessions, never hardcoded
  const weeklySessions  = getWeeklySessions(allSessions);
  const totalSessions   = allSessions.length;
  const streak          = calculateStreak(allSessions);
  const totalMinutes    = allSessions.reduce((s, x) => s + x.durationMinutes, 0);
  const weeklyMinutes   = weeklySessions.reduce((s, x) => s + x.durationMinutes, 0);
  const focusArea       = deriveFocusArea(weeklySessions.length > 0 ? weeklySessions : allSessions);
  const todaySessions   = allSessions.filter(s => s.date === new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // If healthData is passed as prop, use it directly
    if (healthData && riskCategory) {
      console.log('✅ Using healthData from props:', healthData);
      const hd = healthData;
      const profile: UserProfile = {
        risk_level:       hd.riskLevel || riskCategory || 'MEDIUM',
        risk_percentage:  0  /* model score is not a percentage */,
        age:              parseInt(hd.age) || 50,
        gender:           hd.gender || 'female',
        risk_factors:     hd.riskFactors || [],
        recommendations:  hd.recommendations || [],
        activity_level:   hd.activityLevel || 'moderate',
        mobility_issues:  [],
        balance_problems: hd.balanceIssues?.toLowerCase() === 'yes',
        pain_areas:       [],
      };
      
      setUserProfile(profile);
      const plan = generatePersonalizedExercises(profile);
      setExercisePlan(plan);
      setLoading(false);
      setUserId('local-' + Date.now());
      return;
    }
    
    // Fallback to existing behavior
    loadUserProfileAndGenerateExercises();
  }, [healthData, riskCategory]);

  const loadUserProfileAndGenerateExercises = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('caremend_user');
      if (!storedUser) { setError('Please log in to access personalized exercises'); return; }

      const user = JSON.parse(storedUser);
      setUserId(user.id);

      // Load persisted session history immediately (lazy init)
      const saved = loadSessions(user.id);
      setAllSessions(saved);

      // Load today's completed exercise IDs
      const todayDate = new Date().toISOString().split('T')[0];
      const todayIds = saved.filter(s => s.date === todayDate).map(s => s.exerciseId);
      setCompletedExercises(todayIds);

      let profile: UserProfile | null = null;
      let data: any = null;

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/profile/${user.id}`);
        if (response.ok) {
          data = await response.json();
          if (data && data.hasCompletedAssessment && data.latestAssessment) {
            const assessment = data.latestAssessment;
            profile = {
              risk_level:       assessment.risk_level || 'MEDIUM',
              risk_percentage:  assessment.risk_percentage ?? 0,
              age:              assessment.age || 50,
              gender:           assessment.gender || 'female',
              risk_factors:     assessment.risk_factors || [],
              recommendations:  assessment.recommendations || [],
              activity_level:   assessment.physical_activity || 'moderate',
              mobility_issues:  assessment.mobility_issues || [],
              balance_problems: assessment.balance_problems || false,
              pain_areas:       assessment.pain_areas || [],
            };
          }
        }
      } catch (err) {
        console.warn('Backend profile fetch failed, trying local fallback:', err);
      }

      // Local fallback if backend failed or returned no assessment
      if (!profile && user.assessmentCompleted && user.healthData) {
        const hd = user.healthData;
        profile = {
          risk_level:       hd.riskLevel || user.riskCategory || 'MEDIUM',
          risk_percentage:  0  /* model score is not a percentage */,
          age:              parseInt(hd.age) || 50,
          gender:           hd.gender || 'female',
          risk_factors:     hd.riskFactors || [],
          recommendations:  hd.recommendations || [],
          activity_level:   hd.activityLevel || 'moderate',
          mobility_issues:  [],
          balance_problems: hd.balanceIssues?.toLowerCase() === 'yes',
          pain_areas:       [],
        };
      }

      if (profile) {
        setUserProfile(profile);
        const plan = generatePersonalizedExercises(profile);
        setExercisePlan(plan);
        // Update progress bar based on today's completions
        if (plan.exercises.length > 0) {
          setSessionProgress((todayIds.length / plan.exercises.length) * 100);
        }
        setLoading(false);
      } else if (data && data.hasCompletedAssessment === false) {
        setError('Please complete your risk assessment first to get personalized exercises');
        setLoading(false);
      } else {
        setError('Please complete your risk assessment first to get personalized exercises.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setSessionActive(true);
  };

  const completeExercise = (feedback: SessionFeedback) => {
    if (!currentExercise || !userId) return;

    const todayDate = new Date().toISOString().split('T')[0];

    // Build new session record
    const newSession: CompletedSession = {
      id:              `${Date.now()}`,
      exerciseId:      currentExercise.id,
      exerciseName:    currentExercise.name,
      category:        currentExercise.category,
      durationMinutes: currentExercise.duration,
      difficulty:      feedback.difficulty,
      completedAt:     new Date().toISOString(),
      date:            todayDate,
    };

    // Persist
    const updated = [...allSessions, newSession];
    saveSessions(userId, updated);
    setAllSessions(updated);

    // Update today's completed IDs
    const newCompleted = [...completedExercises, currentExercise.id];
    setCompletedExercises(newCompleted);
    if (exercisePlan) {
      setSessionProgress((newCompleted.length / exercisePlan.exercises.length) * 100);
    }

    setCurrentExercise(null);
    setSessionActive(false);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toUpperCase()) {
      case 'LOW':    return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH':   return 'text-red-600 bg-red-50 border-red-200';
      default:       return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized bone health plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Target className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Required</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="w-full bg-[#a32626] hover:bg-[#8b1f1f] text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Personalized Exercise Coach</h1>
                <p className="text-sm text-gray-500">AI-powered bone health training</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Heart className="h-5 w-5 text-red-400" />
              <span className="text-sm text-gray-500">Medically Personalized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Exercise Session */}
      <AnimatePresence>
        {sessionActive && currentExercise && (
          <ExerciseSession
            exercise={currentExercise}
            onComplete={completeExercise}
            onClose={() => {
              setCurrentExercise(null);
              setSessionActive(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      {!sessionActive && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* SECTION 1: Today's Bone Health Plan */}
          {userProfile && exercisePlan && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Target className="h-7 w-7 mr-3 text-blue-600" />
                    Today's Bone Health Plan
                  </h2>
                  <p className="text-gray-600 mt-1">Personalized based on your clinical assessment</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border ${getRiskLevelColor(userProfile.risk_level)}`}>
                  <span className="font-semibold">{userProfile.risk_level} Risk</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Assessment Summary */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-600" />
                    Assessment Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-700">{userProfile.risk_level} result (experimental model, not a diagnosis)</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-700">Age: {userProfile.age} years</span>
                    </div>
                    {userProfile.activity_level && (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-700">Activity level: {userProfile.activity_level}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Today's Focus */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                    Today's Focus
                  </h3>
                  <div className="space-y-2">
                    {exercisePlan.focusAreas.slice(0, 3).map((area, index) => (
                      <div key={index} className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-2" />
                        <span className="text-sm text-gray-700 capitalize">{area.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs font-medium text-blue-900 mb-1">Plan Duration:</div>
                    <div className="text-lg font-bold text-blue-800">{exercisePlan.totalDuration} minutes</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Today's Progress */}
          {sessionProgress > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
                  Today's Progress
                </h2>
                <span className="text-2xl font-bold text-blue-600">{Math.round(sessionProgress)}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${sessionProgress}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{completedExercises.length} of {exercisePlan?.exercises.length || 0} exercises completed today</span>
                <span>{streak > 0 ? `🔥 ${streak}-day streak` : 'Start your streak today'}</span>
              </div>
            </div>
          )}

          {/* SECTION 3: Personalized Exercise Cards */}
          {exercisePlan && (
            <div className="space-y-8">
              {Object.entries(
                exercisePlan.exercises.reduce((acc, exercise) => {
                  if (!acc[exercise.category]) acc[exercise.category] = [];
                  acc[exercise.category].push(exercise);
                  return acc;
                }, {} as Record<string, Exercise[]>)
              ).map(([category, exercises]) => {
                // Category display names and icons
                const categoryConfig = {
                  'warmup': { name: 'Warmup', icon: 'fa-play-circle' },
                  'weight-bearing': { name: 'Weight-Bearing Activity', icon: 'fa-dumbbell' },
                  'strengthening': { name: 'Strength Training', icon: 'fa-fist-raised' },
                  'balance': { name: 'Balance Training', icon: 'fa-balance-scale' },
                  'posture': { name: 'Posture & Spine Health', icon: 'fa-user-check' },
                  'mobility': { name: 'Mobility & Flexibility', icon: 'fa-expand-arrows-alt' },
                  'stretching': { name: 'Stretching & Recovery', icon: 'fa-leaf' }
                };
                
                const config = categoryConfig[category as keyof typeof categoryConfig] || 
                              { name: category.charAt(0).toUpperCase() + category.slice(1), icon: 'fa-circle' };
                
                return (
                  <div key={category} className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 capitalize flex items-center">
                      <i className={`fas ${config.icon} text-[#a32626] mr-3`}></i>
                      {config.name}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({exercises.length} exercise{exercises.length > 1 ? 's' : ''})
                      </span>
                    </h3>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {exercises.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          isCompleted={completedExercises.includes(exercise.id)}
                          onStart={() => startExercise(exercise)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTION 4: Weekly Insights */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Award className="h-6 w-6 mr-2 text-purple-600" />
              Weekly Insights
            </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-[#fdf2f2] rounded-lg">
                <div className="text-2xl font-bold text-[#a32626]">{totalSessions}</div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{streak}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalMinutes}</div>
                <div className="text-sm text-gray-600">Total Minutes</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm font-bold text-yellow-700 leading-tight">{focusArea}</div>
                <div className="text-sm text-gray-600 mt-1">Focus Area</div>
              </div>
            </div>

            {/* Weekly activity bar */}
            {weeklySessions.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">This Week</span>
                  <span className="text-sm text-gray-500">{weeklyMinutes} min · {weeklySessions.length} sessions</span>
                </div>
                <div className="flex gap-1 h-8 items-end">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1) + i);
                    const d = date.toISOString().split('T')[0];
                    const mins = weeklySessions.filter(s => s.date === d).reduce((a, s) => a + s.durationMinutes, 0);
                    const maxMins = Math.max(...['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((_, j) => {
                      const dd = new Date(); dd.setDate(dd.getDate() - (dd.getDay() === 0 ? 6 : dd.getDay() - 1) + j);
                      return weeklySessions.filter(s => s.date === dd.toISOString().split('T')[0]).reduce((a, s) => a + s.durationMinutes, 0);
                    }), 1);
                    const isToday = d === new Date().toISOString().split('T')[0];
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-sm transition-all duration-500"
                          style={{ height: `${Math.max((mins / maxMins) * 28, mins > 0 ? 4 : 0)}px`, background: isToday ? '#a32626' : mins > 0 ? '#a3262680' : '#e5e7eb' }} />
                        <span className={`text-[9px] font-bold uppercase ${isToday ? 'text-[#a32626]' : 'text-gray-400'}`}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent sessions */}
            {allSessions.length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Recent Sessions</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...allSessions].reverse().slice(0, 6).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight">{s.exerciseName}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{FOCUS_AREA_LABELS[s.category] || s.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-600">{s.durationMinutes} min</p>
                        <p className="text-[10px] text-gray-400">{s.date === new Date().toISOString().split('T')[0] ? 'Today' : s.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalSessions === 0 && (
              <div className="text-center py-6 text-gray-400">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No sessions yet</p>
                <p className="text-xs">Complete your first exercise to start tracking progress.</p>
              </div>
            )}

            {totalSessions > 0 && streak > 0 && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900">
                  {streak === 1
                    ? '✅ Great start — you exercised today!'
                    : `🔥 ${streak}-day streak! Consistency is key for bone health.`}
                  {weeklyMinutes >= 150 && ' You\'ve hit the WHO-recommended 150 min/week.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Exercise Card Component
const ExerciseCard: React.FC<{
  exercise: Exercise;
  isCompleted: boolean;
  onStart: () => void;
}> = ({ exercise, isCompleted, onStart }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'gentle': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'challenging': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 transition-all ${
        isCompleted 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200 hover:border-[#a32626] hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
        {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{exercise.duration} min</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
          {exercise.difficulty}
        </span>
      </div>
      
      {exercise.whyRecommended && (
        <div className="bg-[#fdf2f2] rounded-lg p-3 mb-3">
          <h5 className="text-xs font-semibold text-[#a32626] mb-1">Why recommended?</h5>
          <p className="text-xs text-[#8b1f1f]">{exercise.whyRecommended}</p>
        </div>
      )}
      
      <button
        onClick={onStart}
        disabled={isCompleted}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isCompleted
            ? 'bg-green-100 text-green-800 cursor-not-allowed'
            : 'bg-[#a32626] hover:bg-[#8b1f1f] text-white'
        }`}
      >
        {isCompleted ? (
          <span className="flex items-center justify-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Play className="h-4 w-4 mr-2" />
            Start Exercise
          </span>
        )}
      </button>
    </motion.div>
  );
};

// Exercise Session Component
const ExerciseSession: React.FC<{
  exercise: Exercise;
  onComplete: (feedback: SessionFeedback) => void;
  onClose: () => void;
}> = ({ exercise, onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(exercise.duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsActive(false);
            setShowFeedback(true);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFeedback = (difficulty: 'easy' | 'moderate' | 'difficult') => {
    onComplete({ difficulty, completed: true });
  };

  if (showFeedback) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            Exercise Complete!
          </h3>
          <p className="text-gray-600 mb-6">How did you find this exercise?</p>
          
          <div className="space-y-3">
            <button
              onClick={() => handleFeedback('easy')}
              className="w-full py-3 px-4 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors"
            >
              😊 Easy - I could do more
            </button>
            <button
              onClick={() => handleFeedback('moderate')}
              className="w-full py-3 px-4 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
            >
              👍 Just right - Perfect challenge
            </button>
            <button
              onClick={() => handleFeedback('difficult')}
              className="w-full py-3 px-4 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
            >
              😅 Challenging - Need to build up
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{exercise.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-[#a32626] mb-2">
            {formatTime(timeLeft)}
          </div>
          <p className="text-gray-600">{exercise.description}</p>
        </div>
        
        <div className="space-y-4 mb-6">
          {exercise.instructions.map((instruction, index) => (
            <div key={index} className="flex items-start">
              <span className="bg-[#fdf2f2] text-[#a32626] text-sm font-medium px-2 py-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                {index + 1}
              </span>
              <span className="text-gray-700">{instruction}</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-3 flex-wrap">
          {!isActive ? (
            <button
              onClick={() => setIsActive(true)}
              className="bg-[#a32626] hover:bg-[#8b1f1f] text-white px-8 py-3 rounded-lg font-medium flex items-center"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Exercise
            </button>
          ) : (
            <button
              onClick={() => setIsActive(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium"
            >
              Pause
            </button>
          )}
          {/* Allow marking complete early once timer has started */}
          {(isActive || timeLeft < exercise.duration * 60) && (
            <button
              onClick={() => { setIsActive(false); setShowFeedback(true); }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalizedExerciseCoach;
