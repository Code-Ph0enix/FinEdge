/**
 * FinEdge AI Chat History API Client
 * 
 * Handles chat history persistence in MongoDB for AI Advisor
 * 
 * @module utils/chatApi
 * @version 1.0.0 - FIXED
 */

import axios from 'axios';
import { Message } from '../types'; // ✅ FIXED - Import from types

// Server URL configuration
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// ✅ REMOVED duplicate Message interface (using imported one)

// TypeScript interfaces for API responses
interface ChatHistoryResponse {
  success: boolean;
  messages?: Message[];
  lastUpdated?: string;
  messageCount?: number;
  error?: string;
}

interface SaveResponse {
  success: boolean;
  message?: string;
  messageCount?: number;
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  message?: string;
  deletedCount?: number;
  error?: string;
}

/**
 * ✅ Fetch AI Advisor chat history from MongoDB
 * 
 * @param clerkUserId - User's Clerk ID
 * @returns Array of messages or empty array
 */
export const fetchAIChatHistory = async (clerkUserId: string): Promise<Message[]> => {
  try {
    console.log('📥 Fetching AI chat history from MongoDB...');
    
    const response = await axios.get<ChatHistoryResponse>(
      `${SERVER_URL}/api/chat/ai-advisor/history`,
      { 
        params: { clerkUserId },
        timeout: 10000 // 10 second timeout
      }
    );
    
    if (response.data.success && response.data.messages) {
      console.log(`✅ Loaded ${response.data.messages.length} messages from MongoDB`);
      return response.data.messages;
    }
    
    console.log('ℹ️ No previous chat history found');
    return [];
    
  } catch (error: any) {
    console.error('❌ Error fetching AI chat history:', error.message);
    
    // Return empty array on error (graceful degradation)
    return [];
  }
};

/**
 * ✅ Save AI Advisor chat history to MongoDB
 * 
 * @param clerkUserId - User's Clerk ID
 * @param messages - Array of chat messages
 * @returns Success boolean
 */
export const saveAIChatHistory = async (
  clerkUserId: string,
  messages: Message[]
): Promise<boolean> => {
  try {
    console.log(`💾 Saving ${messages.length} messages to MongoDB...`);
    
    const response = await axios.post<SaveResponse>(
      `${SERVER_URL}/api/chat/ai-advisor/history`,
      { 
        clerkUserId, 
        messages 
      },
      { timeout: 10000 }
    );
    
    if (response.data.success) {
      console.log(`✅ Successfully saved ${response.data.messageCount} messages to MongoDB`);
      return true;
    }
    
    console.error('❌ Failed to save chat history:', response.data.error);
    return false;
    
  } catch (error: any) {
    console.error('❌ Error saving AI chat history:', error.message);
    return false;
  }
};

/**
 * ✅ Clear AI Advisor chat history from MongoDB
 * 
 * @param clerkUserId - User's Clerk ID
 * @returns Success boolean
 */
export const clearAIChatHistory = async (clerkUserId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Clearing AI chat history from MongoDB...');
    
    const response = await axios.delete<DeleteResponse>(
      `${SERVER_URL}/api/chat/ai-advisor/history`,
      { 
        params: { clerkUserId },
        timeout: 10000
      }
    );
    
    if (response.data.success) {
      console.log(`✅ Cleared chat history (${response.data.deletedCount} document(s))`);
      return true;
    }
    
    console.error('❌ Failed to clear chat history:', response.data.error);
    return false;
    
  } catch (error: any) {
    console.error('❌ Error clearing AI chat history:', error.message);
    return false;
  }
};

// ===========================================================================================================
//                           FINANCIAL PATH HISTORY FUNCTIONS
// ===========================================================================================================

/**
 * ✅ Fetch last Financial Path result from MongoDB
 * 
 * @param clerkUserId - User's Clerk ID
 * @returns Financial path data or null
 */
export const fetchFinancialPathHistory = async (clerkUserId: string): Promise<any> => {
  try {
    console.log('📥 Fetching Financial Path history from MongoDB...');
    
    const response = await axios.get(
      `${SERVER_URL}/api/financial-path/history`,
      { 
        params: { clerkUserId },
        timeout: 10000
      }
    );
    
    if (response.data.success && response.data.data) {
      console.log('✅ Loaded Financial Path result from MongoDB');
      return response.data.data;
    }
    
    console.log('ℹ️ No previous Financial Path history found');
    return null;
    
  } catch (error: any) {
    console.error('❌ Error fetching Financial Path history:', error.message);
    return null;
  }
};

/**
 * ✅ Save Financial Path result to MongoDB
 * 
 * @param clerkUserId - User's Clerk ID
 * @param data - Financial path data (riskProfile, userQuery, serverData, fetchedUserData)
 * @returns Success boolean
 */
export const saveFinancialPathHistory = async (
  clerkUserId: string,
  data: {
    riskProfile: string;
    userQuery: string;
    serverData: any;
    fetchedUserData: any;
  }
): Promise<boolean> => {
  try {
    console.log('💾 Saving Financial Path result to MongoDB...');
    
    const response = await axios.post(
      `${SERVER_URL}/api/financial-path/history`,
      { 
        clerkUserId,
        ...data
      },
      { timeout: 10000 }
    );
    
    if (response.data.success) {
      console.log('✅ Successfully saved Financial Path result to MongoDB');
      return true;
    }
    
    console.error('❌ Failed to save Financial Path result:', response.data.error);
    return false;
    
  } catch (error: any) {
    console.error('❌ Error saving Financial Path result:', error.message);
    return false;
  }
};

/**
 * ✅ Clear Financial Path history from MongoDB
 * 
 * @param clerkUserId - User's Clerk ID
 * @returns Success boolean
 */
export const clearFinancialPathHistory = async (clerkUserId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Clearing Financial Path history from MongoDB...');
    
    const response = await axios.delete(
      `${SERVER_URL}/api/financial-path/history`,
      { 
        params: { clerkUserId },
        timeout: 10000
      }
    );
    
    if (response.data.success) {
      console.log(`✅ Cleared Financial Path history (${response.data.deletedCount} result(s))`);
      return true;
    }
    
    console.error('❌ Failed to clear Financial Path history:', response.data.error);
    return false;
    
  } catch (error: any) {
    console.error('❌ Error clearing Financial Path history:', error.message);
    return false;
  }
};

// --- IGNORE ---