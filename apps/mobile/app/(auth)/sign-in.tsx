import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { router } from 'expo-router'
import { Colors, Fonts } from '@/constants/theme'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    router.replace('/(auth)/')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Text style={styles.eyebrow}>welcome back</Text>
          <Text style={styles.heading}>good to{'\n'}see you. 👋</Text>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>email address</Text>
              <TextInput
                style={styles.input}
                placeholder="aanya@warwick.ac.uk"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.forgotWrap}>
                <Text style={styles.forgot}>forgot password?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'signing in…' : 'sign in →'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            no account yet?{' '}
            <Text style={styles.footerLink} onPress={() => router.push('/(auth)/sign-up')}>
              get started
            </Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 40,
  },
  eyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  heading: {
    fontFamily: Fonts.black,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -1,
    color: Colors.dark,
    marginBottom: 28,
  },
  form: {
    gap: 14,
    marginBottom: 28,
  },
  inputWrap: { gap: 7 },
  label: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.cardWhite,
    borderWidth: 1.5,
    borderColor: Colors.rule,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.dark,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -2,
  },
  forgot: {
    fontFamily: Fonts.sansBold,
    fontSize: 12.5,
    color: Colors.accentDark,
    textDecorationLine: 'underline',
  },
  error: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: '#c0392b',
  },
  button: {
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 16,
    color: '#ffffff',
  },
  footerText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  footerLink: {
    fontFamily: Fonts.sansBold,
    color: Colors.dark,
    textDecorationLine: 'underline',
  },
})
