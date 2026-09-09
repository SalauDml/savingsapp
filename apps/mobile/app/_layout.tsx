import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Outfit_500Medium,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

// export const unstable_settings = {
//   initialRouteName: '(tabs)',
// };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Outfit_500Medium,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  useEffect(() => {
    // TODO: Call supabase.auth.getSession() to get the current session.
    // Store the session with setSession, then setLoading(false).
    async function init() {
      const { data: { session} } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }
    init()
    // Then call supabase.auth.onAuthStateChange to listen for future changes.
    // In the listener, update session with setSession.
    
    const { data: { subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    // Return the subscription's unsubscribe function for cleanup.
    return () => subscription.unsubscribe()
  }, []);

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [session, loading]);


  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2d2420', alignItems: 'center', justifyContent: 'center' }}>

        {/* Logo mark */}
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#2d2420', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#9b7e6a' }} />
        </View>

        {/* Wordmark */}
        <Text style={{ fontFamily: Fonts.black, fontSize: 44, color: '#ffffff', letterSpacing: -1.5, marginTop: 16 }}>
          Cait
        </Text>

        {/* Acronym */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
          {([['C', 'can I'], ['A', 'afford'], ['IT', 'it']] as [string, string][]).map(([letter, word], i) => (
            <View key={letter} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
              <Text style={{ fontFamily: Fonts.sansExtraBold, fontSize: 10, color: '#ffffff', letterSpacing: 0.2 }}>{letter}</Text>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 10, color: '#c4a898' }}>{word}</Text>
              {i < 2 && <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', marginLeft: 6 }}>·</Text>}
            </View>
          ))}
        </View>

        {/* Tagline */}
        <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 24 }}>
          your money. no drama.
        </Text>

        {/* Loading dots */}
        <View style={{ position: 'absolute', bottom: 48, flexDirection: 'row', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: i === 1 ? '#9b7e6a' : 'rgba(255,255,255,0.18)' }} />
          ))}
        </View>

      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="budget" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={Colors.background} />
    </ThemeProvider>
  );
}
