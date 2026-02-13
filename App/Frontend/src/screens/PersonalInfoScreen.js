import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, editable = true, isRTL }) => (
    <View style={styles.inputWrapper}>
        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
        <TextInput
            style={[
                styles.input,
                multiline && styles.multilineInput,
                !editable && styles.disabledInput,
                { textAlign: isRTL ? 'right' : 'left' }
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.subtext}
            keyboardType={keyboardType}
            multiline={multiline}
            editable={editable}
        />
    </View>
);

const PersonalInfoScreen = ({ navigation }) => {
    const { t, isRTL } = useLanguage();
    const { user } = useAuth();
    const [name, setName] = useState(user?.displayName || '');
    const [phone, setPhone] = useState('');
    const [street, setStreet] = useState('');
    const [house, setHouse] = useState('');
    const [directions, setDirections] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigation.goBack();
            return;
        }
        const fetchUserData = async () => {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setPhone(data.phone || '');
                setStreet(data.address_street || '');
                setHouse(data.address_house || '');
                setDirections(data.address_directions || '');
                setDirections(data.address_directions || '');
            }
        };
        fetchUserData();
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('error'), t('name_empty_error'));
            return;
        }

        // Libyan Phone Validation
        const phoneRegex = /^09[12345]\d{7}$/;
        if (!phoneRegex.test(phone)) {
            Alert.alert(t('error'), t('invalid_phone_error'));
            return;
        }

        if (!street.trim() || !house.trim()) {
            Alert.alert(t('error'), t('fill_all_fields'));
            return;
        }

        setLoading(true);
        try {
            await updateProfile(user, { displayName: name });
            const [firstName, ...lastNameParts] = name.split(' ');
            const lastName = lastNameParts.join(' ');

            await setDoc(doc(db, 'users', user.uid), {
                phone,
                address_street: street,
                address_house: house,
                address_directions: directions,
                address_directions: directions,
                email: user.email,
                firstName: firstName || '',
                lastName: lastName || '',
                // Keep the old address field for backward compatibility if needed, though it's better to migrate
                address: `${street}, ${house}`
            }, { merge: true });

            Alert.alert(t('success'), t('profile_updated_success'));
            navigation.goBack();
        } catch (err) {
            Alert.alert(t('error'), err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    {isRTL ? <ChevronRight size={22} color={COLORS.black} /> : <ChevronLeft size={22} color={COLORS.black} />}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('personal_info')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.sectionCard}>
                    <InputField
                        label={t('full_name')}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('enter_full_name')}
                        isRTL={isRTL}
                    />
                    <InputField
                        label={t('email_label')}
                        value={user.email}
                        placeholder={t('email_label')}
                        editable={false}
                        isRTL={isRTL}
                    />
                    <InputField
                        label={t('phone_number')}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder={t('phone_placeholder_eg')}
                        keyboardType="phone-pad"
                        isRTL={isRTL}
                    />

                    <View style={styles.divider} />
                    <Text style={[styles.sectionSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('delivery_address')}</Text>

                    <InputField
                        label={t('street_label')}
                        value={street}
                        onChangeText={setStreet}
                        placeholder={t('street_placeholder')}
                        isRTL={isRTL}
                    />
                    <InputField
                        label={t('house_label')}
                        value={house}
                        onChangeText={setHouse}
                        placeholder={t('house_placeholder')}
                        isRTL={isRTL}
                    />
                    <InputField
                        label={t('additional_directions')}
                        value={directions}
                        onChangeText={setDirections}
                        placeholder={t('directions_placeholder')}
                        multiline
                        isRTL={isRTL}
                    />
                </View>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <LinearGradient colors={COLORS.darkGradient} style={styles.gradientBtn}>
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveBtnText}>{t('save_changes')}</Text>
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
    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 25,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.grey,
        marginBottom: 20
    },
    sectionSubtitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.black, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
    divider: { height: 1, backgroundColor: COLORS.grey, marginVertical: 20 },
    inputWrapper: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.subtext, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
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
    multilineInput: { height: 100, textAlignVertical: 'top' },
    disabledInput: { color: COLORS.subtext, opacity: 0.7, backgroundColor: COLORS.grey },

    saveBtn: { height: 58, borderRadius: BORDER_RADIUS.button, overflow: 'hidden' },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontSize: 18, fontFamily: FONTS.bold }
});

export default PersonalInfoScreen;
