import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

interface MealOption {
  vegetarian: string;
  non_vegetarian: string;
}

interface DayMeals {
  breakfast: MealOption;
  lunch: MealOption;
  dinner: MealOption;
  snacks: MealOption;
}

interface WeeklyPlan {
  user_summary: {
    risk_level: string;
    risk_percentage: number;
    calcium_target: string;
    focus: string;
  };
  days: Record<string, DayMeals>;
  tips: {
    daily_tips: string[];
    regenerate_note: string;
  };
}

interface NutritionAssistantProps {
  userProfile?: UserProfile;
  userId?: number;
}

const NutritionAssistant: React.FC<NutritionAssistantProps> = ({ userProfile, userId }) => {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<string>('MONDAY');
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({
    breakfast: true,
    lunch: false,
    dinner: false,
    snacks: false
  });
  const [dietaryPreference, setDietaryPreference] = useState<'vegetarian' | 'non_vegetarian' | 'both'>('both');

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];

  const generateWeeklyPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/nutrition/weekly-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          user_profile: userProfile
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate nutrition plan');
      }

      setWeeklyPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile || userId) {
      generateWeeklyPlan();
    }
  }, [userProfile, userId]);

  const toggleMealExpansion = (meal: string) => {
    setExpandedMeals(prev => ({
      ...prev,
      [meal]: !prev[meal]
    }));
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toUpperCase()) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMealIcon = (meal: string) => {
    switch (meal) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌙';
      case 'snacks': return '🍎';
      default: return '🍽️';
    }
  };

  const renderMealOption = (option: string, type: 'vegetarian' | 'non_vegetarian') => {
    const shouldShow = dietaryPreference === 'both' || dietaryPreference === type;
    if (!shouldShow) return null;

    const icon = type === 'vegetarian' ? '🥦' : '🍗';
    const label = type === 'vegetarian' ? 'Vegetarian' : 'Non-Vegetarian';
    
    return (
      <div className={`p-3 rounded-lg border ${type === 'vegetarian' ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-sm text-gray-700">{label}</span>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed">{option}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Generating your personalized nutrition plan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-red-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={generateWeeklyPlan}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!weeklyPlan) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">No nutrition plan available.</p>
        <button
          onClick={generateWeeklyPlan}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Generate Plan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🥗 Your Personalized Weekly Nutrition Plan
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${getRiskLevelColor(weeklyPlan.user_summary.risk_level)}`}>
            <h3 className="font-semibold mb-2">Your Risk Level</h3>
            <p className="text-lg font-bold">
              {weeklyPlan.user_summary.risk_level}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-50 text-blue-800">
            <h3 className="font-semibold mb-2">Calcium Target</h3>
            <p className="text-lg font-bold">{weeklyPlan.user_summary.calcium_target}</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Focus Area</h3>
          <p className="text-gray-700">{weeklyPlan.user_summary.focus}</p>
        </div>
      </div>

      {/* Dietary Preference Toggle */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-3">Dietary Preference</h3>
        <div className="flex gap-2">
          {(['both', 'vegetarian', 'non_vegetarian'] as const).map((pref) => (
            <button
              key={pref}
              onClick={() => setDietaryPreference(pref)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dietaryPreference === pref
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {pref === 'both' ? 'Both' : pref === 'vegetarian' ? '🥦 Vegetarian' : '🍗 Non-Vegetarian'}
            </button>
          ))}
        </div>
      </div>

      {/* Day Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Days">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeDay === day
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </button>
            ))}
          </nav>
        </div>

        {/* Day Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {activeDay.charAt(0) + activeDay.slice(1).toLowerCase()} Meal Plan
          </h3>

          <div className="space-y-4">
            {meals.map((meal) => (
              <div key={meal} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleMealExpansion(meal)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMealIcon(meal)}</span>
                    <span className="font-semibold text-gray-900 capitalize">{meal}</span>
                  </div>
                  {expandedMeals[meal] ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {expandedMeals[meal] && (
                  <div className="px-4 pb-4 space-y-3">
                    {renderMealOption(
                      weeklyPlan.days[activeDay][meal as keyof DayMeals].vegetarian,
                      'vegetarian'
                    )}
                    {renderMealOption(
                      weeklyPlan.days[activeDay][meal as keyof DayMeals].non_vegetarian,
                      'non_vegetarian'
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Daily Tips</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {weeklyPlan.tips.daily_tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-600 font-bold text-sm">•</span>
              <p className="text-sm text-blue-800" dangerouslySetInnerHTML={{ __html: tip }} />
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{weeklyPlan.tips.regenerate_note}</p>
          <button
            onClick={generateWeeklyPlan}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Regenerate Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default NutritionAssistant;