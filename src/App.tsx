
import React, { useState, useEffect } from 'react';
import { HealthData, Doctor } from './types';
import SplashScreen from './SplashScreen';
import RiskIntro from './views/RiskIntro';
import RiskAssessment from './views/RiskAssessment';
import RiskResult from './views/RiskResult';
import Dashboard from './views/Dashboard';
import DocDiseaseSelect from './views/DocDiseaseSelect';
import DocList from './views/DocList';
import DocDetail from './views/DocDetail';
import DocCalendar from './views/DocCalendar';
import CommunitySelect from './views/CommunitySelect';
import CommunityForum from './views/CommunityForum';
import SelfcareTools from './views/SelfcareTools';
import MeditationView from './views/MeditationView';
import HighlyRecommendedView from './views/HighlyRecommendedView';
import NutritionPlanView from './views/NutritionPlanView';
import WalkingTracker from './views/WalkingTracker';
import HomePage from './views/HomePage';
import AboutPage from './views/AboutPage';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import PersonalizedExerciseCoach from './views/PersonalizedExerciseCoach';
import CareConnect from './views/CareConnect';

type AppStage =
  | 'SPLASH'
  | 'RISK_INTRO'
  | 'RISK_ASSESSMENT'
  | 'RISK_RESULT'
  | 'DASHBOARD'
  | 'HOME'
  | 'ABOUT'
  | 'DOC_CONNECT_DISEASE'
  | 'DOC_CONNECT_LIST'
  | 'DOC_CONNECT_DETAIL'
  | 'DOC_CONNECT_CALENDAR'
  | 'COMMUNITY_SELECT'
  | 'COMMUNITY_FORUM'
  | 'SELFCARE_TOOLS'
  | 'MEDITATION'
  | 'HIGHLY_RECOMMENDED'
  | 'NUTRITION_PLAN'
  | 'WALKING'
  | 'EXERCISE_COACH'
  | 'CARECONNECT'
  | 'CARECONNECT_BOOKING'
  | 'CONTACT';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>('SPLASH');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [riskCategory, setRiskCategory] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [selectedDisease, setSelectedDisease] = useState<'Osteoporosis' | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Doctor | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<'Osteoporosis' | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    console.log('App initializing - clearing temporary assessment data');
    localStorage.removeItem('assessmentData');
    localStorage.removeItem('riskCategory');
  }, []);

  useEffect(() => {
    if (stage !== 'SPLASH') return;

    const timer = setTimeout(() => {
      let user = localStorage.getItem('caremend_user');

      if (!user) {
        const demoUser = {
          id: Math.floor(Math.random() * 1000000) + 1,
          full_name: 'Guest User',
          email: `guest_${Date.now()}@caremend.local`,
          username: `guest_${Date.now()}`,
        };

        localStorage.setItem('caremend_user', JSON.stringify(demoUser));
        localStorage.setItem('caremend_token', 'demo-token-' + Date.now());
      }

      setStage('HOME');
    }, 4000);

    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [stage]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans text-[#333] overflow-x-hidden bg-white">
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            className="fixed top-10 left-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl z-[500] font-bold text-center max-w-[90vw]"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            className="fixed top-10 left-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl z-[500] font-bold text-center max-w-[90vw]"
          >
            <i className="fas fa-bell mr-2"></i>
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex-1 flex flex-col relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            {stage === 'SPLASH' && <SplashScreen />}

            {stage === 'HOME' && (
              <HomePage
                onStartAssessment={() => setStage('RISK_INTRO')}
                onGoToDashboard={() => setStage('DASHBOARD')}
                onAbout={() => setStage('ABOUT')}
                onLogin={() => setStage('RISK_INTRO')}
              />
            )}

            {stage === 'ABOUT' && (
              <AboutPage
                onBack={() => setStage('HOME')}
                onStartAssessment={() => setStage('RISK_INTRO')}
                onHome={() => setStage('HOME')}
              />
            )}

            {stage === 'RISK_INTRO' && (
              <RiskIntro onProceed={() => setStage('RISK_ASSESSMENT')} />
            )}

            {stage === 'RISK_ASSESSMENT' && (
              <RiskAssessment
                onShowError={showError}
                onComplete={(data) => {
                  setHealthData(data);
                  setStage('RISK_RESULT');
                }}
              />
            )}

            {stage === 'RISK_RESULT' && (
              <div>
                {healthData ? (
                  <ErrorBoundary>
                    <RiskResult
                      data={healthData}
                      onRetake={() => setStage('RISK_ASSESSMENT')}
                      onProceed={(cat) => {
                        setRiskCategory(cat);
                        setStage('DASHBOARD');
                      }}
                    />
                  </ErrorBoundary>
                ) : (
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        No Health Data
                      </h2>
                      <p className="text-gray-600">
                        Health data is missing. Please complete the assessment again.
                      </p>
                      <button
                        onClick={() => setStage('RISK_ASSESSMENT')}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Retake Assessment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {stage === 'DASHBOARD' && (
              <Dashboard
                onSelectDoctor={() => setStage('DOC_CONNECT_DISEASE')}
                onSelectCommunity={() => setStage('COMMUNITY_SELECT')}
                onSelectSelfcare={() => setStage('SELFCARE_TOOLS')}
                onSelectCareConnect={() => setStage('CARECONNECT')}
                onSelectNutrition={() => setStage('NUTRITION_PLAN')}
                onNavigateToProfile={() => setStage('DASHBOARD')}
                onNavigateToHome={() => setStage('HOME')}
                onNavigateToAbout={() => setStage('ABOUT')}
                onNavigateToContact={() => setStage('CONTACT')}
                userHealthData={healthData}
              />
            )}

            {stage === 'DOC_CONNECT_DISEASE' && (
              <DocDiseaseSelect
                onBack={() => setStage('DASHBOARD')}
                onSelect={(d) => {
                  setSelectedDisease(d);
                  setStage('DOC_CONNECT_LIST');
                }}
              />
            )}

            {stage === 'DOC_CONNECT_LIST' && selectedDisease && (
              <DocList
                disease={selectedDisease}
                onBack={() => setStage('DOC_CONNECT_DISEASE')}
                onSelectDoc={(doc) => {
                  setSelectedDoc(doc);
                  setStage('DOC_CONNECT_DETAIL');
                }}
              />
            )}

            {stage === 'DOC_CONNECT_DETAIL' && selectedDoc && (
              <DocDetail
                doc={selectedDoc}
                onBack={() => setStage('DOC_CONNECT_LIST')}
                onBook={() => setStage('DOC_CONNECT_CALENDAR')}
              />
            )}

            {stage === 'DOC_CONNECT_CALENDAR' && selectedDoc && (
              <DocCalendar
                onBack={() => setStage('DOC_CONNECT_DETAIL')}
                onConfirmed={() => {
                  setStage('DASHBOARD');
                  showNotification(
                    'Your appointment has been booked successfully. Be in time to visit the doctor.'
                  );
                }}
              />
            )}

            {stage === 'COMMUNITY_SELECT' && (
              <CommunitySelect
                onBack={() => setStage('DASHBOARD')}
                onSelect={(c) => {
                  setSelectedCommunity(c);
                  setStage('COMMUNITY_FORUM');
                }}
              />
            )}

            {stage === 'COMMUNITY_FORUM' && selectedCommunity && (
              <CommunityForum
                disease={selectedCommunity}
                onBack={() => setStage('COMMUNITY_SELECT')}
              />
            )}

            {stage === 'SELFCARE_TOOLS' && (
              <SelfcareTools
                onBack={() => setStage('DASHBOARD')}
                onSelectCategory={(cat) => setStage(cat as AppStage)}
              />
            )}

            {stage === 'MEDITATION' && (
              <MeditationView
                riskCategory={riskCategory}
                onBack={() => setStage('SELFCARE_TOOLS')}
              />
            )}

            {stage === 'WALKING' && (
              <ErrorBoundary>
                <WalkingTracker
                  riskCategory={riskCategory}
                  onBack={() => setStage('SELFCARE_TOOLS')}
                />
              </ErrorBoundary>
            )}

            {stage === 'EXERCISE_COACH' && (
              <PersonalizedExerciseCoach
                healthData={healthData}
                riskCategory={riskCategory}
                onBack={() => setStage('SELFCARE_TOOLS')}
              />
            )}

            {stage === 'CARECONNECT' && (
              <CareConnect
                onBack={() => setStage('DASHBOARD')}
                onBookDoctor={(doc) => {
                  setSelectedDoc(doc);
                  setStage('CARECONNECT_BOOKING');
                }}
              />
            )}

            {stage === 'CARECONNECT_BOOKING' && selectedDoc && (
              <DocDetail
                doc={selectedDoc}
                onBack={() => setStage('CARECONNECT')}
                onBook={() => setStage('DOC_CONNECT_CALENDAR')}
              />
            )}

            {stage === 'HIGHLY_RECOMMENDED' && (
              <HighlyRecommendedView
                riskCategory={riskCategory}
                onBack={() => setStage('SELFCARE_TOOLS')}
              />
            )}

            {stage === 'NUTRITION_PLAN' && (
              <NutritionPlanView
                healthData={healthData}
                riskCategory={riskCategory}
                onBack={() => setStage('DASHBOARD')}
              />
            )}

            {stage === 'CONTACT' && (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Coming Soon</h1>
                  <p className="text-gray-600 mb-6">
                    Contact page is under development
                  </p>
                  <button
                    onClick={() => setStage('DASHBOARD')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Go Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
