import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  type AuthUser,
  type UserRole,
  login as apiLogin,
  register as apiRegister,
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
  demoLogin as apiDemoLogin,
  getMe as apiGetMe,
  logout as apiLogout,
  getAuthToken,
} from "@scrapsaathi/api-client";

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<void>;
  register: (name: string, identifier: string, role: UserRole, password?: string) => Promise<void>;
  requestOtp: (phone: string) => Promise<{ message: string; simulatedOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Initialize from existing token or auto demo login
  useEffect(() => {
    async function initAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await apiGetMe();
          setUser(res.user);
        } catch {
          apiLogout();
          // Fall back to default demo household user
          await quickLogin("household");
        }
      } else {
        // Auto sign in as Household demo on first visit for frictionless experience
        await quickLogin("household");
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = useCallback(async (identifier: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await apiLogin({ identifier, password });
      setUser(res.user);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, identifier: string, role: UserRole, password?: string) => {
      setIsLoading(true);
      try {
        const res = await apiRegister({ name, identifier, role, password });
        setUser(res.user);
        setIsAuthModalOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const requestOtp = useCallback(async (phone: string) => {
    return apiRequestOtp({ phone });
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await apiVerifyOtp({ phone, otp });
      setUser(res.user);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const quickLogin = useCallback(async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await apiDemoLogin(targetRole);
      setUser(res.user);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchRole = useCallback(
    async (targetRole: UserRole) => {
      await quickLogin(targetRole);
    },
    [quickLogin]
  );

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const role: UserRole = user?.role ?? "household";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        register,
        requestOtp,
        verifyOtp,
        quickLogin,
        switchRole,
        logout,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        isAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
