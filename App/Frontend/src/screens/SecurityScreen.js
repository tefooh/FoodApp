import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebase';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { Lock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react-native';

const SecurityScreen = ({ navigation }) => {
    const { t, isRTL } = useLanguage();
    const { user } = useAuth();

    React.useEffect(() => {
        if (!user) {
            navigation.goBack();
        }
    }, [user]);

    const handleChangePassword = () => {
        Alert.alert(
            t('change_password'),
            `${t('password_reset_confirm_msg')} (${user.email})`,
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('send_link'), onPress: async () => {
                        try {
                            await sendPasswordResetEmail(auth, user.email);
                            Alert.alert(t('success'), t('password_reset_sent'));
                        } catch (err) {
                            Alert.alert(t('error'), err.message);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('delete_account'),
            t('confirm_delete'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('delete_my_account_btn'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // 1. Delete user data from Firestore first
                            await deleteDoc(doc(db, 'users', user.uid));

                            // 2. Delete the user from Auth
                            await deleteUser(user);
                            Alert.alert(t('success'), t('account_deleted'));
                        } catch (err) {
                            if (err.code === 'auth/requires-recent-login') {
                                Alert.alert(t('security_notice'), t('reauth_required_msg'));
                            } else {
                                Alert.alert(t('error'), err.message);
                            }
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    {isRTL ? <ChevronRight size={22} color={COLORS.black} /> : <ChevronLeft size={22} color={COLORS.black} />}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('security')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.sectionContainer}>
                    <TouchableOpacity style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleChangePassword}>
                        <View style={[styles.iconBox, { marginRight: isRTL ? 0 : 15, marginLeft: isRTL ? 15 : 0 }]}>
                            <Lock size={20} color={COLORS.black} />
                        </View>
                        <Text style={[styles.rowText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('change_password')}</Text>
                        {isRTL ? <ChevronLeft size={20} color={COLORS.subtext} /> : <ChevronRight size={20} color={COLORS.subtext} />}
                    </TouchableOpacity>
                </View>

                <View style={[styles.sectionContainer, { marginTop: 25, borderColor: '#FED7D7' }]}>
                    <TouchableOpacity style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleDeleteAccount}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF5F5', marginRight: isRTL ? 0 : 15, marginLeft: isRTL ? 15 : 0 }]}>
                            <Trash2 size={20} color={COLORS.red} />
                        </View>
                        <Text style={[styles.rowText, { color: COLORS.red, textAlign: isRTL ? 'right' : 'left' }]}>{t('delete_account')}</Text>
                        {isRTL ? <ChevronLeft size={20} color={COLORS.lightGrey} /> : <ChevronRight size={20} color={COLORS.lightGrey} />}
                    </TouchableOpacity>
                </View>

                <Text style={styles.infoText}>
                    {t('security_info_msg')}
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey
    },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },

    content: { padding: 20 },
    sectionContainer: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        borderWidth: 1,
        borderColor: COLORS.grey,
        overflow: 'hidden',
        ...SHADOWS.small
    },
    row: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    rowText: { flex: 1, fontSize: 17, fontFamily: FONTS.semibold, color: COLORS.black },

    infoText: { marginTop: 40, fontSize: 14, fontFamily: FONTS.medium, color: COLORS.subtext, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 }
});

export default SecurityScreen;
