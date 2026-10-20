
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { API_CONFIG } from '../config/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'doctor';
  time: string;
}

interface Props {
  onBack: () => void;
}

const QueryChatbox: React.FC<Props> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I am Caremend AI, your bone health assistant. Please feel free to drop your health-related queries here.", sender: 'doctor', time: '10:00 AM' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      // Get user profile for personalized responses
      const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('caremend_user');
      let userProfile: any = {};
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        try {
          const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/api/profile/${user.id}`);
          const profileData = await profileResponse.json();
          
          if (profileResponse.ok && profileData.hasCompletedAssessment && profileData.latestAssessment) {
            userProfile = {
              risk_level: profileData.latestAssessment.risk_level,
              risk_percentage: profileData.latestAssessment.risk_percentage,
              age: profileData.latestAssessment.age,
              gender: profileData.latestAssessment.gender,
              risk_factors: profileData.latestAssessment.risk_factors || []
            };
          }
        } catch (profileError) {
          console.warn('Could not fetch user profile:', profileError);
        }
      }

      try {
        // Use CareMend backend API instead of Google Gemini
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentInput,
            context: {
              user_profile: userProfile,
              health_data: userProfile
            }
          }),
        });

        const data = await response.json();

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response || "I'm having trouble processing that query. Please try again.",
          sender: 'doctor',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (apiError) {
        // Fallback: Generate mock AI response when backend is unavailable
        console.log('⚠️ Backend unavailable, generating mock AI response');
        const mockResponse = generateMockAIResponse(currentInput);
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: mockResponse,
          sender: 'doctor',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble processing that. Let me try that differently...",
        sender: 'doctor',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateMockAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Mock responses for common bone health questions
    const responses: Record<string, string> = {
      // Exercise-related
      'exercise': 'Great question! For bone health, I recommend:\n\n• **Weight-bearing exercises**: Walking, jogging, or dancing (30 minutes, 3-4 times/week)\n• **Resistance training**: Helps strengthen bones and muscles\n• **Balance exercises**: Tai Chi or yoga to prevent falls\n\nAvoid high-impact activities if you have low bone density. Start slowly and consult your doctor.',
      'yoga': 'Yoga can be excellent for bone health! It improves:\n\n• **Balance and coordination**: Reduces fall risk\n• **Muscle strength**: Especially in the core and legs\n• **Flexibility**: Helps maintain mobility\n\nFocus on weight-bearing poses like standing poses and warrior poses. Avoid forward bends if you have osteoporosis.',
      'walking': 'Walking is wonderful for bone health! It is a weight-bearing exercise that:\n\n• **Strengthens leg and hip bones**\n• **Improves balance**: Reduces fall risk\n• **Low impact**: Easier on joints\n\nAim for 30-45 minutes, 5 days a week at a brisk pace.',
      
      // Nutrition-related
      'calcium': 'Calcium is essential for bone health! Recommended intake:\n\n• **Adults 19-50**: 1000 mg/day\n• **Women 51+**: 1200 mg/day\n• **Men 51+**: 1000 mg/day (1200 mg after 70)\n\n**Good sources**:\n- Dairy: Milk, yogurt, cheese\n- Plants: Leafy greens, broccoli, tofu\n- Fortified foods: Plant-based milk, orange juice\n\nTake supplements if diet alone is insufficient.',
      'vitamin d': 'Vitamin D helps your body absorb calcium. Recommended intake:\n\n• **Adults 19-70**: 600-800 IU/day\n• **Adults 70+**: 800 IU/day\n\n**Ways to get vitamin D**:\n- Sunlight: 10-30 minutes in midday sun, 3-4 times/week\n- Foods: Fatty fish (salmon, mackerel), egg yolks, fortified milk\n- Supplements: Vitamin D3 (cholecalciferol) is most effective\n\nGet your levels tested regularly.',
      
      // Risk factors
      'smoking': 'Smoking significantly increases osteoporosis risk because it:\n\n• **Reduces calcium absorption**\n• **Damages bone-forming cells**\n• **Increases bone loss rate**\n• **Interferes with estrogen**\n\nQuit smoking to improve bone health! Even after quitting, your bones will start recovering. Ask your doctor about cessation programs.',
      'alcohol': 'Excessive alcohol weakens bones by:\n\n• **Interfering with calcium absorption**\n• **Damaging bone-forming cells**\n• **Increasing fall risk through balance issues**\n\n**Safe limits**:\n- Women: ≤1 drink/day\n- Men: ≤2 drinks/day\n\nModerate drinking (especially red wine) may have some bone benefits.',
      
      // General topics
      'osteoporosis': 'Osteoporosis is a condition where bones become weak and brittle. Key facts:\n\n• **Often called "silent disease"** - no symptoms until a fracture\n• **More common in women after menopause**\n• **Preventable and manageable** with lifestyle changes and medication\n\n**Prevention strategies**:\n- Get enough calcium and vitamin D\n- Exercise regularly (weight-bearing and resistance)\n- Don't smoke or limit alcohol\n- Avoid excessive caffeine\n- Regular bone density screening\n\nTalk to your doctor about your risk level.',
      'fracture': 'If you have a fracture history, your bone strength needs special attention:\n\n• **Increased risk of future fractures**\n• **May indicate underlying bone weakness**\n• **Requires stronger prevention measures**\n\n**What to do**:\n- Get a DEXA scan to check bone density\n- Ensure adequate calcium and vitamin D intake\n- Do weight-bearing and balance exercises\n- Consider medication if high risk\n- Prevent falls: Remove home hazards, use proper footwear\n\nConsult an endocrinologist or rheumatologist.',
      'menopause': 'Menopause significantly affects bone health:\n\n• **Estrogen drop accelerates bone loss**\n• **Peak bone loss occurs 5-7 years after menopause**\n• **Women can lose 20% of bone mass post-menopause**\n\n**Prevention strategies**:\n- Increase calcium and vitamin D intake\n- Exercise 4-5 days/week (weight-bearing and resistance)\n- Consider hormone replacement therapy (HRT) - discuss with doctor\n- Regular bone density screening\n\nEarly intervention is key!',
      
      // General health
      'bone health': 'Bone health is crucial at any age! Key components:\n\n• **Nutrition**: Calcium, vitamin D, protein\n• **Exercise**: Weight-bearing and resistance training\n• **Lifestyle**: No smoking, limited alcohol, adequate sleep\n• **Screening**: Regular checks if high risk\n\n**Your bone health score depends on**:\n- Age and gender\n- Family history\n- Lifestyle factors\n- Medical conditions\n- Medications\n\nTake action now to prevent problems later!'
    };
    
    // Find the best matching response
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerQuestion.includes(keyword)) {
        return response;
      }
    }
    
    // Generic response if no keyword matches
    return `That's a great question about bone health! Here are some general recommendations:\n\n• **Build strong bones**: Get enough calcium (1000-1200 mg/day) and vitamin D (600-800 IU/day)\n• **Stay active**: Do 30+ minutes of weight-bearing exercise most days\n• **Eat well**: Include protein, fruits, and vegetables in your diet\n• **Avoid risk factors**: Don't smoke, limit alcohol, and maintain a healthy weight\n• **Get screened**: If you're at risk, get a DEXA scan to check bone density\n\nFor more personalized advice based on your assessment results, please consult with a healthcare provider. Is there anything specific about your bone health you'd like to know more about?`;
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-white relative">
      {/* Header */}
      <div className="w-full flex items-center py-6 px-2 border-b border-neutral-100 sticky top-0 bg-white z-[50]">
        <button onClick={onBack} className="text-2xl text-[#a32626] mr-4">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="w-10 h-10 bg-[#fdf2f2] rounded-xl flex items-center justify-center text-[#a32626] mr-3">
          <i className="fas fa-robot"></i>
        </div>
        <div>
          <h3 className="text-[#a32626] font-black text-lg uppercase tracking-tight">Caremend AI</h3>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Bone Health Specialist</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full scrollbar-hide">
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-32 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[85%] md:max-w-[70%] p-4 rounded-[1.5rem] shadow-sm relative ${
                  msg.sender === 'user' 
                    ? 'bg-[#a32626] text-white rounded-tr-none' 
                    : 'bg-neutral-50 text-neutral-600 border border-neutral-100 rounded-tl-none'
                }`}
              >
                <div className="markdown-body text-sm leading-relaxed font-bold">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                <span className={`text-[8px] font-black uppercase mt-1 block opacity-60 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start">
              <div className="bg-neutral-50 p-4 rounded-[1.5rem] rounded-tl-none border border-neutral-100 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl z-[100]">
        <div className="bg-white rounded-full flex items-center px-6 py-3 shadow-[0_15px_40px_rgba(163,38,38,0.25)] border border-[#a32626]/10">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about bone health..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-neutral-600 font-bold text-base px-2"
            disabled={isTyping}
          />

          <div className="flex items-center space-x-2 ml-2">
             <button 
               onClick={() => handleSend()}
               disabled={isTyping || !inputText.trim()}
               className={`w-12 h-12 ${isTyping || !inputText.trim() ? 'bg-neutral-200' : 'bg-[#a32626]'} text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all ml-1`}
             >
               <i className="fas fa-paper-plane text-lg"></i>
             </button>
          </div>
          
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" />
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .markdown-body p { margin-bottom: 0.5rem; }
        .markdown-body p:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
};

export default QueryChatbox;




