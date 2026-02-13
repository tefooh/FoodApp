import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Alert, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { ChevronLeft, ChevronRight, Check, MapPin, CreditCard, Banknote, ShoppingBag, Truck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CheckoutScreen = ({ navigation }) => {
    const { t, isRTL } = useLanguage();
    const { cart, getCartTotal, clearCart } = useCart();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [street, setStreet] = useState('');
    const [house, setHouse] = useState('');
    const [directions, setDirections] = useState('');
    const [saveInfo, setSaveInfo] = useState(true);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState('cod'); // currently only 'cod'

    const { user } = useAuth();

    // Animation for hold-to-confirm
    const pressProgress = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        if (loading) return;
        Animated.timing(pressProgress, {
            toValue: 1,
            duration: 1500, // 1.5 seconds hold time
            useNativeDriver: false
        }).start(({ finished }) => {
            if (finished) {
                handlePlaceOrder();
            }
        });
    };

    const handlePressOut = () => {
        if (loading) return;
        Animated.timing(pressProgress, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false
        }).start();
    };

    const progressWidth = pressProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    useEffect(() => {
        if (cart.length === 0) {
            navigation.goBack();
            return;
        }

        if (user) {
            setEmail(user.email || '');
            setName(user.displayName || '');

            const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.phone) setPhone(data.phone);
                    if (data.address_street) setStreet(data.address_street);
                    if (data.address_house) setHouse(data.address_house);
                    if (data.address_directions) setDirections(data.address_directions);
                    if (data.firstName || data.lastName) {
                        setName(`${data.firstName || ''} ${data.lastName || ''}`.trim());
                    }
                    if (data.email) setEmail(data.email);
                }
            });
            return unsubscribe;
        }
    }, [user, cart]);

    const handlePlaceOrder = async () => {
        if (!user) {
            Alert.alert(t('error'), t('login_required'));
            return;
        }

        const phoneRegex = /^09[12345]\d{7}$/;
        if (!phoneRegex.test(phone)) {
            Alert.alert(t('error'), t('invalid_phone_error'));
            return;
        }

        if (!name.trim() || !email.trim() || !street.trim() || !house.trim()) {
            Alert.alert(t('error'), t('fill_all_fields'));
            return;
        }

        setLoading(true);
        try {
            // Update user info if saveInfo is checked
            if (saveInfo) {
                const names = name.split(' ');
                const firstName = names[0] || '';
                const lastName = names.slice(1).join(' ') || '';

                await updateDoc(doc(db, 'users', user.uid), {
                    firstName,
                    lastName,
                    phone,
                    address_street: street,
                    address_house: house,
                    address_directions: directions,
                    email
                });
            }

            const fullAddress = `${street}, ${house}${directions ? ', ' + directions : ''}`;

            const orderRef = await addDoc(collection(db, 'orders'), {
                userId: user.uid,
                userName: name,
                userEmail: email,
                userPhone: phone,
                location: fullAddress,
                items: cart,
                status: 'pending',
                paymentMethod: paymentMethod, // Added payment method
                timestamp: serverTimestamp(),
                total: getCartTotal(),
                addressDetails: {
                    street,
                    house,
                    directions
                }
            });

            const currentCart = [...cart];
            clearCart();

            navigation.replace('OrderSummary', {
                orderId: orderRef.id,
                orderData: {
                    userName: name,
                    userPhone: phone,
                    location: fullAddress,
                    items: currentCart,
                    total: getCartTotal()
                }
            });
        } catch (err) {
            Alert.alert(t('error'), err.message);
        } finally {
            setLoading(false);
        }
    };

    const SectionHeader = ({ title, icon: Icon }) => (
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Icon size={20} color={COLORS.black} />
            <Text style={[styles.sectionTitle, { marginHorizontal: 10 }]}>{title}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    {isRTL ? <ChevronRight size={22} color={COLORS.black} /> : <ChevronLeft size={22} color={COLORS.black} />}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('checkout')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 }]}>

                    {/* Order Summary Section */}
                    <View style={styles.sectionCard}>
                        <SectionHeader title={t('order_summary_title')} icon={ShoppingBag} />

                        <View style={styles.summaryContent}>
                            {cart.map((item, index) => (
                                <View key={index} style={[styles.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.qtyBadge, { marginLeft: isRTL ? 10 : 0, marginRight: isRTL ? 0 : 10 }]}>
                                        <Text style={styles.qtyText}>{item.quantity}x</Text>
                                    </View>
                                    <Text style={[styles.itemName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.itemPrice}>{item.price * item.quantity} {t('currency_lyd')}</Text>
                                </View>
                            ))}

                            <View style={styles.divider} />

                            <View style={[styles.totalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <Text style={styles.totalLabel}>{t('total')}</Text>
                                <Text style={styles.totalValue}>{getCartTotal()} {t('currency_lyd')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Delivery Details Section */}
                    <View style={styles.sectionCard}>
                        <SectionHeader title={t('delivery_details_title')} icon={MapPin} />

                        <View style={styles.formGroup}>
                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{t('full_name')}</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t('enter_full_name')}
                                    placeholderTextColor={COLORS.subtext}
                                    style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{t('phone_number')}</Text>
                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder={t('phone_placeholder')}
                                    keyboardType="phone-pad"
                                    placeholderTextColor={COLORS.subtext}
                                    style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                />
                            </View>

                            <View style={styles.coyRow}>
                                <View style={[styles.inputRow, { flex: 1, marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }]}>
                                    <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{t('street_label')}</Text>
                                    <TextInput
                                        value={street}
                                        onChangeText={setStreet}
                                        placeholder={t('street_placeholder')}
                                        placeholderTextColor={COLORS.subtext}
                                        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                    />
                                </View>
                                <View style={[styles.inputRow, { flex: 0.5 }]}>
                                    <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{t('house_label')}</Text>
                                    <TextInput
                                        value={house}
                                        onChangeText={setHouse}
                                        placeholder="#"
                                        placeholderTextColor={COLORS.subtext}
                                        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{t('additional_directions')}</Text>
                                <TextInput
                                    value={directions}
                                    onChangeText={setDirections}
                                    placeholder={t('directions_placeholder')}
                                    multiline
                                    placeholderTextColor={COLORS.subtext}
                                    style={[styles.input, styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveInfoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                activeOpacity={0.8}
                                onPress={() => setSaveInfo(!saveInfo)}
                            >
                                <View style={[styles.checkbox, saveInfo && styles.checkboxActive]}>
                                    {saveInfo && <Check size={14} color={COLORS.white} />}
                                </View>
                                <Text style={[styles.saveInfoText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('save_for_future')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Payment Method Section */}
                    <View style={styles.sectionCard}>
                        <SectionHeader title={t('payment_method')} icon={CreditCard} />

                        <View style={styles.paymentOptionsContainer}>
                            <TouchableOpacity
                                style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionActive, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                onPress={() => setPaymentMethod('cod')}
                                activeOpacity={0.9}
                            >
                                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                                    <View style={[styles.paymentIconContainer, paymentMethod === 'cod' && styles.paymentIconActive]}>
                                        <Banknote size={24} color={paymentMethod === 'cod' ? COLORS.white : COLORS.subtext} />
                                    </View>
                                    <Text style={[styles.paymentOptionText, { marginHorizontal: 15 }]}>{t('cash_on_delivery')}</Text>
                                </View>
                                <View style={[styles.radioOuter, paymentMethod === 'cod' && styles.radioOuterActive]}>
                                    {paymentMethod === 'cod' && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Disclaimer / Info */}
                    <View style={[styles.deliveryInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Truck size={16} color={COLORS.subtext} />
                        <Text style={[styles.deliveryInfoText, { marginHorizontal: 10 }]}>{t('approx_delivery_time')}</Text>
                    </View>


                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={[styles.footerTotal, { flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 15 }]}>
                    <Text style={styles.footerTotalLabel}>{t('total')}</Text>
                    <Text style={styles.footerTotalValue}>{getCartTotal()} {t('currency_lyd')}</Text>
                </View>
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.confirmBtn}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={loading}
                >
                    <LinearGradient colors={COLORS.darkGradient} style={styles.gradientBtn}>
                        <Animated.View style={[styles.progressOverlay, { width: progressWidth }]} />
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.confirmText}>{t('confirm_order')} (Hold)</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
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

    scrollContent: { padding: 20 },

    // Card Styles
    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 20,
        marginBottom: 20,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.grey
    },
    sectionHeader: { alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.grey },
    sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.black },

    // Form Styles
    formGroup: {},
    inputRow: { marginBottom: 15 },
    coyRow: { flexDirection: 'row', justifyContent: 'space-between' },
    inputLabel: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.subtext, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: COLORS.grey,
        borderRadius: 12, // Slightly boxier but still rounded
        padding: 14,
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.black,
        borderWidth: 1,
        borderColor: COLORS.lightGrey
    },
    textArea: { height: 80, textAlignVertical: 'top' },

    saveInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.lightGrey, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
    saveInfoText: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.subtext, flex: 1 },

    // Payment Styles
    paymentOptionsContainer: {},
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: BORDER_RADIUS.card,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.lightGrey
    },
    paymentOptionActive: {
        borderColor: COLORS.black,
        backgroundColor: COLORS.grey
    },
    paymentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.grey,
        justifyContent: 'center',
        alignItems: 'center'
    },
    paymentIconActive: {
        backgroundColor: COLORS.black
    },
    paymentOptionText: { fontSize: 16, fontFamily: FONTS.semibold, color: COLORS.black },

    // Radio Button
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.lightGrey, justifyContent: 'center', alignItems: 'center' },
    radioOuterActive: { borderColor: COLORS.black },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.black },

    // Summary Styles
    summaryContent: {},
    itemRow: { alignItems: 'center', marginBottom: 15 },
    qtyBadge: { backgroundColor: COLORS.grey, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    qtyText: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.black },
    itemName: { flex: 1, fontSize: 15, fontFamily: FONTS.medium, color: COLORS.black, marginHorizontal: 12 },
    itemPrice: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.black },

    divider: { height: 1, backgroundColor: COLORS.grey, marginVertical: 15 },
    totalRow: { justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 16, fontFamily: FONTS.medium, color: COLORS.subtext },
    totalValue: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.black },

    deliveryInfo: { justifyContent: 'center', alignItems: 'center', marginTop: -5, paddingBottom: 10 },
    deliveryInfoText: { fontSize: 13, color: COLORS.subtext, fontFamily: FONTS.medium },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.grey,
        ...SHADOWS.medium
    },
    footerTotal: { justifyContent: 'space-between', alignItems: 'center' },
    footerTotalLabel: { fontSize: 16, fontFamily: FONTS.medium, color: COLORS.subtext },
    footerTotalValue: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.black },
    confirmBtn: { height: 56, borderRadius: BORDER_RADIUS.button, overflow: 'hidden' },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    confirmText: { color: COLORS.white, fontSize: 18, fontFamily: FONTS.bold, zIndex: 2 },
    progressOverlay: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        zIndex: 1
    }
});

export default CheckoutScreen;
