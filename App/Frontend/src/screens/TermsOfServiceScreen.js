import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const TermsOfServiceScreen = ({ navigation }) => {
    const { t, isRTL } = useLanguage();

    const Section = ({ title, content }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
            <Text style={[styles.paragraph, { textAlign: isRTL ? 'right' : 'left' }]}>{content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    {isRTL ? <ChevronRight size={22} color={COLORS.black} /> : <ChevronLeft size={22} color={COLORS.black} />}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('terms_of_service')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introSection}>
                    <Text style={[styles.mainTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('terms_of_service')}</Text>
                    <Text style={[styles.dateText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('last_updated')}: {t('last_updated_value')}</Text>
                </View>

                <View style={styles.contentCard}>
                    <Section
                        title={t('terms_sec_1_title')}
                        content={t('terms_sec_1_content')}
                    />
                    <View style={styles.divider} />
                    <Section
                        title={t('terms_sec_2_title')}
                        content={t('terms_sec_2_content')}
                    />
                    <View style={styles.divider} />
                    <Section
                        title={t('terms_sec_3_title')}
                        content={t('terms_sec_3_content')}
                    />
                    <View style={styles.divider} />
                    <Section
                        title={t('terms_sec_4_title')}
                        content={t('terms_sec_4_content')}
                    />
                    <View style={styles.divider} />
                    <Section
                        title={t('terms_sec_5_title')}
                        content={t('terms_sec_5_content')}
                    />
                    <View style={styles.divider} />
                    <Section
                        title={t('terms_sec_6_title')}
                        content={t('terms_sec_6_content')}
                    />
                    <View style={styles.divider} />
                    <Section
                        title={t('terms_sec_7_title')}
                        content={t('terms_sec_7_content')}
                    />
                    <View style={styles.divider} />
                    <Section
                        title={t('terms_sec_8_title')}
                        content={t('terms_sec_8_content')}
                    />
                </View>

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
    introSection: { marginBottom: 30, paddingHorizontal: 10 },
    mainTitle: { fontSize: 28, fontFamily: FONTS.bold, color: COLORS.black },
    dateText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 8 },

    contentCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 25,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.grey
    },
    section: { paddingVertical: 10 },
    sectionTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black, marginBottom: 10 },
    paragraph: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.subtext, lineHeight: 24 },
    divider: { height: 1, backgroundColor: COLORS.grey, marginVertical: 15 }
});

export default TermsOfServiceScreen;
