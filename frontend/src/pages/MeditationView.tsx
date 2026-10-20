import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Theme ─────────────────────────────────────────────────────────────────────
const M  = '#8B1E2D';   // maroon
const MD = '#6E1423';   // dark maroon
const ML = '#fdf0f0';   // maroon light

interface Props {
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  onBack: () => void;
}

// ── Config ────────────────────────────────────────────────────────────────────
const RISK_CONFIG = {
  HIGH:   { suggestedMins: 5,  tip: 'Daily sessions significantly lower cortisol levels.' },
  MEDIUM: { suggestedMins: 10, tip: 'Consistent meditation reduces inflammation linked to bone loss.' },
  LOW:    { suggestedMins: 15, tip: 'Meditation supports the mind-body connection that aids bone health.' },
};

// ── Meditation Audio Configuration ────────────────────────────────────────────
// Using working audio URLs with local file fallback
const TRACKS = [
  { 
    id: 1, 
    title: 'Clockwork Silence', 
    mood: 'Time Slows Quietly', 
    icon: 'fa-wind', 
    color: '#e0f2fe', 
    audioKey: 'breezy',
    // Try local first, then fallback to CDN
    urls: [
      '/audio/breezy-lofi.mp3',
      'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
      'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
    ],
    pixabayUrl: 'https://pixabay.com/music/lofi-mindful-breath-zen-lofi-469327/',
    description: 'Mindful Breath - Zen Lofi'
  },
  { 
    id: 2, 
    title: 'Rainveil Serenity', 
    mood: 'Soft & Calming', 
    icon: 'fa-cloud-rain', 
    color: '#ede9fe', 
    audioKey: 'rain',
    urls: [
      '/audio/rain-drops.mp3',
      'https://cdn.pixabay.com/download/audio/2022/03/10/audio_4e40a1e2d5.mp3',
      'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3'
    ],
    pixabayUrl: 'https://pixabay.com/music/lofi-ink-amp-rain-zen-lofi-469329/',
    description: 'Ink & Rain - Zen Lofi'
  },
  { 
    id: 3, 
    title: 'Midnight Snowfall', 
    mood: 'Rain Through Darkness', 
    icon: 'fa-water', 
    color: '#dcfce7', 
    audioKey: 'ocean',
    urls: [
      '/audio/ocean-waves.mp3',
      'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3',
      'https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3'
    ],
    pixabayUrl: 'https://pixabay.com/music/lofi-hearth-amp-home-zen-lofi-469325/',
    description: 'Hearth & Home - Zen Lofi'
  },
];

const BREATH_CYCLE = [
  { phase: 'inhale', label: 'Breathe In',  secs: 4 },
  { phase: 'hold',   label: 'Hold',        secs: 4 },
  { phase: 'exhale', label: 'Breathe Out', secs: 6 },
  { phase: 'rest',   label: 'Rest',        secs: 2 },
];

const PROMPTS = [
  'Breathe in...',
  'Relax your body...',
  'Be grateful for all you have',
  'Let go of tension...',
  'You are at peace...',
  'Focus on your breath',
  'Feel the stillness...',
  'Be calm and relaxed',
];

const DAYS   = ['S','M','T','W','T','F','S'];
const MONTHS = ['Jan','Feb','Mar','Apr','May'];

// ── Animated SVG timer ring ───────────────────────────────────────────────────
const TimerRing: React.FC<{ pct: number; size: number; stroke: number }> = ({ pct, size, stroke }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg className="-rotate-90" width={size} height={size} style={{ position: 'absolute' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="white" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 1, ease: 'linear' }}
      />
    </svg>
  );
};

// ── Step wizard indicator ─────────────────────────────────────────────────────
const WizardStep: React.FC<{ num: number; label: string; active: boolean; done: boolean }> = ({ num, label, active, done }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300"
      style={{
        background: done || active ? M : '#e5e7eb',
        color: done || active ? '#fff' : '#9ca3af',
        boxShadow: active ? `0 4px 16px rgba(139,30,45,0.4)` : 'none',
        transform: active ? 'scale(1.1)' : 'scale(1)',
      }}>
      {done ? <i className="fas fa-check text-xs" /> : num}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: active ? M : '#9ca3af' }}>{label}</span>
  </div>
);

const WizardLine: React.FC<{ done: boolean }> = ({ done }) => (
  <div className="flex-1 h-0.5 mb-5 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
    <motion.div className="h-full rounded-full" style={{ background: M }}
      animate={{ width: done ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const MeditationView: React.FC<Props> = ({ riskCategory, onBack }) => {
  const cfg = RISK_CONFIG[riskCategory];

  type FlowStep = 1 | 2 | 3 | 'session' | 'done';
  const [step, setStep]           = useState<FlowStep>(1);
  const [timerMins, setTimerMins] = useState(cfg.suggestedMins);
  const [track, setTrack]         = useState(TRACKS[0]);
  const [timeLeft, setTimeLeft]   = useState(0);
  const [breathIdx, setBreathIdx] = useState(0);
  const [breathSec, setBreathSec] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [isPaused, setIsPaused]   = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [volume, setVolume]       = useState(0.6);
  const [streak, setStreak]       = useState([true, true, false, true, true, false, false]);
  const [heatmap]                 = useState(() =>
    Array.from({ length: 5 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => Math.random() > 0.55 && !(w === 4 && d > 4))
    )
  );

  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSecs   = timerMins * 60;
  const timerPct    = totalSecs > 0 ? (totalSecs - timeLeft) / totalSecs : 0;
  const timeStr     = `${String(Math.floor(timeLeft / 60)).padStart(2,'0')}:${String(timeLeft % 60).padStart(2,'0')}`;
  const breathPhase = BREATH_CYCLE[breathIdx];

  useEffect(() => {
    const a = new Audio();
    a.loop = true;
    a.volume = volume;
    a.preload = 'none'; // don't load until needed
    a.onerror = () => setAudioError(true);
    audioRef.current = a;
    return () => { a.pause(); a.src = ''; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const clearAll = useCallback(() => {
    [timerRef, breathRef, promptRef].forEach(r => { if (r.current) clearInterval(r.current); });
  }, []);

  useEffect(() => () => clearAll(), [clearAll]);

  const startBreathing = useCallback(() => {
    let idx = 0, sec = 0;
    setBreathIdx(0); setBreathSec(0);
    breathRef.current = setInterval(() => {
      sec++;
      if (sec >= BREATH_CYCLE[idx].secs) { idx = (idx + 1) % BREATH_CYCLE.length; sec = 0; }
      setBreathIdx(idx); setBreathSec(sec);
    }, 1000);
  }, []);

  const startPrompts = useCallback(() => {
    let i = 0;
    promptRef.current = setInterval(() => { i = (i + 1) % PROMPTS.length; setPromptIdx(i); }, 7000);
  }, []);

  const beginSession = useCallback(() => {
    setTimeLeft(timerMins * 60);
    setIsPaused(false); 
    setAudioError(false);
    setStep('session');

    // Robust audio loading with fallback URLs
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.volume = volume;
      audio.loop = true;
      
      let urlIndex = 0;
      const tryNextUrl = () => {
        if (urlIndex >= track.urls.length) {
          console.error(`✗ ALL AUDIO URLS FAILED for ${track.title}`);
          setAudioError(true);
          return;
        }
        
        const currentUrl = track.urls[urlIndex];
        console.log(`🎵 Trying audio URL ${urlIndex + 1}/${track.urls.length}: ${currentUrl}`);
        
        audio.src = currentUrl;
        audio.load();
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`✓ AUDIO PLAYING: ${track.title}`);
              console.log(`✓ Audio URL: ${currentUrl}`);
              console.log(`✓ Volume: ${audio.volume}, Loop: ${audio.loop}`);
            })
            .catch((error) => {
              console.warn(`✗ URL ${urlIndex + 1} failed:`, error.message);
              urlIndex++;
              tryNextUrl();
            });
        }
      };
      
      // Handle audio errors and try next URL
      audio.onerror = () => {
        console.warn(`✗ Audio error on URL ${urlIndex + 1}`);
        urlIndex++;
        tryNextUrl();
      };
      
      // Start trying URLs
      tryNextUrl();
    }

    startBreathing(); 
    startPrompts();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearAll(); 
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          setStreak(s => { const n = [...s]; n[6] = true; return n; });
          setStep('done'); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerMins, track, volume, startBreathing, startPrompts, clearAll]);

  const pauseResume = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      if (audioRef.current) {
        const p = audioRef.current.play();
        if (p !== undefined) p.catch(() => {});
      }
      startBreathing(); startPrompts();
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearAll(); audioRef.current?.pause(); setStreak(s => { const n=[...s]; n[6]=true; return n; }); setStep('done'); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsPaused(true); clearAll(); audioRef.current?.pause();
    }
  }, [isPaused, startBreathing, startPrompts, clearAll]);

  const resetToSetup = useCallback(() => {
    clearAll(); audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setTimeLeft(0); setBreathIdx(0); setBreathSec(0); setPromptIdx(0); setIsPaused(false);
    setStep(1);
  }, [clearAll]);

  const breathScale = (() => {
    if (step !== 'session' || isPaused) return 1;
    const p = breathSec / breathPhase.secs;
    if (breathPhase.phase === 'inhale') return 0.85 + p * 0.35;
    if (breathPhase.phase === 'hold')   return 1.2;
    if (breathPhase.phase === 'exhale') return 1.2 - p * 0.35;
    return 0.85;
  })();

  const isSetup = step === 1 || step === 2 || step === 3;

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F5' }}>

      {/* ── HEADER ── */}
      <header className="cm-header">
        <div className="cm-header-inner">
          <div className="flex items-center gap-3">
            <button onClick={step === 'session' ? resetToSetup : onBack}
              className="btn-back" aria-label="Go back">
              <i className="fas fa-arrow-left icon-md" />
            </button>
            <div>
              <h1 className="text-base font-black" style={{ color: M }}>Meditation</h1>
              <p className="text-[11px] text-gray-400 font-medium">Bone Health & Stress Relief</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: ML, color: M }}>
            {riskCategory} RISK
          </span>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          SETUP FLOW — Steps 1, 2, 3
      ══════════════════════════════════════════ */}
      {isSetup && (
        <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

          {/* Wizard indicator */}
          <div className="flex items-center gap-2">
            <WizardStep num={1} label="Duration"   active={step === 1} done={step === 2 || step === 3} />
            <WizardLine done={step === 2 || step === 3} />
            <WizardStep num={2} label="Soundscape" active={step === 2} done={step === 3} />
            <WizardLine done={step === 3} />
            <WizardStep num={3} label="Begin"      active={step === 3} done={false} />
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Duration ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                  <h2 className="text-xl font-black mb-1" style={{ color: M }}>Session Duration</h2>
                  <p className="text-sm text-gray-400 mb-6">How long would you like to meditate?</p>

                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {[5, 10, 15].map(m => (
                      <button key={m} onClick={() => setTimerMins(m)}
                        className="relative rounded-2xl p-5 text-center border-2 transition-all hover:scale-105"
                        style={{
                          borderColor: timerMins === m ? M : '#e5e7eb',
                          background:  timerMins === m ? `linear-gradient(135deg, ${M}, ${MD})` : '#fff',
                          boxShadow:   timerMins === m ? `0 8px 24px rgba(139,30,45,0.3)` : '0 2px 8px rgba(0,0,0,0.04)',
                        }}>
                        {m === cfg.suggestedMins && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black"
                            style={{ background: timerMins === m ? 'rgba(255,255,255,0.3)' : M, color: '#fff' }}>
                            Suggested
                          </div>
                        )}
                        <div className="text-4xl font-black mb-1" style={{ color: timerMins === m ? '#fff' : M }}>{m}</div>
                        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: timerMins === m ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>min</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: ML }}>
                    <i className="fas fa-info-circle text-sm mt-0.5" style={{ color: M }} />
                    <p className="text-xs font-medium" style={{ color: M }}>{cfg.tip}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                    Next <i className="fas fa-arrow-right icon-md" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Soundscape ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                  <h2 className="text-xl font-black mb-1" style={{ color: M }}>Choose Soundscape</h2>
                  <p className="text-sm text-gray-400 mb-6">Select a calming background sound</p>

                  <div className="space-y-3">
                    {TRACKS.map(t => (
                      <button key={t.id} onClick={() => setTrack(t)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.01]"
                        style={{
                          borderColor: track.id === t.id ? M : '#e5e7eb',
                          background:  track.id === t.id ? ML : '#fff',
                          boxShadow:   track.id === t.id ? `0 4px 16px rgba(139,30,45,0.15)` : 'none',
                        }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ background: track.id === t.id ? M : t.color }}>
                          <i className={`fas ${t.icon} text-xl`} style={{ color: track.id === t.id ? '#fff' : '#374151' }} />
                        </div>
                        <div className="flex-1">
                          <div className="font-black text-gray-800">{t.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{t.mood}</div>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-[9px] font-bold text-gray-400">
                              <i className="fas fa-clock mr-1" />{timerMins} min
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ background: track.id === t.id ? M : '#f3f4f6' }}>
                          <i className={`fas ${track.id === t.id ? 'fa-check' : 'fa-play'} text-sm`}
                            style={{ color: track.id === t.id ? '#fff' : '#9ca3af' }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                    <i className="fas fa-arrow-left icon-md" /> Back
                  </button>
                  <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
                    Next <i className="fas fa-arrow-right icon-md" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Ready ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-4">
                  {/* Lotus icon */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${M}, ${MD})`, boxShadow: `0 12px 32px rgba(139,30,45,0.35)` }}>
                    <i className="fas fa-spa text-4xl text-white" />
                  </motion.div>

                  <h2 className="text-2xl font-black mb-2" style={{ color: M }}>Ready to Begin</h2>
                  <p className="text-gray-400 text-sm mb-8">Your session is configured and ready</p>

                  {/* Summary chips */}
                  <div className="flex justify-center gap-4 mb-8">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: '#F5F5F5' }}>
                      <i className="fas fa-clock text-sm" style={{ color: M }} />
                      <div className="text-left">
                        <div className="text-lg font-black" style={{ color: M }}>{timerMins}</div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Minutes</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: '#F5F5F5' }}>
                      <i className={`fas ${track.icon} text-sm`} style={{ color: M }} />
                      <div className="text-left">
                        <div className="text-sm font-black" style={{ color: M }}>{track.title}</div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Soundscape</div>
                      </div>
                    </div>
                  </div>

                  <motion.button onClick={beginSession}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-2xl font-black text-white text-lg"
                    style={{ background: `linear-gradient(135deg, ${M}, ${MD})`, boxShadow: `0 8px 28px rgba(139,30,45,0.4)` }}>
                    <i className="fas fa-play mr-3" />
                    Begin Meditation
                  </motion.button>
                </div>

                <div className="flex justify-start">
                  <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                    <i className="fas fa-arrow-left icon-md" /> Back
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      )}

      {/* ══════════════════════════════════════════
          ACTIVE SESSION — full-screen immersive
          (matches reference: concentric circles,
           large prompt text, pause button)
      ══════════════════════════════════════════ */}
      {step === 'session' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: isPaused
            ? `linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)`
            : `linear-gradient(160deg, ${M} 0%, ${MD} 100%)` }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 pt-8 pb-4">
            {/* Back / Stop button — clearly visible */}
            <button onClick={resetToSetup}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors">
              <i className="fas fa-arrow-left text-white text-sm" />
              <span className="text-white text-xs font-bold">Stop</span>
            </button>
            {/* Volume */}
            <div className="flex items-center gap-2">
              <i className="fas fa-volume-down text-white/60 text-xs" />
              <input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={e => setVolume(+e.target.value)}
                className="w-20 h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'white' }} />
              <i className="fas fa-volume-up text-white/60 text-xs" />
            </div>
          </div>

          {/* Center — concentric circles + timer */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
            {/* Concentric breathing circles */}
            <div className="relative flex items-center justify-center">
              {/* Outer decorative ring */}
              <motion.div
                animate={{ scale: isPaused ? 1 : breathScale * 1.6, opacity: isPaused ? 0.1 : 0.15 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                className="absolute rounded-full"
                style={{ width: 320, height: 320, background: 'white' }}
              />
              {/* Middle ring */}
              <motion.div
                animate={{ scale: isPaused ? 1 : breathScale * 1.3, opacity: isPaused ? 0.15 : 0.2 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                className="absolute rounded-full"
                style={{ width: 260, height: 260, background: 'white' }}
              />
              {/* Timer ring SVG */}
              <div style={{ width: 200, height: 200, position: 'relative' }}>
                <TimerRing pct={timerPct} size={200} stroke={6} />
                {/* Inner orb */}
                <motion.div
                  animate={{ scale: isPaused ? 1 : breathScale }}
                  transition={{ duration: 0.9, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full flex flex-col items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
                >
                  <div className="text-4xl font-black text-white">{timeStr}</div>
                  <div className="text-xs text-white/70 font-semibold mt-1 uppercase tracking-widest">
                    {isPaused ? 'Paused' : breathPhase.label}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Decorative sparkles (like reference) */}
            {[
              { top: '15%', left: '10%', size: 16, delay: 0 },
              { top: '20%', right: '12%', size: 12, delay: 0.5 },
              { top: '70%', left: '8%',  size: 10, delay: 1 },
              { top: '65%', right: '10%', size: 14, delay: 1.5 },
            ].map((s, i) => (
              <motion.div key={i}
                className="absolute text-white/30"
                style={{ top: s.top, left: (s as any).left, right: (s as any).right, fontSize: s.size }}
                animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: s.delay }}>
                ✦
              </motion.div>
            ))}

            {/* Calming prompt */}
            <AnimatePresence mode="wait">
              <motion.div key={promptIdx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.7 }}
                className="text-center">
                <p className="text-3xl font-black text-white mb-2">{PROMPTS[promptIdx]}</p>
                <p className="text-white/50 text-sm font-medium">
                  {track.title} · {timerMins} min session
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom controls */}
          <div className="flex flex-col items-center gap-4 px-6 pb-12">
            {/* Breath phase dots */}
            {!isPaused && (
              <div className="flex items-center gap-3">
                {BREATH_CYCLE.map((b, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <motion.div
                      className="rounded-full"
                      style={{ background: 'white' }}
                      animate={{ width: i === breathIdx ? 28 : 8, height: 8, opacity: i === breathIdx ? 1 : 0.3 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="text-[9px] font-bold text-white/50 uppercase">{b.label.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pause / Resume button — large rounded square like reference */}
            <div className="flex items-center gap-4">
              <motion.button onClick={pauseResume}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
                <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'} text-2xl`} style={{ color: M }} />
              </motion.button>

              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/15">
                {audioError
                  ? <button onClick={() => {
                      setAudioError(false);
                      if (audioRef.current) {
                        const p = audioRef.current.play();
                        if (p !== undefined) p.catch(() => setAudioError(true));
                      }
                    }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors"
                    title="Tap to enable audio">
                      <i className="fas fa-volume-mute text-white text-sm" />
                    </button>
                  : <i className="fas fa-music text-white/60 text-sm" />
                }
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════
          POST-SESSION ANALYTICS
          (matches reference: Time Log calendar,
           streak stats, week-by-week bars)
      ══════════════════════════════════════════ */}
      {step === 'done' && (
        <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">

          {/* Session complete hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-8 text-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${M}, ${MD})`, boxShadow: `0 16px 48px rgba(139,30,45,0.4)` }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
              style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
            <motion.div
              animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: 2, duration: 0.5 }}
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-white/20">
              <i className="fas fa-check text-3xl text-white" />
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-1">Session Complete!</h2>
            <p className="text-white/70 text-sm mb-6">
              You completed a {timerMins}-minute meditation with {track.title}
            </p>
            <div className="flex justify-center gap-6">
              {[
                { label: 'Duration', value: `${timerMins} min` },
                { label: 'Track',    value: track.title },
                { label: 'Streak',   value: `${streak.filter(Boolean).length} days` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-xl font-black text-white">{s.value}</div>
                  <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* What you've accomplished — stat rows */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-black text-gray-800 text-lg mb-1">What You've Accomplished</h3>
            <p className="text-xs text-gray-400 mb-5 uppercase tracking-wide font-semibold">Your meditation stats</p>
            <div className="space-y-4">
              {[
                { icon: 'fa-trophy',      label: 'Total Perfect Days',  value: 15, color: '#f59e0b' },
                { icon: 'fa-fire',        label: 'Your Current Streak', value: streak.filter(Boolean).length, color: M },
                { icon: 'fa-check-circle', label: 'Sessions Complete',  value: 76, color: '#10b981' },
                { icon: 'fa-star',        label: 'Best Streak',         value: 17, color: '#8b5cf6' },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07 }}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.color}18` }}>
                      <i className={`fas ${s.icon} text-sm`} style={{ color: s.color }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{s.label}</span>
                  </div>
                  <span className="text-lg font-black" style={{ color: M }}>{s.value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Weekly streak — horizontal dots */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-gray-800">Weekly Streak</h3>
                <p className="text-xs text-gray-400">{streak.filter(Boolean).length} of 7 days this week</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: M }} /> All done
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full border-2 inline-block" style={{ borderColor: M }} /> Some done
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {DAYS.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: streak[i] ? M : '#f3f4f6',
                      border: i === 6 ? `2px solid ${M}` : '2px solid transparent',
                    }}>
                    {streak[i] && <i className="fas fa-check text-white" style={{ fontSize: 9 }} />}
                  </motion.div>
                  <span className="text-[10px] font-bold text-gray-400">{d}</span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
              <motion.div className="h-full rounded-full" style={{ background: M }}
                initial={{ width: 0 }}
                animate={{ width: `${(streak.filter(Boolean).length / 7) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }} />
            </div>
          </motion.div>

          {/* Monthly heatmap calendar — like "Time Log" reference */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-gray-800">Time Log</h3>
                <p className="text-xs font-bold" style={{ color: M }}>
                  <i className="fas fa-chevron-left mr-1 text-[10px]" />
                  May — Perfect {heatmap.flat().filter(Boolean).length} days
                </p>
              </div>
              <button className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors">
                <i className="fas fa-arrow-left text-xs text-gray-500" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-400">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="space-y-1">
              {heatmap.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((active, di) => {
                    const isToday = wi === 4 && di === 4;
                    return (
                      <motion.div key={di}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (wi * 7 + di) * 0.012 }}
                        className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110"
                        style={{
                          background: isToday ? M : active ? `${M}cc` : '#f3f4f6',
                          color: active || isToday ? '#fff' : '#9ca3af',
                          boxShadow: isToday ? `0 4px 12px rgba(139,30,45,0.4)` : 'none',
                        }}>
                        {wi * 7 + di + 1 <= 31 ? wi * 7 + di + 1 : ''}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: M }} /> All done
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-sm border-2 inline-block" style={{ borderColor: M }} /> Some done
              </span>
            </div>
          </motion.div>

          {/* Week-by-week bar chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-black text-gray-800 mb-1">Week by Week</h3>
            <p className="text-xs text-gray-400 mb-5 uppercase tracking-wide font-semibold">Last week</p>
            <div className="flex items-end justify-between gap-2 h-24">
              {[74, 43, 94, 24, 36, 83, 68].map((pct, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold" style={{ color: pct > 70 ? M : '#9ca3af' }}>{pct}%</span>
                  <motion.div
                    className="w-full rounded-t-lg"
                    style={{ background: pct > 70 ? M : '#e5e7eb' }}
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.07, ease: 'easeOut' }}
                  />
                  <span className="text-[9px] font-bold text-gray-400">{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex gap-4 pb-4">
            <button onClick={resetToSetup}
              className="flex-1 py-4 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: M, color: M }}>
              <i className="fas fa-redo mr-2" /> Meditate Again
            </button>
            <button onClick={onBack}
              className="flex-1 py-4 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90"
              style={{ background: M, boxShadow: `0 6px 20px rgba(139,30,45,0.35)` }}>
              <i className="fas fa-home mr-2" /> Back to Dashboard
            </button>
          </motion.div>

        </main>
      )}

    </div>
  );
};

export default MeditationView;
