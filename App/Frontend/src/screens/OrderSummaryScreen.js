import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { X, Check, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { OrderSummarySkeleton } from '../components/SkeletonLoader';

const { width } = Dimensions.get('window');

const OrderSummaryScreen = ({ route, navigation }) => {
    const { t, isRTL } = useLanguage();
    const { orderId, orderData: initialOrderData } = route.params || {};
    const [orderData, setOrderData] = useState(initialOrderData || null);
    const [loading, setLoading] = useState(!initialOrderData);

    useEffect(() => {
        if (!orderData) {
            if (orderId) {
                const fetchOrder = async () => {
                    try {
                        const docSnap = await getDoc(doc(db, 'orders', orderId));
                        if (docSnap.exists()) {
                            setOrderData(docSnap.data());
                        }
                    } catch (err) {
                        console.error("Error fetching order:", err);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchOrder();
            } else {
                setLoading(false);
            }
        }
    }, [orderId]);

    const estimatedTime = new Date(Date.now() + 35 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <OrderSummarySkeleton />
            </SafeAreaView>
        );
    }

    if (!orderData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={{ width: 44 }} />
                    <Text style={styles.headerTitle}>{t('error')}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <X size={24} color={COLORS.black} />
                    </TouchableOpacity>
                </View>
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>{t('no_order_data')}</Text>
                    <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.trackBtnText}>{t('go_back')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header: Middle centered title, one X button */}
            <View style={styles.header}>
                <View style={{ width: 44 }} />
                <Text style={styles.headerTitle}>{t('order_summary')}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <X size={22} color={COLORS.black} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Success Animation Area */}
                <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.successSection}
                >
                    <View style={styles.checkmarkIconBox}>
                        <Check size={40} color={COLORS.white} />
                    </View>
                    <Text style={styles.successTitle}>{t('order_placed_success')}</Text>
                    <Text style={styles.orderIdText}>Order #{orderId?.slice(-6).toUpperCase() || 'N/A'}</Text>
                </MotiView>

                {/* Info Cards */}
                <View style={styles.card}>
                    <View style={[styles.cardRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={styles.iconContainer}>
                            <Clock size={22} color={COLORS.black} />
                        </View>
                        <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={styles.infoLabel}>{t('estimated_delivery')}</Text>
                            <Text style={styles.infoValue}>{estimatedTime}</Text>
                            <Text style={styles.infoSubText}>{t('approx_delivery_time')}</Text>
                        </View>
                    </View>
                </View>

                {/* Items List */}
                <View style={styles.card}>
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('order_items')}</Text>
                    {orderData.items?.map((item, index) => (
                        <View key={index} style={[styles.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={styles.itemQty}>{item.quantity}x</Text>
                            <Text style={[styles.itemName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.itemPrice}>{item.price * item.quantity} {t('currency_lyd')}</Text>
                        </View>
                    ))}

                    <View style={styles.divider} />

                    <View style={[styles.totalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.totalLabel}>{t('total')}</Text>
                        <Text style={styles.totalValue}>{orderData.total} {t('currency_lyd')}</Text>
                    </View>
                </View>

                {/* Delivery Details */}
                <View style={styles.card}>
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('delivery_details')}</Text>
                    <View style={[styles.detailItem, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.detailLabel}>{t('name')}</Text>
                        <Text style={styles.detailValue}>{orderData.userName}</Text>
                    </View>
                    <View style={[styles.detailItem, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.detailLabel}>{t('phone_number')}</Text>
                        <Text style={styles.detailValue}>{orderData.userPhone}</Text>
                    </View>
                    <View style={[styles.detailItem, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.detailLabel}>{t('delivery_address')}</Text>
                        <Text style={styles.detailValue} numberOfLines={2}>{orderData.location}</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.mainBtn}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{
                                    name: 'Main',
                                    state: {
                                        routes: [{ name: 'Home' }]
                                    }
                                }]
                            })
                        );
                    }}
                >
                    <LinearGradient colors={COLORS.darkGradient} style={styles.gradientBtn}>
                        <Text style={styles.mainBtnText}>{t('continue_shopping')}</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey
    },
    headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' },

    scrollContent: { padding: 20 },
    successSection: { alignItems: 'center', marginVertical: 30 },
    checkmarkIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium
    },
    successTitle: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.black, marginTop: 20 },
    orderIdText: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 5 },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 20,
        marginBottom: 20,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.grey
    },
    cardRow: { alignItems: 'center' },
    iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' },
    infoContent: { flex: 1, marginLeft: 15 },
    infoLabel: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.subtext },
    infoValue: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.black, marginTop: 2 },
    infoSubText: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 2 },

    sectionTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black, marginBottom: 15 },
    itemRow: { alignItems: 'center', marginBottom: 12 },
    itemQty: { width: 35, fontSize: 15, fontFamily: FONTS.bold, color: COLORS.black },
    itemName: { flex: 1, fontSize: 15, fontFamily: FONTS.medium, color: COLORS.black, marginHorizontal: 10 },
    itemPrice: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.black },

    divider: { height: 1, backgroundColor: COLORS.grey, marginVertical: 15 },
    totalRow: { justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },
    totalValue: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.black },

    detailItem: { marginBottom: 15, width: '100%' },
    detailLabel: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.subtext, textTransform: 'uppercase', letterSpacing: 0.8 },
    detailValue: { fontSize: 16, fontFamily: FONTS.medium, color: COLORS.black, marginTop: 4 },

    footer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 0 : 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.grey
    },
    mainBtn: { height: 58, borderRadius: BORDER_RADIUS.button, overflow: 'hidden' },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mainBtnText: { color: COLORS.white, fontSize: 17, fontFamily: FONTS.bold },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { fontSize: 16, fontFamily: FONTS.medium, color: COLORS.subtext, marginBottom: 20 },
    trackBtn: { padding: 18, backgroundColor: COLORS.black, borderRadius: BORDER_RADIUS.button, width: '100%', alignItems: 'center' },
    trackBtnText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 16 }
});

export default OrderSummaryScreen;
