import React, { createContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'user' | 'pending' | 'rejected';
  status: 'active' | 'pending' | 'rejected';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileUserId = useRef<string | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchUserProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Check active session
    const loadUser = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const profileData = await fetchUserProfile(user.id);
          profileUserId.current = user.id;
          setProfile(profileData);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();

    // Listen for auth changes - no awaited Supabase calls inside the callback
    // (it can deadlock the client), so defer the profile fetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const sessionUser = session?.user || null;
        setUser(sessionUser);
        if (!sessionUser) {
          profileUserId.current = null;
          setProfile(null);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Only block the UI when the profile belongs to a different (new) user
          const isNewUser = profileUserId.current !== sessionUser.id;
          if (isNewUser) setProfileLoading(true);
          setTimeout(async () => {
            const profileData = await fetchUserProfile(sessionUser.id);
            profileUserId.current = sessionUser.id;
            setProfile(profileData);
            setProfileLoading(false);
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`
      }
    });
    if (error) throw error;

    // Profile (pending) is created by the on_auth_user_created DB trigger
    if (data.user) {
      // Notify admin about new user (non-blocking)
      try {
        await supabase.functions.invoke('notify-admin-new-user', {
          body: {
            email: email,
            userId: data.user.id
          }
        });
      } catch (notifyError) {
        console.error('Error notifying admin:', notifyError);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading: loading || profileLoading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
