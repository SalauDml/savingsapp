import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { OAUTH_STATE_KEY } from '@/lib/monzoOAuthState';

export default function CallbackScreen() {
  const { code, state } = useLocalSearchParams<{ code: string; state?: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;

    async function exchange() {
      // Verify this callback actually belongs to a flow THIS device
      // started, before doing anything else with `code`. cait://
      // auth/callback is a custom URL scheme - any app or webpage on the
      // device can open it, not just Monzo's own redirect - so without
      // this check, someone could craft their own
      // cait://auth/callback?code=...&state=... and get this screen to
      // silently exchange and bind THEIR bank tokens to your profile.
      // Read-then-clear regardless of outcome: the stored value is only
      // ever meant to be checked once, whether it matches or not.
      const expectedState = await AsyncStorage.getItem(OAUTH_STATE_KEY);
      await AsyncStorage.removeItem(OAUTH_STATE_KEY);

      if (!expectedState || state !== expectedState) {
        console.log('oauth state mismatch - rejecting callback (hadExpected:', !!expectedState, ')');
        setError(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError(true); return; }

      const {error: fnError} = await supabase.functions.invoke('exchange-token', {
        body:{code},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (fnError) {
        // The "something went wrong" screen below never shows WHY - it's
        // been swallowing the actual reason. fnError here is a
        // FunctionsHttpError whose real payload (whatever exchange-token's
        // JSON error body said - a bad code, a Monzo rejection, a DB error)
        // is on .context, the raw Response, not on the error itself.
        console.log('exchange-token failed:', fnError.message);
        if ('context' in fnError && fnError.context?.json) {
          try {
            console.log('exchange-token error body:', JSON.stringify(await fnError.context.json()));
          } catch (parseErr) {
            console.log('could not parse exchange-token error body:', parseErr);
          }
        }
        setError(true);
        return;
      }
      router.replace('/(tabs)');
    }

    exchange();
  }, [code, state]);

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
          <Text style={styles.heading}>something went wrong.</Text>
          <Text style={styles.subheading}>we couldn't connect your bank. please try again.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/connect-bank')} activeOpacity={0.85}>
            <Text style={styles.buttonText}>try again →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>C</Text>
        </View>
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginBottom: 24 }} />
        <Text style={styles.heading}>connecting your bank...</Text>
        <Text style={styles.subheading}>this will only take a moment.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 56, alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  avatarText: { fontFamily: Fonts.sansExtraBold, fontSize: 22, color: '#fff' },
  heading: { fontFamily: Fonts.black, fontSize: 24, color: Colors.dark, textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  subheading: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 40, lineHeight: 20 },
  button: { height: 54, borderRadius: 27, backgroundColor: Colors.dark, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansExtraBold, fontSize: 16, color: '#ffffff' },
});
