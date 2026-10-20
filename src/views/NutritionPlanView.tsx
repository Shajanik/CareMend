import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import NutritionAssistant from '../components/NutritionAssistant';
import CustomButton from '../components/CustomButton';
import { API_CONFIG } from '../config/api';

interface UserProfile {
  risk_level: string;
  risk_percentage: number;
  age: number;
  gender: string;
  calcium_intake?: string;
  vitamin_d_intake?: string;
  physical_activity?: string;
  body_weight?: string;
}

interface NutritionPlanViewProps {
  onBack?: () => void;
  onGoToAssessment?: () => void;
  healthData?: any;
  riskCategory?: 'LOW' | 'MEDIUM' | 'HIGH';
}

const NutritionPlanView: React.FC<NutritionPlanViewProps> = ({ 
  onBack, 
  onGoToAssessment,
  healthData,
  riskCategory
}) => {
  const navigate = null; // Remove useNavigate since we're using callback props
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If healthData is passed as prop, use it directly
    if (healthData && riskCategory) {
      console.log('✅ Using healthData from props:', healthData);
      const hd = healthData;
      setUserProfile({
        risk_level: hd.riskLevel || riskCategory || 'MEDIUM',
        risk_percentage: 0  /* model score is not a percentage */,
        age: parseInt(hd.age) || 50,
        gender: hd.gender || 'female',
        calcium_intake: hd.calciumLevel?.toLowerCase() === 'adequate' ? 'adequate' : 'low',
        vitamin_d_intake: hd.vitaminDLevel?.toLowerCase() === 'adequate' ? 'sufficient' : 'low',
        physical_activity: hd.activityLevel || 'moderate',
        body_weight: hd.weight ? 'normal' : 'normal'
      });
      setLoading(false);
      return;
    }

    // Try to get user data from localStorage or session
    const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('caremend_user');
    
    console.log('🔍 [NutritionPlan] Checking user authentication...');
    console.log('🔍 [NutritionPlan] storedUser exists:', !!storedUser);
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('🔍 [NutritionPlan] Parsed user:', user);
        console.log('🔍 [NutritionPlan] User ID:', user.id);
        
        if (user.id) {
          setUserId(user.id);
          // Check assessment status via API or fallback
          checkAssessmentStatus(user.id, user);
        } else {
          console.error('❌ [NutritionPlan] User object missing ID');
          setError('User authentication error. Please log in again.');
          setLoading(false);
        }
      } catch (e) {
        console.error('❌ [NutritionPlan] Error parsing stored user:', e);
        setError('User authentication error. Please log in again.');
        setLoading(false);
      }
    } else {
      console.error('❌ [NutritionPlan] No user found in localStorage');
      setError('Please log in to access your nutrition plan.');
      setLoading(false);
    }
  }, [healthData, riskCategory]);

  const checkAssessmentStatus = async (userId: number, user: any) => {
    let profileLoaded = false;
    try {
      console.log('🔍 [NutritionPlan] Checking assessment status for user:', userId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [NutritionPlan] API response:', data);
        
        if (data && data.hasCompletedAssessment && data.latestAssessment) {
          // User has completed assessment - use the data
          console.log('✅ [NutritionPlan] Assessment found:', data.latestAssessment);
          
          const assessment = data.latestAssessment;
          setUserProfile({
            risk_level: assessment.risk_level || 'MEDIUM',
            risk_percentage: assessment.risk_percentage ?? 0,
            age: assessment.age || 50,
            gender: assessment.gender || 'female',
            calcium_intake: assessment.calcium_intake || 'adequate',
            vitamin_d_intake: assessment.vitamin_d_intake || 'sufficient',
            physical_activity: assessment.physical_activity || 'moderate',
            body_weight: assessment.body_weight || 'normal'
          });
          profileLoaded = true;
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('❌ [NutritionPlan] Error checking assessment status:', err);
    }

    if (!profileLoaded) {
      // Local fallback
      console.log('🔍 [NutritionPlan] Attempting local fallback...');
      if (user && user.assessmentCompleted && user.healthData) {
        const hd = user.healthData;
        setUserProfile({
          risk_level: hd.riskLevel || user.riskCategory || 'MEDIUM',
          risk_percentage: 0  /* model score is not a percentage */,
          age: parseInt(hd.age) || 50,
          gender: hd.gender || 'female',
          calcium_intake: hd.calciumLevel?.toLowerCase() === 'adequate' ? 'adequate' : 'low',
          vitamin_d_intake: hd.vitaminDLevel?.toLowerCase() === 'adequate' ? 'sufficient' : 'low',
          physical_activity: hd.activityLevel || 'moderate',
          body_weight: hd.weight ? 'normal' : 'normal'
        });
        setLoading(false);
      } else {
        console.warn('⚠️ [NutritionPlan] No local assessment fallback found');
        setError('Please complete your clinical assessment first to get a personalized nutrition plan.');
        setLoading(false);
      }
    }
  };



  const handleGoToAssessment = () => {
    if (onGoToAssessment) {
      onGoToAssessment();
    }
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your nutrition plan...</p>
        </div>
      </div>
    );
  }

  if (error || (!userProfile && !loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🥗</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Nutrition Plan Not Available
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Failed to load your assessment data.'}
          </p>
          <div className="space-y-3">
            {onGoToAssessment && (
              <CustomButton
                label="COMPLETE ASSESSMENT"
                onClick={handleGoToAssessment}
                className="w-full"
              />
            )}
            <button
              onClick={handleGoBack}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
            >
              GO BACK
            </button>
          </div>
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
                onClick={handleGoBack}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                AI Nutrition Assistant
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Personalized for your bone health
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <NutritionAssistant 
          userProfile={userProfile || undefined}
          userId={userId || undefined}
        />
      </div>


    </div>
  );
};

export default NutritionPlanView;