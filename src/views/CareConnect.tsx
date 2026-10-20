import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, MessageCircle, Clock, CheckCircle, AlertCircle, User, Stethoscope, Brain, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_CONFIG } from '../config/api';
import { Doctor } from '../types';

interface CareConnectProps {
  onBack: () => void;
  onBookDoctor?: (doc: Doctor) => void;
}

interface Query {
  id: number;
  userId: number;
  question: string;
  category: string;
  aiResponse?: string;
  status: string;
  doctorReply?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  createdAt: string;
  aiRepliedAt?: string;
  repliedAt?: string;
  submittedToDoctor: boolean;
}

const CareConnect: React.FC<CareConnectProps> = ({ onBack }) => {
  const [question, setQuestion] = useState('');
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null);

  // Suggested prompts
  const suggestedPrompts = [
    "Can I drink coffee daily?",
    "Is walking good for my bones?",
    "Which exercises strengthen bones?",
    "How much calcium do I need?",
    "Is yoga safe for osteoporosis?",
    "What causes bone loss?"
  ];

  // Check user authentication
  const checkUserAuth = () => {
    const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('caremend_user');
    console.log('🔍 [CareConnect] Checking authentication...');
    console.log('🔍 [CareConnect] storedUser exists:', !!storedUser);
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('🔍 [CareConnect] Parsed user:', user);
        console.log('🔍 [CareConnect] User ID:', user.id);
        
        if (user.id) {
          setCurrentUserId(user.id);
          return user.id;
        } else {
          console.error('❌ [CareConnect] User object missing ID');
          return null;
        }
      } catch (e) {
        console.error('❌ [CareConnect] Error parsing user data:', e);
        return null;
      }
    }
    console.error('❌ [CareConnect] No user found in localStorage');
    return null;
  };

  useEffect(() => {
    const userId = checkUserAuth();
    if (!userId) {
      console.warn('⚠️ [CareConnect] User not authenticated');
    } else {
      console.log('✅ [CareConnect] User authenticated with ID:', userId);
      loadUserQueries();
    }
  }, []);

  const loadUserQueries = async () => {
    try {
      const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('caremend_user');
      if (!storedUser) {
        console.warn('⚠️ [CareConnect] No user found, skipping query load');
        return;
      }

      const user = JSON.parse(storedUser);
      console.log('🔍 [CareConnect] Loading queries for user:', user.id);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/careconnect/queries/${user.id}`);
      const data = await response.json();

      console.log('🔍 [CareConnect] Query response:', data);

      if (response.ok && data.success) {
        console.log('✅ [CareConnect] Loaded', data.queries.length, 'queries');
        setQueries(data.queries);
      } else {
        console.error('❌ [CareConnect] Failed to load queries:', data.error);
      }
    } catch (error) {
      console.error('❌ [CareConnect] Error loading queries:', error);
    }
  };

  const submitToDoctor = async () => {
    if (!question.trim()) {
      console.warn('⚠️ [CareConnect] Empty question for doctor submission');
      return;
    }

    const userId = currentUserId || checkUserAuth();
    console.log('🔍 [CareConnect] submitToDoctor - userId:', userId);
    
    if (!userId) {
      console.error('❌ [CareConnect] No user ID found');
      alert('Please log in to submit queries');
      return;
    }

    try {
      setLoading(true);

      console.log('🔍 [CareConnect] Submitting to doctor:', question);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/careconnect/submit-to-doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          question: question.trim()
        })
      });

      const data = await response.json();
      console.log('🔍 [CareConnect] Doctor submission response:', data);

      if (response.ok && data.success) {
        console.log('✅ [CareConnect] Query submitted to doctor');
        setSubmitSuccess(true);
        setQuestion('');
        setSelectedQueryId(null);

        setTimeout(async () => {
          await loadUserQueries();
          setSubmitSuccess(false);
        }, 2000);
      } else {
        console.error('❌ [CareConnect] Error:', data.error);
        alert(data.error || 'Failed to submit query');
      }
    } catch (error) {
      console.error('❌ [CareConnect] Network error:', error);
      alert('Failed to submit query. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    console.log('🔍 [CareConnect] Selected prompt:', prompt);
    setQuestion(prompt);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ai_replied': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_doctor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'doctor_replied': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ai_replied': return <Brain className="h-4 w-4" />;
      case 'pending_doctor': return <Clock className="h-4 w-4" />;
      case 'doctor_replied': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                <h1 className="text-xl font-semibold text-gray-900">CareConnect</h1>
                <p className="text-sm text-gray-500">AI guidance and healthcare provider connectivity</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <Stethoscope className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Query submitted successfully! A healthcare professional will respond soon.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Queries Tab - Always Visible */}
        <div className="space-y-6">
          {queries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No queries yet</h3>
              <p className="text-gray-600 mb-6">
                Submit your first healthcare question to get personalized guidance and doctor feedback.
              </p>

              {/* Submit to Doctor Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 max-w-md mx-auto">
                <Stethoscope className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-green-900 mb-3">Submit Your Question</h4>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask your healthcare question here..."
                  className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none mb-4"
                  rows={3}
                  disabled={loading}
                />
                <button
                  onClick={submitToDoctor}
                  disabled={!question.trim() || loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {loading ? 'Submitting...' : 'Submit to Doctor'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Submit to Doctor Section at Top */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <Stethoscope className="h-6 w-6 text-green-600 mr-2" />
                  <h4 className="text-lg font-semibold text-green-900">Submit New Question</h4>
                </div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      submitToDoctor();
                    }
                  }}
                  placeholder="Ask your healthcare question here..."
                  className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none mb-4"
                  rows={3}
                  disabled={loading}
                />
                <button
                  onClick={submitToDoctor}
                  disabled={!question.trim() || loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit to Doctor'}
                </button>
              </div>

              {/* Query List */}
              <div className="space-y-4 mt-8">
                <h3 className="text-lg font-semibold text-gray-900">Your Query History</h3>
                {queries.map((query) => (
                  <div key={query.id} className="bg-white rounded-lg shadow-lg p-6">
                    {/* Query Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(query.status)} flex items-center`}>
                            {getStatusIcon(query.status)}
                            <span className="ml-1 capitalize">{query.status.replace('_', ' ')}</span>
                          </span>
                          {query.category && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {query.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Asked on {formatDate(query.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Question:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{query.question}</p>
                    </div>

                    {/* AI Response - Removed: No longer showing AI responses */}

                    {/* Doctor Reply */}
                    {query.doctorReply && (
                      <div className="border-t pt-4">
                        <div className="flex items-center mb-3">
                          <Stethoscope className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <h4 className="font-medium text-green-900">
                              {query.doctorName || 'Healthcare Professional'}
                            </h4>
                            <p className="text-sm text-green-700">
                              {query.doctorSpecialty || 'General Medicine'}
                            </p>
                          </div>
                          {query.repliedAt && (
                            <span className="ml-auto text-xs text-gray-500">
                              {formatDate(query.repliedAt)}
                            </span>
                          )}
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-800">{query.doctorReply}</p>
                        </div>
                      </div>
                    )}

                    {/* Pending Status */}
                    {query.status === 'pending_doctor' && !query.doctorReply && (
                      <div className="border-t pt-4">
                        <div className="flex items-center text-yellow-700">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            Your query is being reviewed. Expected response time: 24-48 hours.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareConnect;
