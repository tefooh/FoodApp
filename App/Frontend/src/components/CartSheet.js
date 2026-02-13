import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, Image, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { X, ShoppingBag, Minus, Trash2, Plus, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

const CartSheet = ({ visible, onClose }) => {
    const { t, isRTL } = useLanguage();
    const { cart, getCartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
    const navigation = useNavigation();

    const [showModal, setShowModal] = useState(visible);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            setShowModal(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    damping: 20,
                    stiffness: 90,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true
                }),
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start(({ finished }) => {
                if (finished) setShowModal(false);
            });
        }
    }, [visible]);

    const handleCheckout = () => {
        onClose();
        navigation.navigate('Checkout');
    };

    return (
        <Modal
            visible={showModal}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
                </Animated.View>

                <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    {/* Header: Middle centered title, one X button */}
                    <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={{ width: 44 }} />
                        <Text style={styles.title}>{t('cart_title')}</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <X size={22} color={COLORS.black} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {cart.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconCircle}>
                                    <ShoppingBag size={40} color={COLORS.black} />
                                </View>
                                <Text style={styles.emptyTitle}>{t('empty_cart')}</Text>
                                <Text style={styles.emptySubtitle}>{t('empty_cart_msg')}</Text>
                            </View>
                        ) : (
                            cart.map((item, index) => (
                                <View key={index} style={[styles.itemCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.itemInfo}>
                                        <Text style={[styles.itemName, { textAlign: isRTL ? 'right' : 'left' }]}>{item.name}</Text>
                                        <Text style={[styles.itemPrice, { textAlign: isRTL ? 'right' : 'left' }]}>{item.price} {t('currency_lyd')}</Text>

                                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                            <View style={{ marginTop: 5 }}>
                                                {Object.entries(item.selectedOptions).map(([key, val]) => (
                                                    <Text key={key} style={[styles.optionText, { textAlign: isRTL ? 'right' : 'left' }]}>{key}: {val}</Text>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    <View style={[styles.qtyControls, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                                        >
                                            {item.quantity > 1 ? <Minus size={18} color={COLORS.black} /> : <Trash2 size={18} color={COLORS.black} />}
                                        </TouchableOpacity>

                                        <Text style={styles.qtyText}>{item.quantity}</Text>

                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus size={18} color={COLORS.black} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {cart.length > 0 && (
                        <View style={styles.footer}>
                            <View style={[styles.totalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <Text style={styles.totalLabel}>{t('total')}</Text>
                                <Text style={styles.totalAmount}>{getCartTotal()} {t('currency_lyd')}</Text>
                            </View>

                            <TouchableOpacity activeOpacity={0.9} onPress={handleCheckout}>
                                <LinearGradient
                                    colors={COLORS.darkGradient}
                                    style={styles.checkoutBtn}
                                >
                                    <Text style={styles.checkoutText}>{t('checkout')}</Text>
                                    <ArrowRight size={20} color={COLORS.white} style={{ marginLeft: 10 }} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: {
        backgroundColor: COLORS.white,
        height: height * 0.9,
        borderTopLeftRadius: BORDER_RADIUS.sheet,
        borderTopRightRadius: BORDER_RADIUS.sheet,
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey
    },
    title: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' },

    scrollContent: { padding: 20 },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.black },
    emptySubtitle: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: 10, paddingHorizontal: 40 },

    itemCard: {
        backgroundColor: COLORS.white,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontFamily: FONTS.semibold, color: COLORS.black },
    itemPrice: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.black, marginTop: 4 },
    optionText: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 2 },

    qtyControls: {
        backgroundColor: COLORS.grey,
        borderRadius: BORDER_RADIUS.button,
        padding: 5,
        alignItems: 'center',
        marginLeft: 15
    },
    qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
    qtyText: { fontSize: 15, fontFamily: FONTS.bold, marginHorizontal: 15, minWidth: 20, textAlign: 'center' },

    footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.grey },
    totalRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    totalLabel: { fontSize: 16, fontFamily: FONTS.medium, color: COLORS.subtext },
    totalAmount: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.black },
    checkoutBtn: {
        height: 58,
        borderRadius: BORDER_RADIUS.button,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkoutText: { color: COLORS.white, fontSize: 17, fontFamily: FONTS.bold }
});

export default CartSheet;
