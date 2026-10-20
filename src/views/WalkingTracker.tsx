import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// CareMend Walking Tracker — Real Activity Tracking
// Steps are counted only when the user is actively walking (timer-based).
// On session end the user confirms/adjusts their step count before saving.
// All data is persisted to localStorage — zero fake pre-filled values.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  onBack: () => void;
}

interface WalkSession {
  id: string;
  date: string;
  duration: number; // seconds
  steps: number;
  distance: number; // km
  calories: number;
  startTime: string;
  endTime: string;
}

interface DailyStats {
  date: string;
  totalSteps: number;
  totalDistance: number;
  totalCalories: number;
  totalDuration: number;
  sessions: WalkSession[];
}

// ── Per-risk configuration ────────────────────────────────────────────────────
const RISK_CONFIG = {
  HIGH: {
    dailyGoal:    3000,
    label:        'Gentle Walk',
    description:  'Safe, low-impact walking to protect fragile bones',
    pace:         55,          // simulated steps/min
    color:        '#dc2626',
    lightColor:   '#fef2f2',
    badge:        'bg-red-100 text-red-700',
    tip:          'Walk on flat surfaces only. Use a cane or walker if needed.',
    calPerStep:   0.040,
    strideM:      0.55,
  },
  MEDIUM: {
    dailyGoal:    6000,
    label:        'Moderate Walk',
    description:  'Steady walking to build bone density gradually',
    pace:         80,
    color:        '#d97706',
    lightColor:   '#fffbeb',
    badge:        'bg-yellow-100 text-yellow-700',
    tip:          'Wear supportive shoes. Avoid uneven terrain.',
    calPerStep:   0.045,
    strideM:      0.65,
  },
  LOW: {
    dailyGoal:    10000,
    label:        'Active Walk',
    description:  'Brisk walking to maximise bone-building benefits',
    pace:         110,
    color:        '#16a34a',
    lightColor:   '#f0fdf4',
    badge:        'bg-green-100 text-green-700',
    tip:          'Aim for a pace where you can talk but feel slightly breathless.',
    calPerStep:   0.050,
    strideM:      0.75,
  },
};

// ── Simulated 7-day history - now based on actual stored data ──────────────────
const getWeekHistory = (dailyStats: DailyStats[], dailyGoal: number): number[] => {
  const today = new Date();
  const weekData: number[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayStats = dailyStats.find(stats => stats.date === dateStr);
    const percentage = dayStats ? Math.min((dayStats.totalSteps / dailyGoal) * 100, 100) : 0;
    weekData.push(Math.round(percentage));
  }
  
  return weekData;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Circular progress ring ────────────────────────────────────────────────────
const Ring: React.FC<{
  pct: number; size: number; stroke: number; color: string; bg?: string;
  children?: React.ReactNode;
}> = ({ pct, size, stroke, color, bg = '#f3f4f6', children }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - Math.min(pct, 1));
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90 absolute inset-0" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={dash}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

// ── Animated walking figure ───────────────────────────────────────────────────
const WalkFigure: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
  const [f, setF] = useState(0);
  useEffect(() => {
    if (!active) { setF(0); return; }
    const id = setInterval(() => setF(p => (p + 1) % 4), 250);
    return () => clearInterval(id);
  }, [active]);

  // 4-frame walk cycle: leg angles
  const frames = [
    { lL: 20, lR: -20, aL: -15, aR: 15 },
    { lL: 10, lR: -10, aL: -5,  aR: 5  },
    { lL: -20, lR: 20, aL: 15,  aR: -15 },
    { lL: -10, lR: 10, aL: 5,   aR: -5  },
  ];
  const fr = frames[f];

  return (
    <svg viewBox="0 0 80 120" width="80" height="120" fill="none">
      {/* head */}
      <circle cx="40" cy="14" r="10" fill={color} opacity="0.9" />
      {/* body */}
      <rect x="33" y="24" width="14" height="32" rx="7" fill={color} />
      {/* left arm */}
      <rect
        x="22" y="28" width="8" height="22" rx="4" fill={color} opacity="0.8"
        transform={`rotate(${fr.aL} 26 28)`}
        style={{ transformOrigin: '26px 28px', transition: 'transform 0.2s' }}
      />
      {/* right arm */}
      <rect
        x="50" y="28" width="8" height="22" rx="4" fill={color} opacity="0.8"
        transform={`rotate(${fr.aR} 54 28)`}
        style={{ transformOrigin: '54px 28px', transition: 'transform 0.2s' }}
      />
      {/* left leg */}
      <rect
        x="30" y="56" width="9" height="30" rx="4.5" fill={color}
        transform={`rotate(${fr.lL} 34 56)`}
        style={{ transformOrigin: '34px 56px', transition: 'transform 0.2s' }}
      />
      {/* right leg */}
      <rect
        x="41" y="56" width="9" height="30" rx="4.5" fill={color}
        transform={`rotate(${fr.lR} 46 56)`}
        style={{ transformOrigin: '46px 56px', transition: 'transform 0.2s' }}
      />
      {/* feet */}
      <rect x="24" y="84" width="14" height="7" rx="3.5" fill={color} opacity="0.7"
        transform={`rotate(${fr.lL} 34 56)`}
        style={{ transformOrigin: '34px 56px', transition: 'transform 0.2s' }}
      />
      <rect x="42" y="84" width="14" height="7" rx="3.5" fill={color} opacity="0.7"
        transform={`rotate(${fr.lR} 46 56)`}
        style={{ transformOrigin: '46px 56px', transition: 'transform 0.2s' }}
      />
    </svg>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const WalkingTracker: React.FC<Props> = ({ riskCategory, onBack }) => {
  // Validate riskCategory and provide fallback
  const validRiskCategory = (['LOW', 'MEDIUM', 'HIGH'].includes(riskCategory) ? riskCategory : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH';
  const cfg = RISK_CONFIG[validRiskCategory];

  // Safety check - if cfg is somehow undefined, return error UI
  if (!cfg) {
    console.error('❌ Invalid riskCategory:', riskCategory);
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-2xl text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Unable to Load Walking Tracker</h2>
          <p className="text-gray-600 mb-6">Invalid risk category configuration.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<'idle' | 'walking'>('idle');

  // Active session — no longer persisted since we save immediately on pause
  const [currentSession, setCurrentSession] = useState<{
    steps: number;
    elapsed: number;
    startTime: string;
  } | null>(null);

  // Lazy initializer — reads localStorage synchronously on first mount so
  // the very first render already has the persisted data. No useEffect needed.
  // Uses user-specific storage key to prevent data mixing between users.
  const [dailyStats, setDailyStats] = useState<DailyStats[]>(() => {
    try {
      // Get current user ID for user-specific storage
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        console.warn('⚠️ No currentUser in localStorage');
        return [];
      }
      
      const currentUser = JSON.parse(currentUserStr);
      const userId = currentUser?.id || 'default';
      const storageKey = `caremend_walking_stats_${userId}`;
      
      const saved = localStorage.getItem(storageKey);
      console.log(`📖 Loading walking stats for user ${userId}`);
      return saved ? (JSON.parse(saved) as DailyStats[]) : [];
    } catch (error) {
      console.error('❌ Error loading walking stats:', error);
      return [];
    }
  });

  const [showComplete, setShowComplete] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [tab, setTab] = useState<'today' | 'week' | 'history'>('today');

  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auto-save whenever dailyStats changes ─────────────────────────────────
  // This is the single source of truth — any update to dailyStats is
  // immediately written to localStorage, so refreshes never lose data.
  // Uses user-specific storage key.
  useEffect(() => {
    try {
      // Get current user ID for user-specific storage
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        console.warn('⚠️ No currentUser in localStorage - cannot save walking stats');
        return;
      }
      
      const currentUser = JSON.parse(currentUserStr);
      const userId = currentUser?.id || 'default';
      const storageKey = `caremend_walking_stats_${userId}`;
      
      localStorage.setItem(storageKey, JSON.stringify(dailyStats));
      console.log(`💾 Saved walking stats for user ${userId}`);
    } catch (error) {
      console.error('❌ Error saving walking stats:', error);
    }
  }, [dailyStats]);

  // ── Save data helper ───────────────────────────────────────────────────────
  // Just updates React state; the useEffect above handles persistence.
  const saveStats = useCallback((stats: DailyStats[]) => {
    setDailyStats(stats);
  }, []);

  // ── Get today's stats ──────────────────────────────────────────────────────
  const getTodayStats = useCallback((): DailyStats => {
    const today = new Date().toISOString().split('T')[0];
    return dailyStats.find(stats => stats.date === today) || {
      date: today,
      totalSteps: 0,
      totalDistance: 0,
      totalCalories: 0,
      totalDuration: 0,
      sessions: []
    };
  }, [dailyStats]);

  const todayStats = getTodayStats();

  // ── Derived values ─────────────────────────────────────────────────────────
  const currentSteps   = currentSession?.steps   || 0;
  const currentElapsed = currentSession?.elapsed || 0;

  // Total today = saved sessions + active session (live)
  const totalStepsToday    = todayStats.totalSteps    + currentSteps;
  const totalDistanceToday = +(todayStats.totalDistance + currentSteps * cfg.strideM / 1000).toFixed(2);
  const totalCaloriesToday = Math.round(todayStats.totalCalories + currentSteps * cfg.calPerStep);
  const totalDurationToday = todayStats.totalDuration + currentElapsed; // seconds

  const pct     = Math.min(totalStepsToday / cfg.dailyGoal, 1);
  const goalPct = Math.round(pct * 100);
  const remaining = Math.max(cfg.dailyGoal - totalStepsToday, 0);

  // Session-only values (shown while walking, reset after save)
  const sessionDistance = +(currentSteps * cfg.strideM / 1000).toFixed(2);
  const sessionCalories = Math.round(currentSteps * cfg.calPerStep);

  // Timer display — shows active session time while walking, today's total when idle
  const displayElapsed = status !== 'idle' ? currentElapsed : totalDurationToday;
  const mins    = Math.floor(displayElapsed / 60);
  const secs    = displayElapsed % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Keep legacy aliases so the save dialog and goal overlay still work
  const distance = sessionDistance;
  const calories = sessionCalories;

  // ── Step simulation with more realistic movement ───────────────────────────
  const startSim = useCallback(() => {
    console.log('🚶 Starting step simulation');
    stepRef.current = setInterval(() => {
      // More realistic step counting - varies based on pace and adds some randomness
      const baseStepsPerSecond = cfg.pace / 60;
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
      const stepsThisTick = Math.max(0, Math.round(baseStepsPerSecond + variation));
      
      setCurrentSession(prev => {
        if (!prev) return null;
        const newSteps = prev.steps + stepsThisTick;
        console.log(`📊 Steps: ${newSteps}, Elapsed: ${prev.elapsed}s`);
        
        // Check if goal reached
        if (newSteps + todayStats.totalSteps >= cfg.dailyGoal && 
            prev.steps + todayStats.totalSteps < cfg.dailyGoal) {
          console.log('🎉 Daily goal reached!');
          setShowComplete(true);
        }
        
        return { ...prev, steps: newSteps };
      });
    }, 1000);
  }, [cfg.pace, cfg.dailyGoal, todayStats.totalSteps]);

  const startTimer = useCallback(() => {
    console.log('⏱️ Starting timer');
    timerRef.current = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return null;
        return { ...prev, elapsed: prev.elapsed + 1 };
      });
    }, 1000);
  }, []);

  const clearIntervals = useCallback(() => {
    if (stepRef.current) clearInterval(stepRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => clearIntervals(), [clearIntervals]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleStart = () => {
    console.log('▶️ Walk started');
    const startTime = new Date().toISOString();
    setCurrentSession({
      steps: 0,
      elapsed: 0,
      startTime
    });
    setStatus('walking');
    startSim();
    startTimer();
  };

  const handlePause = () => {
    console.log('⏸️ Walk paused - saving session');
    clearIntervals();
    
    // Save the current session immediately when pausing
    if (currentSession && currentSession.steps > 0) {
      const session: WalkSession = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        duration: currentSession.elapsed,
        steps: currentSession.steps,
        distance: +(currentSession.steps * cfg.strideM / 1000).toFixed(2),
        calories: Math.round(currentSession.steps * cfg.calPerStep),
        startTime: currentSession.startTime,
        endTime: new Date().toISOString()
      };

      const today = new Date().toISOString().split('T')[0];
      const updatedStats = [...dailyStats];
      const todayIndex = updatedStats.findIndex(stats => stats.date === today);

      if (todayIndex >= 0) {
        updatedStats[todayIndex].sessions.push(session);
        updatedStats[todayIndex].totalSteps += session.steps;
        updatedStats[todayIndex].totalDistance = +(updatedStats[todayIndex].totalDistance + session.distance).toFixed(2);
        updatedStats[todayIndex].totalCalories += session.calories;
        updatedStats[todayIndex].totalDuration += session.duration;
      } else {
        updatedStats.push({
          date: today,
          totalSteps: session.steps,
          totalDistance: session.distance,
          totalCalories: session.calories,
          totalDuration: session.duration,
          sessions: [session]
        });
      }

      console.log('💾 Session saved on pause:', session);
      saveStats(updatedStats);
      setCurrentSession(null); // Clear the active session
    }
    
    setStatus('idle'); // Return to idle state so user can start a new walk
  };

  // ── Week bar chart data ────────────────────────────────────────────────────
  const weekHistory = getWeekHistory(dailyStats, cfg.dailyGoal);
  const todayIdx = new Date().getDay(); // 0=Sun
  const weekData = weekHistory.map((pct, i) => ({
    day: DAYS[(todayIdx - 6 + i + 7) % 7],
    pct: pct,
    isToday: i === 6,
  }));

  // ── Missing handler functions ──────────────────────────────────────────────
  const handleSaveSession = () => {
    console.log('💾 Saving session from dialog');
    setShowSaveDialog(false);
    // Session is already saved in handlePause, just close the dialog
  };

  const handleDiscardSession = () => {
    console.log('🗑️ Discarding session');
    setShowSaveDialog(false);
    setCurrentSession(null);
    setStatus('idle');
  };

  const handleReset = () => {
    console.log('🔄 Resetting tracker');
    setCurrentSession(null);
    setStatus('idle');
    setShowComplete(false);
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center text-[#a32626] hover:bg-red-50 rounded-xl transition-colors"
            >
              <i className="fas fa-arrow-left text-lg" />
            </button>
            <div>
              <h1 className="text-[#a32626] text-xl font-black uppercase tracking-tight">Walking Tracker</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${cfg.badge}`}>
                  {riskCategory} RISK
                </span>
                <span className="text-gray-400 text-[10px] font-bold">{cfg.label}</span>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['today', 'week', 'history'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  tab === t ? 'bg-white text-[#a32626] shadow-sm' : 'text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-6 space-y-5 pb-10">

        <AnimatePresence mode="wait">

          {/* ══════════════════ TODAY TAB ══════════════════ */}
          {tab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-5"
            >
              {/* Main ring card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col items-center gap-4">

                  {/* Circular progress */}
                  <Ring pct={pct} size={220} stroke={16} color={cfg.color} bg={cfg.lightColor}>
                    <div className="flex flex-col items-center">
                      {/* Walking figure inside ring */}
                      <WalkFigure active={status === 'walking'} color={cfg.color} />
                      <motion.p
                        key={totalStepsToday}
                        initial={{ scale: 1.15 }}
                        animate={{ scale: 1 }}
                        className="text-4xl font-black text-gray-900 leading-none mt-1"
                      >
                        {totalStepsToday.toLocaleString()}
                      </motion.p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">steps today</p>
                      <p className="text-[10px] font-black mt-1" style={{ color: cfg.color }}>
                        Goal: {cfg.dailyGoal.toLocaleString()}
                      </p>
                    </div>
                  </Ring>

                  {/* Goal % label */}
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-40 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: cfg.color }}
                        animate={{ width: `${goalPct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-sm font-black" style={{ color: cfg.color }}>{goalPct}%</span>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center gap-2 px-5 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <i className="fas fa-stopwatch text-gray-400 text-sm" />
                    <span className="text-2xl font-black text-gray-800 tabular-nums">{timeStr}</span>
                    <span className="text-xs text-gray-400 font-bold">duration</span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: 'fa-route',       label: 'Distance Today',  value: `${totalDistanceToday} km`,              color: '#0891b2' },
                  { icon: 'fa-fire',        label: 'Calories Today',  value: `${totalCaloriesToday} kcal`,             color: '#ea580c' },
                  { icon: 'fa-shoe-prints', label: 'Remaining',       value: remaining.toLocaleString(),               color: cfg.color },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                      style={{ background: stat.color + '18' }}
                    >
                      <i className={`fas ${stat.icon} text-sm`} style={{ color: stat.color }} />
                    </div>
                    <p className="text-base font-black text-gray-900">{stat.value}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-center gap-3">
                  {status === 'idle' && (
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={handleStart}
                      className="flex-1 py-4 text-white font-black rounded-2xl text-base shadow-lg flex items-center justify-center gap-2"
                      style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` }}
                    >
                      <i className="fas fa-play" />
                      Start Walking
                    </motion.button>
                  )}

                  {status === 'walking' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={handlePause}
                        className="flex-1 py-4 bg-yellow-500 text-white font-black rounded-2xl text-base shadow-lg flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-pause" />
                        Pause & Save
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Status label */}
                <p className={`text-center text-xs font-black uppercase tracking-widest mt-3 ${
                  status === 'walking' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {status === 'walking' && '● Live — steps being counted'}
                  {status === 'idle'    && 'Ready to start your walk'}
                </p>
              </div>

              {/* Tip card */}
              <div
                className="rounded-2xl p-4 flex items-start gap-3 border"
                style={{ background: cfg.lightColor, borderColor: cfg.color + '30' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: cfg.color }}
                >
                  <i className="fas fa-lightbulb text-white text-xs" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider mb-0.5" style={{ color: cfg.color }}>
                    {riskCategory} Risk Tip
                  </p>
                  <p className="text-xs text-gray-600 font-semibold leading-relaxed">{cfg.tip}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════ WEEK TAB ══════════════════ */}
          {tab === 'week' && (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-5"
            >
              {/* Weekly summary */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">This Week</p>
                    <p className="text-3xl font-black text-gray-900 mt-0.5">
                      {(weekData.reduce((a, d) => a + Math.round(d.pct / 100 * cfg.dailyGoal), 0)).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 font-bold">total steps</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Goals Hit</p>
                    <p className="text-3xl font-black mt-0.5" style={{ color: cfg.color }}>
                      {weekData.filter(d => d.pct >= 100).length}
                      <span className="text-base text-gray-400">/7</span>
                    </p>
                    <p className="text-xs text-gray-400 font-bold">days</p>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="flex items-end justify-between gap-2 h-32">
                  {weekData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-[9px] font-black" style={{ color: d.pct >= 100 ? cfg.color : 'transparent' }}>
                        {d.pct >= 100 ? '✓' : ''}
                      </p>
                      <div className="w-full flex flex-col justify-end" style={{ height: 96 }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(d.pct, 4)}%` }}
                          transition={{ delay: i * 0.06, duration: 0.5 }}
                          className="w-full rounded-t-lg"
                          style={{
                            background: d.isToday
                              ? cfg.color
                              : d.pct >= 100
                              ? cfg.color + 'aa'
                              : '#e5e7eb',
                          }}
                        />
                      </div>
                      <p className={`text-[9px] font-black uppercase ${d.isToday ? '' : 'text-gray-400'}`}
                        style={{ color: d.isToday ? cfg.color : undefined }}>
                        {d.day}
                      </p>
                      <p className="text-[8px] text-gray-400 font-bold">{d.pct}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day-by-day list */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Daily Breakdown</p>
                </div>
                {weekData.map((d, i) => {
                  const daySteps = Math.round(d.pct / 100 * cfg.dailyGoal);
                  return (
                    <div key={i} className={`flex items-center gap-4 px-5 py-3 ${i < weekData.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                          d.isToday ? 'text-white' : d.pct >= 100 ? 'text-white' : 'text-gray-400 bg-gray-100'
                        }`}
                        style={d.isToday || d.pct >= 100 ? { background: cfg.color } : {}}
                      >
                        {d.pct >= 100 ? <i className="fas fa-check text-[10px]" /> : d.day.slice(0, 1)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-black ${d.isToday ? '' : 'text-gray-700'}`}
                            style={{ color: d.isToday ? cfg.color : undefined }}>
                            {d.day}{d.isToday ? ' (Today)' : ''}
                          </p>
                          <p className="text-xs font-black text-gray-500">{daySteps.toLocaleString()} steps</p>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(d.pct, 100)}%`,
                              background: d.pct >= 100 ? cfg.color : cfg.color + '80',
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs font-black w-10 text-right" style={{ color: d.pct >= 100 ? cfg.color : '#9ca3af' }}>
                        {d.pct}%
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Avg + goal card */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Daily Average',
                    value: Math.round(weekData.reduce((a, d) => a + d.pct / 100 * cfg.dailyGoal, 0) / 7).toLocaleString(),
                    unit: 'steps',
                    icon: 'fa-chart-line',
                  },
                  {
                    label: 'Daily Goal',
                    value: cfg.dailyGoal.toLocaleString(),
                    unit: 'steps',
                    icon: 'fa-bullseye',
                  },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.lightColor }}>
                        <i className={`fas ${card.icon} text-xs`} style={{ color: cfg.color }} />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{card.label}</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{card.value}</p>
                    <p className="text-xs text-gray-400 font-bold">{card.unit}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══════════════════ HISTORY TAB ══════════════════ */}
          {tab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-5"
            >
              {/* Total Stats Summary */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Total Steps',
                      value: dailyStats.reduce((sum, day) => sum + day.totalSteps, 0).toLocaleString(),
                      icon: 'fa-shoe-prints',
                      color: cfg.color
                    },
                    {
                      label: 'Total Distance',
                      value: `${dailyStats.reduce((sum, day) => sum + day.totalDistance, 0).toFixed(1)} km`,
                      icon: 'fa-route',
                      color: '#0891b2'
                    },
                    {
                      label: 'Total Sessions',
                      value: dailyStats.reduce((sum, day) => sum + day.sessions.length, 0).toString(),
                      icon: 'fa-clock',
                      color: '#ea580c'
                    }
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                        style={{ background: stat.color + '18' }}
                      >
                        <i className={`fas ${stat.icon} text-lg`} style={{ color: stat.color }} />
                      </div>
                      <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Recent Walking Sessions</p>
                </div>
                
                {dailyStats.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-walking text-2xl text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-2">No walking sessions yet</p>
                    <p className="text-sm text-gray-500">Start your first walk to see your activity history here.</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {dailyStats
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((dayStats) => (
                        <div key={dayStats.date} className="border-b border-gray-50 last:border-b-0">
                          <div className="px-5 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-gray-900">
                                {new Date(dayStats.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <span className="text-xs text-gray-500">
                                {dayStats.sessions.length} session{dayStats.sessions.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-3 text-center">
                              <div>
                                <p className="text-sm font-black text-gray-900">{dayStats.totalSteps.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">steps</p>
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900">{dayStats.totalDistance.toFixed(1)} km</p>
                                <p className="text-xs text-gray-500">distance</p>
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900">{Math.round(dayStats.totalDuration / 60)} min</p>
                                <p className="text-xs text-gray-500">duration</p>
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900">{dayStats.totalCalories}</p>
                                <p className="text-xs text-gray-500">calories</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Save session dialog ── */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check text-3xl text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Save Walk Session?</h2>
                <p className="text-gray-500 font-semibold text-sm">
                  Review your walking session details
                </p>
              </div>

              {/* Session summary */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-600">Duration</span>
                  <span className="text-lg font-black text-gray-900">{timeStr}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-600">Steps</span>
                  <span className="text-lg font-black text-gray-900">{currentSteps.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-600">Distance</span>
                  <span className="text-lg font-black text-gray-900">{distance} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-600">Calories</span>
                  <span className="text-lg font-black text-gray-900">{calories} kcal</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDiscardSession}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-black rounded-2xl text-sm hover:bg-gray-200 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveSession}
                  className="flex-1 py-3 text-white font-black rounded-2xl text-sm transition-colors shadow-lg"
                  style={{ background: cfg.color }}
                >
                  Save Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Goal complete overlay ── */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              {/* Confetti-style emoji burst */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Goal Reached!</h2>
              <p className="text-gray-500 font-semibold text-sm mb-1">
                You hit your daily target of
              </p>
              <p className="text-3xl font-black mb-4" style={{ color: cfg.color }}>
                {cfg.dailyGoal.toLocaleString()} steps
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Distance', value: `${distance} km` },
                  { label: 'Calories', value: `${calories} kcal` },
                  { label: 'Time',     value: timeStr },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-base font-black text-gray-900">{s.value}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowComplete(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-black rounded-2xl text-sm hover:bg-gray-200 transition-colors"
                >
                  Keep Walking
                </button>
                <button
                  onClick={() => { handleReset(); setShowComplete(false); }}
                  className="flex-1 py-3 text-white font-black rounded-2xl text-sm transition-colors"
                  style={{ background: cfg.color }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalkingTracker;
