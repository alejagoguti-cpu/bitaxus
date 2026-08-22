/**
 * AuthContext
 * Manages authentication state and user session with Supabase Auth
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Tenant } from "@/shared/types";
import { supabase, callEdgeFunction } from "@/lib/supabase";

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
        // Get current session from Supabase Auth
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          // Get user profile and tenant from database
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (userError) throw userError;

          const { data: tenantData, error: tenantError } = await supabase
            .from("tenants")
            .select("*")
            .eq("id", userData.tenant_id)
            .single();

          if (tenantError) throw tenantError;

          setUser(userData);
          setTenant(tenantData);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        // Clear invalid session
        await supabase.auth.signOut();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setTenant(null);
      } else if (session?.user) {
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (userData) {
            const { data: tenantData } = await supabase
              .from("tenants")
              .select("*")
              .eq("id", userData.tenant_id)
              .single();

            setUser(userData);
            setTenant(tenantData);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (userError) throw userError;

        // Fetch tenant
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("id", userData.tenant_id)
          .single();

        if (tenantError) throw tenantError;

        setUser(userData);
        setTenant(tenantData);
      }
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
      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setTenant(null);
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
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            tenant_name: tenantName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Call Edge Function to create tenant and user records
        const { userData, tenantData } = await callEdgeFunction<{
          userData: User;
          tenantData: Tenant;
        }>("auth/register", {
          user_id: authData.user.id,
          email,
          name,
          tenant_name: tenantName,
        });

        setUser(userData);
        setTenant(tenantData);
      }
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
