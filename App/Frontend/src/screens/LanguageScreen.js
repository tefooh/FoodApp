import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';

const LanguageScreen = ({ navigation }) => {
    const { t, isRTL, language, setLanguage } = useLanguage();

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
    ];

    const handleLanguageSelect = (langCode) => {
        setLanguage(langCode);
        // Stack will reset automatically due to key change in App.js
    };

    const LanguageOption = ({ langCode, name, nativeName, isSelected }) => (
        <TouchableOpacity
            style={[styles.languageOption, isSelected && styles.selectedOption]}
            onPress={() => handleLanguageSelect(langCode)}
            activeOpacity={0.7}
        >
            <View style={[styles.optionContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.textContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={styles.languageName}>{name}</Text>
                    <Text style={styles.nativeName}>{nativeName}</Text>
                </View>
                {isSelected && (
                    <View style={styles.checkmarkContainer}>
                        <CheckCircle size={24} color={COLORS.black} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    {isRTL ? <ChevronRight size={22} color={COLORS.black} /> : <ChevronLeft size={22} color={COLORS.black} />}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('language_selection')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.description, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('language_selection_desc')}
                </Text>

                <View style={styles.languagesContainer}>
                    {languages.map((lang) => (
                        <LanguageOption
                            key={lang.code}
                            langCode={lang.code}
                            name={lang.name}
                            nativeName={lang.nativeName}
                            isSelected={language === lang.code}
                        />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.grey,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.black
    },
    content: {
        padding: 25
    },
    description: {
        fontSize: 15,
        fontFamily: FONTS.medium,
        color: COLORS.subtext,
        lineHeight: 22,
        marginBottom: 30
    },
    languagesContainer: {
        gap: 15
    },
    languageOption: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        borderWidth: 1,
        borderColor: COLORS.grey,
        padding: 20,
        ...SHADOWS.small
    },
    selectedOption: {
        borderColor: COLORS.black,
        borderWidth: 2,
        backgroundColor: COLORS.grey
    },
    optionContent: {
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    textContainer: {
        flex: 1
    },
    languageName: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.black,
        marginBottom: 4
    },
    nativeName: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.subtext
    },
    checkmarkContainer: {
        marginLeft: 15,
        marginRight: 15
    }
});

export default LanguageScreen;
