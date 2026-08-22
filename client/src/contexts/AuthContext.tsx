/**
 * AuthContext
 * Manages authentication state and user session
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Tenant } from "@/shared/types";

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, tenantName: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem("bitaxus_user");
        const storedTenant = localStorage.getItem("bitaxus_tenant");
        const token = localStorage.getItem("bitaxus_token");

        if (storedUser && storedTenant && token) {
          setUser(JSON.parse(storedUser));
          setTenant(JSON.parse(storedTenant));
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        localStorage.removeItem("bitaxus_user");
        localStorage.removeItem("bitaxus_tenant");
        localStorage.removeItem("bitaxus_token");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with real Supabase Auth
      // const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      // Mock login for now
      const mockUser: User = {
        id: "user_123",
        tenant_id: "tenant_123",
        email,
        name: email.split("@")[0],
        role: "admin",
        two_factor_enabled: false,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockTenant: Tenant = {
        id: "tenant_123",
        slug: "bitaxus-demo",
        name: "Bitaxus Demo",
        nit: "123456789",
        email: "info@bitaxus.com",
        city: "Bogotá",
        country: "Colombia",
        plan: "business",
        status: "active",
        settings: {},
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(mockUser);
      setTenant(mockTenant);

      localStorage.setItem("bitaxus_user", JSON.stringify(mockUser));
      localStorage.setItem("bitaxus_tenant", JSON.stringify(mockTenant));
      localStorage.setItem("bitaxus_token", "mock_token_" + Date.now());
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Login failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      // TODO: Replace with real Supabase Auth
      // await supabase.auth.signOut();

      setUser(null);
      setTenant(null);

      localStorage.removeItem("bitaxus_user");
      localStorage.removeItem("bitaxus_tenant");
      localStorage.removeItem("bitaxus_token");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Logout failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    tenantName: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with real Supabase Auth + Edge Function
      // const { data, error } = await supabase.auth.signUp({ email, password });
      // Then call createTenant and createUser Edge Functions

      // Mock registration for now
      const mockUser: User = {
        id: "user_" + Date.now(),
        tenant_id: "tenant_" + Date.now(),
        email,
        name,
        role: "admin",
        two_factor_enabled: false,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockTenant: Tenant = {
        id: "tenant_" + Date.now(),
        slug: tenantName.toLowerCase().replace(/\s+/g, "-"),
        name: tenantName,
        nit: "000000000",
        email,
        city: "Bogotá",
        country: "Colombia",
        plan: "free",
        status: "active",
        settings: {},
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(mockUser);
      setTenant(mockTenant);

      localStorage.setItem("bitaxus_user", JSON.stringify(mockUser));
      localStorage.setItem("bitaxus_tenant", JSON.stringify(mockTenant));
      localStorage.setItem("bitaxus_token", "mock_token_" + Date.now());
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Registration failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isLoading,
        error,
        login,
        logout,
        register,
        isAuthenticated: !!user && !!tenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
