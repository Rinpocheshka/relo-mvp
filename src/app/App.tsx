import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SupabaseAuthProvider, useAuth } from './SupabaseAuthProvider';

function OnboardingSync({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const stored = localStorage.getItem('reloOnboarding');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data && data.city) {
          // Update profile
          supabase.from('profiles').update({
            city: data.city,
            stage: data.stage,
            interests: data.need || [],
          }).eq('id', user.id).then(({ error }: { error: any }) => {
            if (!error) {
              localStorage.removeItem('reloOnboarding');
            } else {
              console.error('Error syncing onboarding:', error);
            }
          });
        }
      } catch (e) {
        console.error('Failed to parse onboarding data', e);
      }
    }
  }, [user]);

  return <>{children}</>;
}

export default function App() {
  return (
    <SupabaseAuthProvider>
      <OnboardingSync>
        <RouterProvider router={router} />
      </OnboardingSync>
    </SupabaseAuthProvider>
  )
}
