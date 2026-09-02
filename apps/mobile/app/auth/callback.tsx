import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function CallbackScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    console.log(code);

    async function exchange() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError(true); return; }

      const {error: fnError} = await supabase.functions.invoke('exchange-token', {
        body:{code},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (fnError) {setError(true); return; }
      router.replace('/(tabs)');
    }

    exchange();
  }, [code]);

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
