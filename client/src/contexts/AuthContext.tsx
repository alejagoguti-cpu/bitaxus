/**
 * AuthContext
 * Manages authentication state and session profile with Supabase Auth
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Tenant,
  TenantPlan,
  TenantStatus,
  User,
  UserRole,
  UserStatus,
} from "@shared/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    tenantName: string
  ) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProfile = { user: User; tenant: Tenant };

function metadataString(
  metadata: Record<string, unknown>,
  key: string,
  fallback: string
) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildFallbackProfile(authUser: SupabaseUser): AuthProfile {
  const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const email = authUser.email ?? "";
  const tenantId = metadataString(metadata, "tenant_id", authUser.id);
  const name = metadataString(
    metadata,
    "name",
    metadataString(metadata, "full_name", email.split("@")[0] || "Usuario")
  );
  const now = new Date().toISOString();
  const roleValue = metadataString(
    metadata,
    "role",
    UserRole.ADMIN
  ) as UserRole;
  const role = Object.values(UserRole).includes(roleValue)
    ? roleValue
    : UserRole.ADMIN;

  const tenant: Tenant = {
    id: tenantId,
    slug: metadataString(
      metadata,
      "tenant_slug",
      `tenant-${authUser.id.slice(0, 8)}`
    ),
    name: metadataString(metadata, "tenant_name", "Bitaxus"),
    nit: metadataString(metadata, "nit", "N/A"),
    email,
    city: metadataString(metadata, "city", "Bogotá"),
    country: metadataString(metadata, "country", "Colombia"),
    phone: metadataString(metadata, "phone", "") || undefined,
    plan: TenantPlan.BUSINESS,
    status: TenantStatus.ACTIVE,
    settings: {},
    metadata: { source: "supabase_auth" },
    created_at: authUser.created_at ?? now,
    updated_at: now,
  };

  const user: User = {
    id: authUser.id,
    tenant_id: tenant.id,
    email,
    name,
    phone: metadataString(metadata, "phone", "") || undefined,
    role,
    two_factor_enabled: false,
    last_login_at: now,
    status: UserStatus.ACTIVE,
    created_at: authUser.created_at ?? now,
    updated_at: now,
  };

  return { user, tenant };
}

async function resolveProfile(authUser: SupabaseUser): Promise<AuthProfile> {
  const fallback = buildFallbackProfile(authUser);

  try {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (userError || !userData) return fallback;

    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", userData.tenant_id)
      .maybeSingle();

    if (tenantError || !tenantData) return fallback;

    return { user: userData as User, tenant: tenantData as Tenant };
  } catch {
    // The public Supabase project may not expose profile tables. Auth itself is
    // still valid, so keep the user signed in with the Auth metadata profile.
    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const applyAuthUser = async (authUser: SupabaseUser) => {
    const profile = await resolveProfile(authUser);
    setUser(profile.user);
    setTenant(profile.tenant);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (session?.user) {
          const profile = await resolveProfile(session.user);
          if (mounted) {
            setUser(profile.user);
            setTenant(profile.tenant);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) {
          setUser(null);
          setTenant(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setTenant(null);
        setIsLoading(false);
      } else if (session?.user) {
        void applyAuthUser(session.user).finally(() => setIsLoading(false));
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const configError = new Error("Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
      setError(configError);
      throw configError;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: email.trim(),
          password,
        }
      );

      if (authError) {
        const normalizedMessage = authError.message.toLowerCase();
        if (normalizedMessage.includes("invalid login credentials")) {
          throw new Error("El correo o la contraseña no son correctos.");
        }
        throw authError;
      }

      if (!data.user) throw new Error("No se pudo obtener la sesión.");

      const profile = await resolveProfile(data.user);
      setUser(profile.user);
      setTenant(profile.tenant);
    } catch (err) {
      const authError =
        err instanceof Error ? err : new Error("No se pudo iniciar sesión.");
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setTenant(null);
      return;
    }

    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      setUser(null);
      setTenant(null);
    } catch (err) {
      const logoutError =
        err instanceof Error ? err : new Error("No se pudo cerrar sesión.");
      setError(logoutError);
      throw logoutError;
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
    if (!isSupabaseConfigured) {
      const configError = new Error("Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
      setError(configError);
      throw configError;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name,
            tenant_name: tenantName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear la cuenta.");

      const profile = buildFallbackProfile(authData.user);
      setUser(profile.user);
      setTenant({
        ...profile.tenant,
        name: tenantName.trim() || profile.tenant.name,
      });
    } catch (err) {
      const registrationError =
        err instanceof Error
          ? err
          : new Error("No se pudo registrar la cuenta.");
      setError(registrationError);
      throw registrationError;
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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
