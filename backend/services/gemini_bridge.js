#!/usr/bin/env node
/**
 * gemini_bridge.js — Bridge between Python Flask and Node.js Gemini service
 * =========================================================================
 * Handles Gemini API calls from Python backend
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { generateCareConnectResponse, getSuggestedPrompts, testGeminiBasic, listGeminiModels } from './geminiService.js';

async function main() {
    try {
        console.log("=== GEMINI BRIDGE STARTED ===");
        
        // Pre-flight validation
        if (!process.env.GEMINI_API_KEY) {
            console.error("ERROR: GEMINI_API_KEY is not set in environment variables!");
            console.error("Falling back to template-based responses for this session.");
            const errorResponse = {
                answer: "AI service is not properly configured. Using fallback system.",
                suggestedPrompts: [
                    "Can I drink coffee daily?",
                    "Is walking good for my bones?",
                    "Which exercises strengthen bones?",
                    "How much calcium do I need?",
                    "Is yoga safe for me?",
                    "What causes bone loss?"
                ],
                error: "GEMINI_API_KEY_MISSING",
                source: "fallback"  // Track that this is a fallback response
            };
            console.log(JSON.stringify(errorResponse));
            process.exit(0);
        }
        
        // Read input from stdin (from Python)
        let input = '';
        process.stdin.setEncoding('utf8');
        
        for await (const chunk of process.stdin) {
            input += chunk;
        }
        
        console.log("Raw input received (length: " + input.length + " bytes)");
        
        const data = JSON.parse(input);
        const { userProfile, userQuestion, conversationHistory } = data;
        
        console.log("Parsed data:");
        console.log("- userQuestion:", userQuestion);
        console.log("- userProfile keys:", userProfile ? Object.keys(userProfile) : "none");
        console.log("- conversationHistory length:", conversationHistory ? conversationHistory.length : 0);
        
        // Generate AI response using Gemini
        console.log("Calling generateCareConnectResponse...");
        const result = await generateCareConnectResponse(
            userProfile, 
            userQuestion, 
            conversationHistory
        );
        
        // Handle both string responses (backward compat) and object responses (new format)
        const answer = typeof result === 'string' ? result : result.answer;
        const source = typeof result === 'string' ? 'unknown' : (result.source || 'gemini');
        
        // Get suggested prompts
        const suggestedPrompts = getSuggestedPrompts();
        
        // Return response to Python with source tracking
        const response = {
            answer: answer,
            suggestedPrompts: suggestedPrompts.slice(0, 6), // Limit to 6 suggestions
            source: source  // Include response source for debugging
        };
        
        console.log("Final response generated (length: " + JSON.stringify(response).length + " bytes, source: " + source + ")");
        process.stdout.write(JSON.stringify(response) + '\n', () => {
            setTimeout(() => {
                process.exit(0);
            }, 200);
        });
        
    } catch (error) {
        console.error('=== GEMINI BRIDGE ERROR ===');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('===========================');
        
        const fallbackResponse = {
            answer: "I'm having trouble generating a response right now. Please try asking your question again, or consider submitting it directly to a healthcare professional.",
            suggestedPrompts: [
                "Can I drink coffee daily?",
                "Is walking good for my bones?",
                "Which exercises strengthen bones?",
                "How much calcium do I need?",
                "Is yoga safe for me?",
                "What causes bone loss?"
            ],
            error: error.message,
            source: "fallback"  // Track that this is a fallback response
        };
        
        process.stdout.write(JSON.stringify(fallbackResponse) + '\n', () => {
            setTimeout(() => {
                process.exit(0);
            }, 200);
        });
    }
}

main();