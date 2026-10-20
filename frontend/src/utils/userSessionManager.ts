/**
 * User Session Manager
 * ====================
 * Centralized utility for managing user session data persistence
 * Ensures all user data (profile, assessment, progress) is properly saved and restored
 */

import { UserAccount, HealthData } from '../types';

// ── Storage Keys ──────────────────────────────────────────────────────────────
const KEYS = {
  CURRENT_USER: 'currentUser',
  ACCOUNTS: 'caremend_accounts',
  ASSESSMENT_COMPLETED: 'assessmentCompleted',
  HEALTH_DATA: 'healthData',
  RISK_CATEGORY: 'riskCategory',
} as const;

// ── User Session Management ───────────────────────────────────────────────────

/**
 * Get the currently logged-in user
 */
export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    if (!raw) return null;
    const user: UserAccount = JSON.parse(raw);
    console.log('📖 Retrieved current user:', user.username);
    return user;
  } catch (e) {
    console.error('❌ Error reading current user:', e);
    return null;
  }
}

/**
 * Save the current user session
 */
export function saveCurrentUser(user: UserAccount): void {
  try {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    console.log('💾 Saved current user:', user.username);
    console.log('📋 Assessment completed:', user.assessmentCompleted);
  } catch (e) {
    console.error('❌ Error saving current user:', e);
  }
}

/**
 * Update the current user with new data (partial update)
 */
export function updateCurrentUser(updates: Partial<UserAccount>): UserAccount | null {
  const user = getCurrentUser();
  if (!user) {
    console.warn('⚠️ No current user to update');
    return null;
  }
  
  const updated: UserAccount = { ...user, ...updates };
  saveCurrentUser(updated);
  
  // Also update in accounts array
  updateUserInAccounts(updated);
  
  return updated;
}

/**
 * Mark assessment as completed for current user
 */
export function markAssessmentCompleted(
  healthData: HealthData,
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH'
): UserAccount | null {
  console.log('✅ Marking assessment as completed');
  console.log('📊 Health data:', healthData);
  console.log('🎯 Risk category:', riskCategory);
  
  const updated = updateCurrentUser({
    assessmentCompleted: true,
    healthData,
    riskCategory,
  });
  
  if (updated) {
    // Verify the save
    const verified = getCurrentUser();
    console.log('🔍 Verification - assessmentCompleted:', verified?.assessmentCompleted);
    console.log('🔍 Verification - riskCategory:', verified?.riskCategory);
  }
  
  return updated;
}

/**
 * Check if current user has completed assessment
 */
export function hasCompletedAssessment(): boolean {
  const user = getCurrentUser();
  const completed = user?.assessmentCompleted === true;
  console.log('🔍 Assessment completed check:', completed);
  return completed;
}

/**
 * Get user's health data
 */
export function getHealthData(): HealthData | null {
  const user = getCurrentUser();
  return user?.healthData || null;
}

/**
 * Get user's risk category
 */
export function getRiskCategory(): 'LOW' | 'MEDIUM' | 'HIGH' | null {
  const user = getCurrentUser();
  return user?.riskCategory || null;
}

/**
 * Clear current user session (logout)
 */
export function clearCurrentUser(): void {
  localStorage.removeItem(KEYS.CURRENT_USER);
  console.log('🚪 Cleared current user session');
}

// ── Accounts Management ───────────────────────────────────────────────────────

/**
 * Get all registered accounts
 */
export function getAllAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save all accounts
 */
export function saveAllAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('❌ Error saving accounts:', e);
  }
}

/**
 * Update a specific user in the accounts array
 */
export function updateUserInAccounts(updatedUser: UserAccount): void {
  const accounts = getAllAccounts();
  const index = accounts.findIndex(
    a => a.username === updatedUser.username || a.email === updatedUser.email
  );
  
  if (index >= 0) {
    accounts[index] = updatedUser;
    saveAllAccounts(accounts);
    console.log('💾 Updated user in accounts array:', updatedUser.username);
  }
}

/**
 * Add a new user account
 */
export function addUserAccount(user: UserAccount): void {
  const accounts = getAllAccounts();
  accounts.push(user);
  saveAllAccounts(accounts);
  console.log('➕ Added new user account:', user.username);
}

// ── User-Specific Data Storage ────────────────────────────────────────────────

/**
 * Get storage key for user-specific data
 */
export function getUserStorageKey(userId: string | number, dataType: string): string {
  return `caremend_${dataType}_${userId}`;
}

/**
 * Save user-specific data (walking tracker, exercise stats, etc.)
 */
export function saveUserData<T>(userId: string | number, dataType: string, data: T): void {
  try {
    const key = getUserStorageKey(userId, dataType);
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Saved ${dataType} for user ${userId}`);
  } catch (e) {
    console.error(`❌ Error saving ${dataType}:`, e);
  }
}

/**
 * Load user-specific data
 */
export function loadUserData<T>(userId: string | number, dataType: string, defaultValue: T): T {
  try {
    const key = getUserStorageKey(userId, dataType);
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const data = JSON.parse(raw) as T;
    console.log(`📖 Loaded ${dataType} for user ${userId}`);
    return data;
  } catch (e) {
    console.error(`❌ Error loading ${dataType}:`, e);
    return defaultValue;
  }
}

/**
 * Clear all user-specific data (for logout or account deletion)
 */
export function clearUserData(userId: string | number): void {
  const dataTypes = ['walking_stats', 'exercise_sessions', 'nutrition_history', 'active_session'];
  dataTypes.forEach(type => {
    const key = getUserStorageKey(userId, type);
    localStorage.removeItem(key);
  });
  console.log(`🗑️ Cleared all data for user ${userId}`);
}

// ── Session Restoration ───────────────────────────────────────────────────────

/**
 * Restore complete user session on app load
 * Returns user data and whether they should go to dashboard or assessment
 */
export function restoreUserSession(): {
  user: UserAccount | null;
  shouldGoToDashboard: boolean;
  healthData: HealthData | null;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | null;
} {
  const user = getCurrentUser();
  
  if (!user) {
    return {
      user: null,
      shouldGoToDashboard: false,
      healthData: null,
      riskCategory: null,
    };
  }
  
  const shouldGoToDashboard = user.assessmentCompleted === true;
  
  console.log('🔄 Restoring user session');
  console.log('👤 User:', user.username);
  console.log('📋 Assessment completed:', user.assessmentCompleted);
  console.log('🏠 Should go to dashboard:', shouldGoToDashboard);
  
  return {
    user,
    shouldGoToDashboard,
    healthData: user.healthData || null,
    riskCategory: user.riskCategory || null,
  };
}

// ── Migration Helper ──────────────────────────────────────────────────────────

/**
 * Migrate old user data to new format (if needed)
 * Call this once on app initialization
 */
export function migrateUserData(): void {
  const user = getCurrentUser();
  if (!user) return;
  
  // If user has old format data, migrate it
  let needsUpdate = false;
  const updates: Partial<UserAccount> = {};
  
  // Ensure assessmentCompleted is explicitly set
  if (user.assessmentCompleted === undefined) {
    // Check if user has health data - if yes, they completed assessment
    if (user.healthData && user.riskCategory) {
      updates.assessmentCompleted = true;
      needsUpdate = true;
      console.log('🔄 Migrating user - setting assessmentCompleted to true');
    } else {
      updates.assessmentCompleted = false;
      needsUpdate = true;
      console.log('🔄 Migrating user - setting assessmentCompleted to false');
    }
  }
  
  // Ensure user has an ID
  if (!user.id) {
    updates.id = Date.now();
    needsUpdate = true;
    console.log('🔄 Migrating user - adding ID');
  }
  
  if (needsUpdate) {
    updateCurrentUser(updates);
    console.log('✅ User data migration complete');
  }
}
