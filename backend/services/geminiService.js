/**
 * services/geminiService.js — Google Gemini AI Integration for CareConnect
 * ========================================================================
 * Real conversational AI system using proper chat sessions
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with proper error handling
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log("Initializing Gemini AI...");
console.log("API Key present:", GEMINI_API_KEY ? "Yes" : "No");
console.log("API Key length:", GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);

// Validate API key is present
if (!GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in environment variables!");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `You are CareConnect, an AI-assisted healthcare educator specializing in bone health and osteoporosis prevention.

CONVERSATION STYLE:
- Respond naturally and conversationally like ChatGPT
- Remember previous messages and build on them
- Understand follow-up questions in context
- Use "you" to address the user directly
- Keep responses friendly, warm, and human-like
- Answer the user's actual question first and directly

PERSONALIZATION RULES:
- Use profile data ONLY when relevant to the specific question
- Do NOT always mention risk scores or fracture risk
- Do NOT repeat profile summaries unless directly asked
- If question is general, answer generally
- If profile helps personalize, do so gently and naturally

RESPONSE BEHAVIOR:
- Answer the actual question being asked
- Avoid robotic or template-based language
- Keep responses practical and medically educational
- Provide actionable advice when appropriate
- Ask clarifying questions when helpful
- Remember conversation context and refer to previous messages

SAFETY BOUNDARIES:
- You are NOT a diagnostic system
- Do not prescribe medications or diagnose diseases
- Keep responses educational and supportive
- Direct users to healthcare providers for medical decisions
- Always maintain professional healthcare educator role

CONVERSATION MEMORY:
- Remember what was discussed previously
- Build on previous responses naturally
- Understand follow-up questions in context
- Maintain conversation flow like a real assistant

Example good responses:
Q: "Can I drink coffee daily?"
A: "Moderate coffee intake is usually fine for bone health. Around 1-2 cups daily is generally considered safe for most adults. Since caffeine can slightly affect calcium absorption, maintaining good calcium intake is important."

Q: "What about tea instead?"
A: "Tea is actually a great alternative! Most teas contain less caffeine than coffee, and some like green tea contain beneficial compounds. Herbal teas are caffeine-free options if you want to avoid caffeine altogether."`
});

/**
 * Generate conversational AI response using proper chat sessions
 * @param {Object} userProfile - User's health profile and assessment data
 * @param {string} userQuestion - User's current question
 * @param {Array} conversationHistory - Previous conversation in Gemini format
 * @returns {Promise<string>} - AI generated response
 */
export async function generateCareConnectResponse(userProfile, userQuestion, conversationHistory = []) {
    try {
        console.log("=== GEMINI REQUEST DEBUG ===");
        console.log("Incoming Question:", userQuestion);
        console.log("User Profile:", userProfile ? "Present" : "None");
        console.log("Conversation History Length:", conversationHistory.length);
        
        // Safe profile handling
        const safeProfile = userProfile || {};
        
        // Check if API key is available
        if (!GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY not available, using fallback system");
            const fallback = generateIntelligentFallback(userQuestion, safeProfile, conversationHistory);
            return {
                answer: fallback,
                source: 'fallback',
                reason: 'GEMINI_API_KEY_MISSING'
            };
        }
        
        // Try Gemini API first
        try {
            // Convert conversation history to Gemini format
            const geminiHistory = formatHistoryForGemini(conversationHistory);
            console.log("Gemini History Format:", geminiHistory);
            
            // Start chat session with history for proper conversation continuity
            const chat = model.startChat({
                history: geminiHistory,
            });
            
            // Add user profile context only when relevant to the question
            const contextualQuestion = addProfileContext(userQuestion, safeProfile);
            console.log("Contextual Question:", contextualQuestion);
            
            // Send message and get response using chat session
            console.log("Sending message to Gemini...");
            const result = await chat.sendMessage(contextualQuestion);
            
            // Check if response is valid
            if (!result.response || !result.response.text()) {
                console.warn("Gemini returned empty response, using fallback");
                const fallback = generateIntelligentFallback(userQuestion, safeProfile, conversationHistory);
                return {
                    answer: fallback,
                    source: 'fallback',
                    reason: 'GEMINI_EMPTY_RESPONSE'
                };
            }
            
            const response = result.response.text();
            console.log("Gemini Raw Response:", response.substring(0, 200));
            
            // Apply safety filters
            const safeResponse = applySafetyFilters(response);
            console.log("Final Safe Response:", safeResponse.substring(0, 200));
            
            // Return successful Gemini response with source tracking
            return {
                answer: safeResponse,
                source: 'gemini',
                model: 'gemini-1.5-flash'
            };
            
        } catch (geminiError) {
            console.error("Gemini API failed:", geminiError.message);
            console.error("Error details:", {
                name: geminiError.name,
                message: geminiError.message,
                status: geminiError.status
            });
            
            // Check if it's a quota error (429) - this is expected during peak usage
            let fallbackReason = 'GEMINI_API_ERROR';
            if (geminiError.status === 429 || geminiError.message.includes('quota')) {
                console.warn("⚠️  API quota exceeded - using intelligent fallback system");
                fallbackReason = 'GEMINI_QUOTA_EXCEEDED';
            } else {
                console.warn("Gemini API error - using intelligent fallback system");
            }
            
            // Use intelligent fallback system for specific prompts
            const fallback = generateIntelligentFallback(userQuestion, safeProfile, conversationHistory);
            return {
                answer: fallback,
                source: 'fallback',
                reason: fallbackReason,
                geminiError: geminiError.message
            };
        }
        
    } catch (error) {
        console.error('=== FULL GEMINI ERROR ===');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('========================');
        const fallback = getFallbackResponse();
        return {
            answer: fallback,
            source: 'fallback',
            reason: 'CRITICAL_ERROR',
            error: error.message
        };
    }
}

/**
 * Generate intelligent fallback responses when Gemini API is not available
 * This also acts as a safety net for specific prompts that need exact answers
 */
function generateIntelligentFallback(question, userProfile, conversationHistory) {
    const questionLower = question.toLowerCase().trim();
    
    console.log("Generating intelligent fallback for:", questionLower.substring(0, 100));
    
    // Get conversation context
    let lastUserMessage = '';
    let lastAssistantMessage = '';
    
    if (conversationHistory && conversationHistory.length > 0) {
        // Find the last user and assistant messages
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
            const msg = conversationHistory[i];
            const content = msg.content || (msg.parts && msg.parts[0] && msg.parts[0].text) || '';
            const isAssistant = msg.role === 'assistant' || msg.role === 'model';
            
            if (isAssistant && !lastAssistantMessage) {
                lastAssistantMessage = content.toLowerCase();
            } else if (!isAssistant && !lastUserMessage) {
                lastUserMessage = content.toLowerCase();
            }
            
            if (lastUserMessage && lastAssistantMessage) break;
        }
    }
    
    console.log("Last user message:", lastUserMessage.substring(0, 50));
    console.log("Last assistant message:", lastAssistantMessage.substring(0, 50));
    
    // ─── FOLLOW-UP QUESTIONS (Contextual Based on Previous Discussion) ────────────────
    
    // Running follow-up after walking/exercise discussion
    if ((questionLower.includes('run') || questionLower.includes('running')) &&
        (lastUserMessage.includes('walk') || lastAssistantMessage.includes('walk') || 
         lastUserMessage.includes('exercise') || lastAssistantMessage.includes('exercise'))) {
        console.log("Detected: Running follow-up after walking discussion");
        return "Running is also great for bone health as it provides even more impact than walking. The higher impact of running provides stronger bone-loading stimulation. However, if you're just starting out or have joint concerns, it's best to build up gradually from walking first. Start with short runs and increase distance slowly. Make sure you have proper running shoes with good support.";
    }
    
    // Tea follow-up after coffee/caffeine discussion
    if ((questionLower.includes('tea') || questionLower.includes('herbal')) &&
        (lastUserMessage.includes('coffee') || lastAssistantMessage.includes('coffee') || 
         lastUserMessage.includes('caffeine') || lastAssistantMessage.includes('caffeine'))) {
        console.log("Detected: Tea follow-up after coffee discussion");
        return "Tea is actually a great alternative! Most teas contain less caffeine than coffee, and green tea in particular contains beneficial polyphenol compounds that support bone health. Herbal teas are caffeine-free options like chamomile, rooibos, or ginger tea if you want to avoid caffeine altogether. Many people find they can enjoy more tea throughout the day compared to coffee.";
    }
    
    // Yoga follow-up after exercise discussion
    if ((questionLower.includes('yoga') || questionLower.includes('pilates')) &&
        (lastUserMessage.includes('exercise') || lastAssistantMessage.includes('exercise') || 
         lastUserMessage.includes('activity') || lastAssistantMessage.includes('activity'))) {
        console.log("Detected: Yoga follow-up after exercise discussion");
        return "Yoga and Pilates can be beneficial for bone health, particularly poses that involve weight-bearing and balance. These practices are excellent for core strength and stability. However, avoid extreme spinal flexion (deep forward bends) if you have osteoporosis, as this can increase fracture risk. Focus on gentle, supported poses and modify as needed.";
    }
    
    // Strength training follow-up after exercise discussion
    if ((questionLower.includes('strength') || questionLower.includes('weight') || questionLower.includes('resistance')) &&
        (lastUserMessage.includes('exercise') || lastAssistantMessage.includes('exercise') || 
         lastUserMessage.includes('activity') || lastAssistantMessage.includes('activity'))) {
        console.log("Detected: Strength training follow-up after exercise discussion");
        return "Resistance training and strength exercises are excellent for bone health! They work the muscles that pull on bones, stimulating bone formation. You can use resistance bands, light weights, or even your body weight. Aim for 2-3 sessions per week, allowing rest days between. Start light and focus on proper form rather than heavy weights.";
    }
    
    // Calcium follow-up after nutrition discussion
    if ((questionLower.includes('calcium') || questionLower.includes('dairy')) &&
        (lastUserMessage.includes('calcium') || lastAssistantMessage.includes('calcium') || 
         lastUserMessage.includes('food') || lastUserMessage.includes('diet') ||
         lastUserMessage.includes('nutrition') || lastAssistantMessage.includes('nutrition'))) {
        console.log("Detected: Calcium follow-up after nutrition discussion");
        return "Calcium is really crucial! You need about 1,000-1,200mg daily depending on age and gender. Good sources include: dairy (milk, yogurt, cheese - 300mg per serving), leafy greens (collard greens, kale), fortified plant-based milks, canned fish with bones, and almonds. It's best to spread calcium intake throughout the day for better absorption.";
    }
    
    // ─── SPECIFIC PROMPT HANDLING (Initial Questions with Specific Topics) ──────────────
    
    // Walking/Exercise questions - Initial query
    if (questionLower.includes('walk') || questionLower.includes('walking')) {
        console.log("Detected: Walking question");
        let response = "Yes, walking is excellent for bone health! It's a weight-bearing exercise that helps stimulate bone formation and maintain density. Aim for at least 30 minutes on most days of the week for optimal benefits. Brisk walking (where you can talk but not sing) is more beneficial than leisurely strolling.";
        
        if (userProfile && userProfile.risk_level) {
            const riskLevel = userProfile.risk_level.toUpperCase();
            if (riskLevel === 'HIGH') {
                response += "\n\nGiven your higher fracture risk, start gradually with 10-15 minutes and build up. Wear supportive footwear and walk on even surfaces to reduce fall risk. Walking remains excellent for your bone health while being safe.";
            } else if (riskLevel === 'LOW') {
                response += "\n\nWith your lower fracture risk, you can be more adventurous with walking routines. Adding hills, inclines, or slightly faster pace can provide additional bone-loading benefits.";
            } else if (riskLevel === 'MEDIUM') {
                response += "\n\nAt your moderate risk level, steady walking is a great foundation. You can gradually add variations like hills or faster paces as you build endurance.";
            }
        }
        
        return response;
    }
    
    // Running questions
    if (questionLower.includes('run') || questionLower.includes('running')) {
        console.log("Detected: Running question");
        let response = "Running is excellent for bone health as it's a high-impact, weight-bearing exercise that provides more bone-loading benefits than walking. It helps maintain and even increase bone density. However, start gradually if you're new to running, and ensure proper running shoes with good support. Build up distance and intensity slowly over weeks.";
        
        if (userProfile && userProfile.risk_level) {
            const riskLevel = userProfile.risk_level.toUpperCase();
            if (riskLevel === 'HIGH') {
                response += "\n\nGiven your higher fracture risk, check with your healthcare provider first. If cleared, start with walk-run intervals: alternate between walking and short running bursts. This allows your bones and joints to adapt gradually.";
            }
        }
        
        return response;
    }
    
    // Coffee questions
    if (questionLower.includes('coffee') || (questionLower.includes('caffeine') && !questionLower.includes('limit'))) {
        console.log("Detected: Coffee question");
        let response = "Moderate coffee intake is usually fine for bone health. Around 1-2 cups daily is generally considered safe for most adults. Caffeine can slightly reduce calcium absorption, but not significantly if you maintain good overall calcium intake (1,000-1,200mg daily).";
        
        if (userProfile && userProfile.calcium_intake === 'low') {
            response += "\n\nSince your assessment showed lower calcium intake, ensuring adequate calcium from food or supplements becomes even more important if you regularly drink coffee.";
        }
        
        return response;
    }
    
    // Tea questions
    if (questionLower.includes('tea')) {
        console.log("Detected: Tea question");
        let response = "Tea is generally very good for bone health! Most teas contain less caffeine than coffee, and green tea in particular contains beneficial compounds. Herbal teas like chamomile, ginger, or rooibos are caffeine-free alternatives that provide antioxidants and other health benefits.";
        
        if (userProfile && userProfile.calcium_intake === 'low') {
            response += "\n\nHerbal teas can be enjoyed throughout the day without affecting calcium absorption like caffeine does, making them an excellent choice for you.";
        }
        
        return response;
    }
    
    // Calcium questions
    if (questionLower.includes('calcium') && !questionLower.includes('low')) {
        console.log("Detected: Calcium question");
        if (questionLower.includes('how much') || questionLower.includes('need')) {
            return "Adults typically need 1,000-1,200mg of calcium daily for optimal bone health (may be slightly different by age). Good sources include: dairy products (300mg per serving), leafy greens like collard greens and kale, fortified plant-based milks, canned fish with bones, nuts, and seeds. It's best to spread calcium intake throughout the day for better absorption.";
        } else if (questionLower.includes('low') || questionLower.includes('increase')) {
            return "To increase calcium intake, include more dairy products, leafy greens, fortified foods, and canned fish with bones in your diet. A typical day might include: milk with breakfast (300mg), a yogurt snack (250mg), greens in lunch (100mg), and cheese in dinner (200mg). If you can't get enough from food, calcium supplements are an option to discuss with your healthcare provider.";
        } else {
            return "Calcium is essential for bone strength and density. Your body needs adequate calcium throughout life to build and maintain strong bones. Dairy products, leafy greens, almonds, fortified foods, and canned fish with bones are excellent sources.";
        }
    }
    
    // Exercise questions
    if (questionLower.includes('exercise') || questionLower.includes('activity') || questionLower.includes('physical')) {
        console.log("Detected: Exercise question");
        let response = "Weight-bearing and resistance exercises are most effective for bone health. Weight-bearing includes walking, jogging, dancing, and stair climbing. Resistance exercises use weights, bands, or body weight. Balance exercises like standing on one foot or heel-to-toe walking also help reduce fall risk. Aim for at least 150 minutes of moderate activity per week.";
        
        if (userProfile && userProfile.physical_activity === 'sedentary') {
            response += "\n\nSince your assessment showed lower current activity levels, start gradually with 10-15 minutes of walking daily and gradually increase. Any movement is better than none, and consistent activity matters more than intensity.";
        }
        
        return response;
    }
    
    // Yoga questions
    if (questionLower.includes('yoga')) {
        console.log("Detected: Yoga question");
        let response = "Yoga can be beneficial for bone health, particularly poses that involve weight-bearing and balance. Poses like tree pose, warrior pose, and downward dog build strength and balance. However, avoid extreme spinal flexion (deep forward bends) if you have osteoporosis, as this can increase fracture risk. Focus on gentle, supported poses.";
        
        if (userProfile && userProfile.risk_level === 'HIGH') {
            response += "\n\nGiven your higher fracture risk, consider chair yoga or wall-supported poses, and work with an instructor familiar with osteoporosis modifications.";
        }
        
        return response;
    }
    
    // Vitamin D questions
    if (questionLower.includes('vitamin d') || questionLower.includes('sun exposure')) {
        console.log("Detected: Vitamin D question");
        return "Vitamin D is crucial for calcium absorption and bone health. Adults need 600-800 IU daily (some experts recommend up to 1000-2000 IU). Sources include: sunlight exposure (10-30 minutes most days), fatty fish like salmon, egg yolks, fortified milk, and supplements. Many people have insufficient vitamin D, especially in winter or northern climates.";
    }
    
    // Diet/nutrition questions
    if (questionLower.includes('diet') || questionLower.includes('nutrition') || questionLower.includes('food')) {
        console.log("Detected: Diet/nutrition question");
        return "A bone-healthy diet includes: adequate calcium (1,000-1,200mg daily), vitamin D (600-800 IU), protein, magnesium, and vitamin K. Focus on: dairy products or alternatives, leafy greens, fish, nuts and seeds, and whole grains. Limit excessive salt, caffeine, and alcohol as these can interfere with bone health.";
    }
    
    // Risk/fracture questions
    if ((questionLower.includes('risk') || questionLower.includes('fracture')) && userProfile && userProfile.risk_level) {
        console.log("Detected: Risk/fracture question");
        const riskLevel = userProfile.risk_level.toUpperCase();
        const riskPercentage = userProfile.risk_percentage || 'your assessment';
        
        let response = `Based on your assessment, you have a ${riskLevel.toLowerCase()} fracture risk (${riskPercentage}). `;
        
        if (riskLevel === 'LOW') {
            response += "This means you have a relatively low probability of experiencing a fracture in the next 10 years. Continue with preventive measures like regular exercise and adequate nutrition to maintain this status.";
        } else if (riskLevel === 'MEDIUM') {
            response += "This indicates a moderate fracture risk. Focus on bone-strengthening activities, ensure adequate calcium and vitamin D, exercise regularly, and discuss prevention strategies with your healthcare provider.";
        } else if (riskLevel === 'HIGH') {
            response += "This indicates an elevated fracture risk. It's important to work closely with your healthcare provider on prevention strategies, which may include lifestyle modifications, fall prevention, and possibly medication.";
        }
        
        return response;
    }
    
    // General bone health questions
    if (questionLower.includes('bone') || questionLower.includes('osteoporosis') || questionLower.includes('bone health') || questionLower.includes('bone loss')) {
        console.log("Detected: General bone health question");
        return "Bone health depends on several factors: adequate nutrition (calcium and vitamin D), regular weight-bearing and strength training exercise, avoiding smoking and limiting alcohol, maintaining a healthy weight, and ensuring hormonal balance. Early prevention and consistent habits are key to maintaining strong bones throughout life.";
    }
    
    // Fall prevention
    if (questionLower.includes('fall') || questionLower.includes('prevent falling')) {
        console.log("Detected: Fall prevention question");
        return "Fall prevention is important for bone health. Steps include: improving balance with exercises, ensuring good lighting in your home, removing tripping hazards, wearing proper footwear, checking vision and hearing regularly, being careful with medications that cause dizziness, and maintaining muscle strength through exercise.";
    }
    
    // Default comprehensive response
    console.log("Using default comprehensive response for:", questionLower.substring(0, 50));
    return "For comprehensive bone health guidance, focus on: regular weight-bearing exercise (at least 150 minutes per week), adequate calcium intake (1,000-1,200mg daily), sufficient vitamin D, strength training twice weekly, and maintaining a healthy lifestyle. For specific medical questions, please consult with your healthcare provider.";
}

/**
 * Convert conversation history to Gemini chat format
 */
function formatHistoryForGemini(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
        return [];
    }
    
    try {
        return conversationHistory.map(message => {
            // Handle both formats: {role, content} and {role, parts}
            const isModelRole = message.role === 'model' || message.role === 'assistant';
            const text = message.content || (message.parts && message.parts[0] && message.parts[0].text) || '';
            
            return {
                role: isModelRole ? 'model' : 'user',
                parts: [{ text: text }]
            };
        }).filter(msg => msg.parts[0].text); // Filter out empty messages
    } catch (error) {
        console.error("Error formatting history:", error);
        return [];
    }
}

/**
 * Add profile context only when relevant to the question
 */
function addProfileContext(question, userProfile) {
    if (!userProfile || Object.keys(userProfile).length === 0) return question;
    
    const questionLower = question.toLowerCase();
    let contextualQuestion = question;
    
    // Only add profile context if it's directly relevant to the specific question
    const needsRiskContext = questionLower.includes('my risk') || questionLower.includes('my fracture') || questionLower.includes('my assessment');
    const needsActivityContext = questionLower.includes('my exercise') || questionLower.includes('my activity') || questionLower.includes('can i');
    const needsNutritionContext = questionLower.includes('my calcium') || questionLower.includes('my vitamin') || questionLower.includes('my diet');
    const needsAgeContext = questionLower.includes('my age') || questionLower.includes('at my age');
    
    // Build minimal, relevant context
    let contextParts = [];
    
    if (needsRiskContext && userProfile.risk_level) {
        contextParts.push(`User has ${userProfile.risk_level.toLowerCase()} fracture risk`);
    }
    
    if (needsActivityContext && userProfile.physical_activity) {
        contextParts.push(`Currently ${userProfile.physical_activity} activity level`);
    }
    
    if (needsNutritionContext) {
        if (userProfile.calcium_intake) contextParts.push(`Calcium intake: ${userProfile.calcium_intake}`);
        if (userProfile.vitamin_d_intake) contextParts.push(`Vitamin D: ${userProfile.vitamin_d_intake}`);
    }
    
    if (needsAgeContext && userProfile.age) {
        contextParts.push(`Age: ${userProfile.age}`);
    }
    
    // Only add context if it's relevant
    if (contextParts.length > 0) {
        contextualQuestion += `\n\n[Context: ${contextParts.join(', ')}]`;
    }
    
    return contextualQuestion;
}

/**
 * Apply safety filters to AI responses
 */
function applySafetyFilters(response) {
    // Remove any potential medical diagnoses or prescriptions
    const dangerousPatterns = [
        /you have [a-z\s]*(disease|condition|disorder)/gi,
        /i diagnose/gi,
        /take [0-9]+ mg/gi,
        /prescribe/gi,
        /you need medication/gi
    ];
    
    let safeResponse = response;
    
    dangerousPatterns.forEach(pattern => {
        if (pattern.test(safeResponse)) {
            safeResponse = "I can provide educational information about bone health, but specific medical advice should come from your healthcare provider. " + safeResponse.replace(pattern, '');
        }
    });
    
    // Ensure educational disclaimer for medical-adjacent content
    if (safeResponse.includes('symptom') || safeResponse.includes('pain') || safeResponse.includes('medication')) {
        if (!safeResponse.includes('healthcare provider')) {
            safeResponse += "\n\nFor specific medical concerns, please consult with your healthcare provider.";
        }
    }
    
    return safeResponse.trim();
}

/**
 * Fallback response for API failures
 */
function getFallbackResponse() {
    const fallbacks = [
        "I'm having trouble connecting right now. Could you try asking your question again?",
        "Sorry, I'm experiencing some technical difficulties. Please try again in a moment.",
        "I'm unable to generate a response at the moment. You might want to submit your question directly to a healthcare professional.",
        "My connection seems unstable right now. Please try rephrasing your question or ask again shortly."
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Get suggested prompt chips based on common bone health questions
 */
export function getSuggestedPrompts() {
    return [
        "Can I drink coffee daily?",
        "Is walking good for my bones?", 
        "What exercises help bone strength?",
        "How much calcium do I need?",
        "Is yoga safe for me?",
        "What causes bone loss?",
        "Which foods strengthen bones?",
        "How can I prevent falls?",
        "Should I take supplements?",
        "What about strength training?"
    ];
}

// Test function to list available models
export async function listGeminiModels() {
    try {
        console.log("Listing available Gemini models...");
        const models = await genAI.listModels();
        console.log("Available models:", models);
        return models;
    } catch (error) {
        console.error("Failed to list models:", error);
        throw error;
    }
}

// Test function to verify Gemini API works without history
export async function testGeminiBasic() {
    try {
        console.log("Testing basic Gemini API call...");
        
        // Try with valid model names
        const modelNames = [
            "gemini-pro",
            "gemini-1.5-pro", 
            "gemini-1.0-pro",
            "models/gemini-pro",
            "models/gemini-1.5-pro"
        ];
        
        for (const modelName of modelNames) {
            try {
                console.log(`Trying model: ${modelName}`);
                const testModel = genAI.getGenerativeModel({ model: modelName });
                const result = await testModel.generateContent("Can walking improve bone health?");
                const response = result.response.text();
                console.log(`SUCCESS with ${modelName}:`, response);
                return response;
            } catch (error) {
                console.error(`Failed with ${modelName}:`, error.message);
            }
        }
        
        throw new Error("All model tests failed");
        
    } catch (error) {
        console.error("Basic Gemini Test Failed:", error);
        throw error;
    }
}