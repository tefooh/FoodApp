import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Image,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
    signInWithPopup
} from 'firebase/auth';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const AuthScreen = ({ navigation }) => {
    const { t, isRTL } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

    // Redirect logged-in users away from Auth screen
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            // If user is logged in with a real account (not anonymous), redirect them
            if (user && !user.isAnonymous) {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                } else {
                    navigation.replace('Main');
                }
            }
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        const checkAvailability = async () => {
            if (Platform.OS !== 'web') {
                const isAvailable = await AppleAuthentication.isAvailableAsync();
                setAppleAuthAvailable(isAvailable);
            }
        };
        checkAvailability();

        if (Platform.OS !== 'web') {
            GoogleSignin.configure({
                webClientId: '937299343480-627nv9l68ru9o83ngjkn55f6ttk7c6qj.apps.googleusercontent.com',
                offlineAccess: true,
            });
        }
    }, []);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            if (Platform.OS === 'web') {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
            } else {
                await GoogleSignin.hasPlayServices();
                const userInfo = await GoogleSignin.signIn();
                const idToken = userInfo.data?.idToken || userInfo.idToken;
                if (!idToken) throw new Error("Google Sign-In failed to return tokens.");
                const credential = GoogleAuthProvider.credential(idToken);
                await signInWithCredential(auth, credential);
            }
        } catch (err) {
            console.log('Google Sign-In Error:', err);
            // Don't show error if user cancelled
            if (err.code !== 'ASYNC_OP_IN_PROGRESS' && err.code !== 'SIGN_IN_CANCELLED' && err.code !== 'auth/popup-closed-by-user') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            const { identityToken, nonce } = credential;
            if (!identityToken) throw new Error("Apple Sign-In failed.");
            const provider = new OAuthProvider('apple.com');
            const firebaseCredential = provider.credential({
                idToken: identityToken,
                rawNonce: nonce,
            });
            await signInWithCredential(auth, firebaseCredential);
            // Navigation will be handled by the auth state listener
        } catch (err) {
            if (err.code !== 'ERR_CANCELED') setError(err.message);
            setLoading(false);
        }
    };

    const handleAuth = async () => {
        if (!email || !password) {
            setError(t('fill_all_fields'));
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // Navigation will be handled by the auth state listener
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleGuest = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('Main');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    <View style={styles.logoArea}>
                        <Image source={require('../../assets/blackRawTextLogo.png')} style={styles.logoImage} resizeMode="contain" />
                    </View>

                    <View style={styles.formCard}>
                        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{isLogin ? t('welcome_back') : t('create_account')}</Text>
                        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{isLogin ? t('sign_in_continue') : t('join_us')}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('email_label')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor={COLORS.subtext}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('password_label')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={COLORS.subtext}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.mainBtn}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            <LinearGradient colors={COLORS.darkGradient} style={styles.gradientBtn}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? t('signin_btn') : t('signup_btn')}</Text>}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
                            <Text style={styles.switchText}>
                                {isLogin ? t('dont_have_account') : t('already_have_account')}
                                <Text style={styles.switchTextBold}>{isLogin ? t('signup_btn') : t('signin_btn')}</Text>
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.dividerBox}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>{t('login_with_upper')}</Text>
                            <View style={styles.divider} />
                        </View>

                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} disabled={loading}>
                                <Image source={require('../../assets/logos/google_logo.png')} style={styles.socialLogo} />
                                <Text style={styles.socialBtnText}>Google</Text>
                            </TouchableOpacity>

                            {appleAuthAvailable && (
                                <TouchableOpacity style={styles.socialBtn} onPress={handleAppleLogin} disabled={loading}>
                                    <Image source={require('../../assets/logos/apple_logo.png')} style={styles.socialLogo} />
                                    <Text style={styles.socialBtnText}>Apple</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
                            <Text style={styles.guestBtnText}>{t('continue_guest')}</Text>
                        </TouchableOpacity>

                        <View style={styles.legalFooter}>
                            <Text style={styles.legalText}>{t('by_continuing')}</Text>
                            <View style={[styles.legalLinks, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
                                    <Text style={styles.legalLink}>{t('terms_of_service')}</Text>
                                </TouchableOpacity>
                                <Text style={styles.legalText}> & </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                                    <Text style={styles.legalLink}>{t('privacy_policy')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    content: { flex: 1, justifyContent: 'center', padding: 25 },
    logoArea: { alignItems: 'center', marginBottom: 40 },
    logoImage: {
        width: 140,
        height: 48,
        marginBottom: 10
    },
    brandName: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.black, letterSpacing: 5 },

    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 5
    },
    title: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.black },
    subtitle: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 10, marginBottom: 35 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.black, marginBottom: 10, marginHorizontal: 5 },
    input: {
        backgroundColor: COLORS.grey,
        borderRadius: BORDER_RADIUS.button,
        padding: 18,
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.black,
        borderWidth: 1,
        borderColor: COLORS.lightGrey,
        textAlign: 'auto'
    },

    errorText: { color: COLORS.red, fontSize: 13, fontFamily: FONTS.medium, marginBottom: 15, textAlign: 'center' },

    mainBtn: { height: 60, borderRadius: BORDER_RADIUS.button, overflow: 'hidden', marginTop: 10 },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: COLORS.white, fontSize: 16, fontFamily: FONTS.bold },

    switchBtn: { marginTop: 25, alignSelf: 'center' },
    switchText: { color: COLORS.subtext, fontSize: 13, fontFamily: FONTS.medium },
    switchTextBold: { color: COLORS.black, fontFamily: FONTS.bold },

    dividerBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
    divider: { flex: 1, height: 1, backgroundColor: COLORS.grey },
    dividerText: { marginHorizontal: 15, color: COLORS.subtext, fontSize: 12, fontFamily: FONTS.bold },

    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 15
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.lightGrey,
        borderRadius: BORDER_RADIUS.button,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10
    },
    socialBtnText: {
        fontSize: 15,
        fontFamily: FONTS.bold,
        color: COLORS.black
    },
    socialLogo: {
        width: 20,
        height: 20,
        resizeMode: 'contain'
    },

    guestBtn: {
        height: 55,
        borderRadius: BORDER_RADIUS.button,
        borderWidth: 1,
        borderColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center'
    },
    guestBtnText: { color: COLORS.black, fontSize: 16, fontFamily: FONTS.bold },

    legalFooter: {
        marginTop: 30,
        alignItems: 'center',
        paddingHorizontal: 20
    },
    legalText: {
        fontSize: 11,
        fontFamily: FONTS.medium,
        color: COLORS.subtext,
        textAlign: 'center'
    },
    legalLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
    legalLink: {
        fontSize: 11,
        fontFamily: FONTS.bold,
        color: COLORS.black,
        textDecorationLine: 'underline'
    }
});

export default AuthScreen;
