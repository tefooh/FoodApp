import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const AboutScreen = ({ navigation }) => {
    const { t, isRTL } = useLanguage();

    const AboutRow = ({ label, onPress }) => (
        <TouchableOpacity style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={onPress} activeOpacity={0.7}>
            <Text style={[styles.rowText, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
            {isRTL ? <ChevronLeft size={22} color={COLORS.black} /> : <ChevronRight size={22} color={COLORS.black} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    {isRTL ? <ChevronRight size={22} color={COLORS.black} /> : <ChevronLeft size={22} color={COLORS.black} />}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('about_the_app')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.logoSection}>
                    <Image
                        source={require('../../assets/blackRawTextLogo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>

                <View style={styles.sectionContainer}>
                    <AboutRow label={t('privacy_policy')} onPress={() => navigation.navigate('PrivacyPolicy')} />
                    <View style={styles.divider} />
                    <AboutRow label={t('terms_of_service')} onPress={() => navigation.navigate('TermsOfService')} />
                </View>

                <View style={styles.descriptionCard}>
                    <Text style={[styles.descriptionText, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('about_description')}
                    </Text>
                </View>

                <View style={[styles.descriptionCard, { marginTop: 20 }]}>
                    <Text style={[styles.descriptionText, { textAlign: 'center', fontSize: 13 }]}>
                        {t('copyright')}
                    </Text>
                </View>
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

    content: { padding: 25 },
    logoSection: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
    logoImage: {
        width: 200,
        height: 80,
        marginBottom: 15
    },
    version: { marginTop: 8, fontSize: 14, fontFamily: FONTS.medium, color: COLORS.subtext },

    sectionContainer: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        borderWidth: 1,
        borderColor: COLORS.grey,
        overflow: 'hidden',
        ...SHADOWS.small,
        marginBottom: 30
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    rowText: { flex: 1, fontSize: 16, fontFamily: FONTS.semibold, color: COLORS.black },
    divider: { height: 1, backgroundColor: COLORS.grey, marginHorizontal: 20 },

    descriptionCard: {
        backgroundColor: COLORS.grey,
        borderRadius: BORDER_RADIUS.container,
        padding: 25,
        borderWidth: 1,
        borderColor: COLORS.lightGrey
    },
    descriptionText: {
        fontSize: 15,
        fontFamily: FONTS.medium,
        color: COLORS.subtext,
        lineHeight: 24
    }
});

export default AboutScreen;
