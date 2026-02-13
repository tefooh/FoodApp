import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { Headphones, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ContactSupportScreen = ({ navigation }) => {
    const { t, isRTL } = useLanguage();
    const { user } = useAuth();

    React.useEffect(() => {
        if (!user) {
            navigation.goBack();
        }
    }, [user]);

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!subject.trim() || !message.trim()) {
            Alert.alert(t('error'), t('fill_all_fields'));
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'tickets'), {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || user.email,
                subject,
                message,
                status: 'open',
                timestamp: serverTimestamp()
            });
            Alert.alert(t('success'), t('ticket_submitted_success'));
            navigation.goBack();
        } catch (err) {
            Alert.alert(t('error'), err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    {isRTL ? <ChevronRight size={22} color={COLORS.black} /> : <ChevronLeft size={22} color={COLORS.black} />}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('contact_support')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoSection}>
                    <View style={styles.iconCircle}>
                        <Headphones size={32} color={COLORS.black} />
                    </View>
                    <Text style={styles.infoTitle}>{t('how_can_we_help')}</Text>
                    <Text style={styles.infoSubtitle}>{t('support_description_full')}</Text>
                </View>


                <View style={styles.formCard}>
                    <View style={styles.inputWrapper}>
                        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t('subject')}</Text>
                        <TextInput
                            style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                            value={subject}
                            onChangeText={setSubject}
                            placeholder={t('subject_regarding')}
                            placeholderTextColor={COLORS.subtext}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t('message')}</Text>
                        <TextInput
                            style={[styles.input, styles.messageInput, { textAlign: isRTL ? 'right' : 'left' }]}
                            value={message}
                            onChangeText={setMessage}
                            placeholder={t('message_explain')}
                            placeholderTextColor={COLORS.subtext}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <LinearGradient colors={COLORS.darkGradient} style={styles.gradientBtn}>
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitBtnText}>{t('send_message')}</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
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

    scrollContent: { padding: 20 },
    infoSection: { alignItems: 'center', marginVertical: 35 },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.grey,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    infoTitle: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.black },
    infoSubtitle: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: 12, paddingHorizontal: 30, lineHeight: 22 },

    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 25,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.grey,
        marginBottom: 25
    },
    inputWrapper: { marginBottom: 25 },
    inputLabel: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.black, marginBottom: 10, marginStart: 5 },
    input: {
        backgroundColor: COLORS.grey,
        borderRadius: BORDER_RADIUS.container,
        padding: Platform.OS === 'ios' ? 18 : 15,
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.black,
        borderWidth: 1,
        borderColor: COLORS.lightGrey
    },
    messageInput: { height: 160 },

    submitBtn: { height: 58, borderRadius: BORDER_RADIUS.button, overflow: 'hidden' },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: COLORS.white, fontSize: 18, fontFamily: FONTS.bold }
});

export default ContactSupportScreen;
