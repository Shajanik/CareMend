/**
 * config/authService.ts
 * =====================
 * Handles all signup / signin API calls and token persistence.
 *
 * Storage strategy
 * ----------------
 * - JWT token  → localStorage["caremend_token"]
 * - User object → localStorage["caremend_user"]
 *
 * This means accounts survive page refreshes and browser restarts.
 */

import { API_CONFIG } from './api';

const BASE = API_CONFIG.BASE_URL;

export interface AuthUser {
  id:                number;
  full_name:         string;
  email:             string;
  username:          string;
  mobile?:           string;
  dob?:              string;
  gender?:           string;
  blood_type?:       string;
  emergency_contact?: string;
  allergies?:        string;
  medications?:      string;
}

export interface SignupPayload {
  full_name: string;
  email:     string;
  username:  string;
  password:  string;
  mobile?:   string;
}

export interface SigninPayload {
  identifier: string;   // email | username | mobile
  password:   string;
}

export interface AuthResult {
  ok:      boolean;
  user?:   AuthUser;
  token?:  string;
  error?:  string;
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export const saveSession = (token: string, user: AuthUser) => {
  localStorage.setItem("caremend_token", token);
  localStorage.setItem("caremend_user",  JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("caremend_token");
  localStorage.removeItem("caremend_user");
};

export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("caremend_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getToken = (): string | null =>
  localStorage.getItem("caremend_token");

// ── API calls ─────────────────────────────────────────────────────────────────
export async function apiSignup(payload: SignupPayload): Promise<AuthResult> {
  try {
    const res  = await fetch(`${BASE}/signup`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      // 409 = duplicate, 400 = validation
      const msg = data.details && data.details.length > 0
        ? data.details.join(", ")
        : (data.error ?? "Signup failed");
      return { ok: false, error: msg };
    }

    saveSession(data.token, data.user);
    return { ok: true, user: data.user, token: data.token };

  } catch (err) {
    console.error("Signup network error:", err);
    return { ok: false, error: "Cannot reach server. Is the backend running?" };
  }
}

export async function apiSignin(payload: SigninPayload): Promise<AuthResult> {
  const endpoint = `${BASE}/signin`;
  
  try {
    console.log("========================================");
    console.log("🔐 [AUTH] Starting signin request");
    console.log("========================================");
    console.log(`📍 Backend URL (BASE): ${BASE}`);
    console.log(`🔗 Full endpoint: ${endpoint}`);
    console.log(`📝 Payload: ${JSON.stringify(payload)}`);
    console.log(`🌐 Hostname: ${window.location.hostname}`);
    console.log(`🌐 Environment PROD: ${import.meta.env.PROD}`);
    
    const res  = await fetch(endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    
    console.log(`🔄 Response received - Status: ${res.status} ${res.statusText}`);
    
    const data = await res.json();
    console.log(`📦 Response body:`, data);

    if (!res.ok) {
      console.error(`❌ Request failed - Status ${res.status}`);
      return { ok: false, error: data.error ?? "Invalid credentials" };
    }

    console.log(`✅ Signin successful - Token received`);
    saveSession(data.token, data.user);
    return { ok: true, user: data.user, token: data.token };

  } catch (err) {
    console.error("❌ Network error:", err);
    console.error(`Error type: ${err instanceof TypeError ? 'TypeError' : 'Other'}`);
    console.error(`Error message: ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false, error: "Cannot reach server. Please check your connection." };
  }
}

// ── Profile API ───────────────────────────────────────────────────────────────
export interface ProfileUpdatePayload {
  full_name?:         string;
  mobile?:            string;
  dob?:               string;
  gender?:            string;
  blood_type?:        string;
  emergency_contact?: string;
  allergies?:         string;
  medications?:       string;
}

export async function apiGetProfile(): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  const token = getToken();
  if (!token) return { ok: false, error: "Not authenticated" };
  try {
    const res  = await fetch(`${BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Failed to fetch profile" };
    // Keep localStorage in sync
    saveSession(token, data);
    return { ok: true, user: data };
  } catch {
    return { ok: false, error: "Cannot reach server" };
  }
}

export async function apiUpdateProfile(
  payload: ProfileUpdatePayload
): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  const token = getToken();
  console.log('🔵 [authService] apiUpdateProfile called');
  console.log('🔵 [authService] Token exists:', !!token);
  console.log('🔵 [authService] Payload:', payload);
  
  if (!token) return { ok: false, error: "Not authenticated" };
  
  try {
    console.log('🔵 [authService] Sending PUT request to:', `${BASE}/profile`);
    
    const res  = await fetch(`${BASE}/profile`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify(payload),
    });
    
    console.log('🔵 [authService] Response status:', res.status);
    
    const data = await res.json();
    console.log('🔵 [authService] Response data:', data);
    
    if (!res.ok) {
      console.error('❌ [authService] Update failed:', data.error);
      return { ok: false, error: data.error ?? "Update failed" };
    }
    
    console.log('✅ [authService] Update successful, saving to localStorage');
    saveSession(token, data.user);
    return { ok: true, user: data.user };
  } catch (err) {
    console.error('❌ [authService] Network error:', err);
    return { ok: false, error: "Cannot reach server" };
  }
}
