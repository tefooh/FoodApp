import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { ChevronLeft, ChevronRight, User, Shield, Globe, Mail, FileText, Headphones, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import CartSheet from '../components/CartSheet';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { t, isRTL, toggleLanguage, language } = useLanguage();
    const { user, isGuest } = useAuth();
    const [userData, setUserData] = useState(null);
    const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

    useEffect(() => {
        if (!user || user.isAnonymous) return;
        const fetchUserData = async () => {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            }
        };
        fetchUserData();
    }, [user]);

    const handleLogout = () => {
        Alert.alert(
            t('signout_confirm_title'),
            t('signout_confirm_msg'),
            [
                { text: t('cancel'), style: "cancel" },
                { text: t('sign_out'), style: "destructive", onPress: () => auth.signOut() }
            ]
        );
    };


    const SettingRow = ({ icon, label, onPress, showArrow = true, color = COLORS.black, subLabel = null }) => {
        const iconMap = {
            'user': User,
            'shield': Shield,
            'globe': Globe,
            'mail': Mail,
            'file-text': FileText,
            'headphones': Headphones,
            'message-square': MessageSquare
        };
        const IconComponent = iconMap[icon];

        return (
            <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
                <View style={[styles.rowLeading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.iconBox}>
                        {IconComponent && <IconComponent size={18} color={color} />}
                    </View>
                    <View style={{ marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                        <Text style={styles.rowLabel}>{label}</Text>
                        {subLabel && <Text style={styles.rowSubLabel}>{subLabel}</Text>}
                    </View>
                </View>
                {showArrow && (isRTL ? <ChevronLeft size={18} color={COLORS.subtext} /> : <ChevronRight size={18} color={COLORS.subtext} />)}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                title={t('my_profile')}
                onCartPress={() => setIsCartSheetOpen(true)}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Card - Premium Monochrome Design */}
                <View style={styles.profileCard}>
                    <View style={[styles.profileInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                                {isGuest ? 'G' : (user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                            </Text>
                        </View>
                        <View style={[styles.headerInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={styles.userName}>
                                {isGuest ? t('guest_user') : (userData?.firstName || user?.displayName?.split(' ')[0] || t('welcome_back'))}
                            </Text>
                            {!isGuest && (
                                <Text style={styles.memberSince}>
                                    {t('member_since')} {userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : t('recently')}
                                </Text>
                            )}
                            {isGuest && (
                                <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
                                    <Text style={styles.loginPrompt}>{t('signin_better_exp')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* Main Sections */}
                {!isGuest && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('account_settings')}</Text>
                        <View style={styles.sectionContainer}>
                            <SettingRow
                                icon="user"
                                label={t('personal_info')}
                                onPress={() => navigation.navigate('PersonalInfo')}
                            />
                            <View style={styles.rowDivider} />
                            <SettingRow
                                icon="shield"
                                label={t('security')}
                                onPress={() => navigation.navigate('Security')}
                            />
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('app_preferences')}</Text>
                    <View style={styles.sectionContainer}>
                        <SettingRow
                            icon="globe"
                            label={t('language')}
                            subLabel={language === 'en' ? t('english') : t('arabic')}
                            onPress={() => navigation.navigate('Language')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('information')}</Text>
                    <View style={styles.sectionContainer}>
                        {!isGuest && (
                            <>
                                <SettingRow
                                    icon="headphones"
                                    label={t('contact_support')}
                                    onPress={() => navigation.navigate('ContactSupport')}
                                />
                                <View style={styles.rowDivider} />
                            </>
                        )}
                        <SettingRow
                            icon="file-text"
                            label={t('about_app_label')}
                            onPress={() => navigation.navigate('About')}
                        />
                    </View>
                </View>

                {isGuest ? (
                    <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Auth')}>
                        <LinearGradient colors={COLORS.darkGradient} style={styles.gradientBtn}>
                            <Text style={styles.loginBtnText}>{t('signin_create_account')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutBtnText}>{t('sign_out')}</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.versionText}>{t('version')} 1.0.0</Text>
                <View style={{ height: 100 }} />
            </ScrollView>

            <CartSheet visible={isCartSheetOpen} onClose={() => setIsCartSheetOpen(false)} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    scrollContent: { padding: 16 },
    profileCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 16,
        marginBottom: 20,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.grey,
        marginTop: 5
    },
    profileInfo: { alignItems: 'center' },
    avatarCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small
    },
    avatarText: { color: COLORS.white, fontSize: 26, fontFamily: FONTS.bold },
    headerInfo: { marginStart: 16, flex: 1 },
    userName: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },
    memberSince: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 2 },
    loginPrompt: { fontSize: 12, fontFamily: FONTS.semibold, color: COLORS.black, marginTop: 4 },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.subtext, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginStart: 5 },
    sectionContainer: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        borderWidth: 1,
        borderColor: COLORS.grey,
        overflow: 'hidden'
    },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
    rowLeading: { alignItems: 'center', flex: 1 },
    iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' },
    rowLabel: { fontSize: 15, fontFamily: FONTS.semibold, color: COLORS.black },
    rowSubLabel: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 1 },
    rowDivider: { height: 1, backgroundColor: COLORS.grey, marginHorizontal: 16 },

    logoutBtn: { marginTop: 10, padding: 15, borderRadius: BORDER_RADIUS.button, backgroundColor: '#FFF5F5', alignItems: 'center', borderWidth: 1, borderColor: '#FED7D7' },
    logoutBtnText: { color: COLORS.red, fontFamily: FONTS.bold, fontSize: 15 },

    loginBtn: { marginTop: 10, height: 52, borderRadius: BORDER_RADIUS.button, overflow: 'hidden' },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loginBtnText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 15 },

    versionText: { textAlign: 'center', color: COLORS.subtext, fontSize: 11, fontFamily: FONTS.medium, marginTop: 30 }
});

export default ProfileScreen;
