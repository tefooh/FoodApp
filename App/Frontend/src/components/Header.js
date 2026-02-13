import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, BORDER_RADIUS } from '../theme/Theme';
import { ShoppingCart } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

const Header = ({ title, type = 'text', navigation, onCartPress, showCart = false }) => {
    const { isRTL, t } = useLanguage();
    const { cart } = useCart();

    return (
        <View style={styles.headerContainer}>
            <View style={[styles.headerContent, { flexDirection: 'row' }]}>
                <View style={styles.leftContainer}>
                    {type === 'logo' ? (
                        <Image
                            source={require('../../assets/blackRawTextLogo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={styles.title}>{title}</Text>
                    )}
                </View>

                <View style={styles.rightContainer}>
                    {showCart && (
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={onCartPress}
                            activeOpacity={0.7}
                        >
                            <ShoppingCart size={20} color={COLORS.black} />
                            {cart.length > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{cart.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: COLORS.white,
    },
    headerContent: {
        height: 56,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 30,
    },
    title: {
        fontSize: 26,
        fontFamily: FONTS.bold,
        color: COLORS.black,
        marginStart: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.grey,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: COLORS.black,
        borderRadius: 7,
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.white,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 8,
        fontFamily: FONTS.bold,
    }
});

export default Header;
