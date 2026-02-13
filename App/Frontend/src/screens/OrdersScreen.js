import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { ChevronLeft, ChevronRight, Lock, ShoppingBag, ArrowRight, ArrowLeft, RotateCw } from 'lucide-react-native';
import { MotiView } from 'moti';
import Header from '../components/Header';
import CartSheet from '../components/CartSheet';

const { width } = Dimensions.get('window');

const OrdersScreen = ({ navigation }) => {
    const { t, isRTL } = useLanguage();
    const { cart, addToCart, getCartTotal } = useCart();
    const { user, isGuest } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            setOrders([]);
            return;
        }
        const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [user]);

    const handleReorder = (order) => {
        order.items.forEach(item => {
            addToCart(item);
        });
        setIsCartSheetOpen(true);
    };

    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('OrderSummary', { orderId: item.id })}
        >
            <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View>
                    <Text style={[styles.orderIdText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('order_number_prefix')}{item.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{item.timestamp?.toDate().toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? COLORS.green + '15' : COLORS.grey }]}>
                    <Text style={[styles.statusText, { color: item.status === 'completed' ? COLORS.green : COLORS.black }]}>
                        {item.status?.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.orderPreview}>
                <Text style={styles.previewText} numberOfLines={1}>
                    {item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                    <Text style={styles.totalLabel}>{t('total')}</Text>
                    <Text style={styles.totalValue}>{item.total} {t('currency_lyd')}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.reorderBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => handleReorder(item)}
                >
                    <RotateCw size={16} color={COLORS.black} style={{ [isRTL ? 'marginLeft' : 'marginRight']: 6 }} />
                    <Text style={styles.reorderText}>{t('reorder')}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                title={t('orders')}
                onCartPress={() => setIsCartSheetOpen(true)}
            />

            {isGuest ? (
                <View style={styles.centered}>
                    <View style={styles.promptCard}>
                        <View style={styles.iconCircle}>
                            <Lock size={40} color={COLORS.black} />
                        </View>
                        <Text style={styles.promptTitle}>{t('please_login_orders')}</Text>
                        <Text style={styles.promptSubtitle}>{t('login_orders_msg')}</Text>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => navigation.navigate('Auth')}
                        >
                            <Text style={styles.primaryBtnText}>{t('login_now_btn')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <FlatList
                    key={isRTL ? 'rtl-orders' : 'ltr-orders'}
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={5}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.iconCircle}>
                                <ShoppingBag size={40} color={COLORS.black} />
                            </View>
                            <Text style={styles.emptyTitle}>{t('no_orders_yet')}</Text>
                            <Text style={styles.emptySubtitle}>{t('orders_appear_here')}</Text>
                        </View>
                    }
                />
            )}

            {/* Floating Cart Bar */}
            {cart.length > 0 && (
                <MotiView
                    from={{ translateY: 100, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.floatingCart}
                >
                    <TouchableOpacity
                        style={styles.cartContent}
                        onPress={() => setIsCartSheetOpen(true)}
                        activeOpacity={0.9}
                    >
                        <View>
                            <Text style={[styles.cartTotalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{cart.length} {t('items_count_label')}</Text>
                            <Text style={[styles.cartTotalPrice, { textAlign: isRTL ? 'right' : 'left' }]}>{getCartTotal()} {t('currency_lyd')}</Text>
                        </View>
                        <View style={[styles.viewCartBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={[styles.viewCartText, { marginRight: isRTL ? 0 : 5, marginLeft: isRTL ? 5 : 0 }]}>{t('view_cart')}</Text>
                            {isRTL ? <ArrowLeft size={18} color={COLORS.black} /> : <ArrowRight size={18} color={COLORS.black} />}
                        </View>
                    </TouchableOpacity>
                </MotiView>
            )}

            <CartSheet visible={isCartSheetOpen} onClose={() => setIsCartSheetOpen(false)} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    listContent: { padding: 20, paddingBottom: 100 },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 20,
        marginBottom: 20,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.grey
    },
    cardHeader: { justifyContent: 'space-between', alignItems: 'flex-start' },
    orderIdText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.black },
    orderDate: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 4 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    statusText: { fontSize: 11, fontFamily: FONTS.bold },

    orderPreview: { marginTop: 15 },
    previewText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.subtext },

    cardDivider: { height: 1, backgroundColor: COLORS.grey, marginVertical: 15 },
    cardFooter: { justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.subtext, marginRight: 10 },
    totalValue: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    promptCard: { alignItems: 'center', width: '100%' },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.grey,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    promptTitle: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.black, textAlign: 'center' },
    promptSubtitle: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: 10, marginBottom: 30 },
    primaryBtn: { backgroundColor: COLORS.black, paddingVertical: 18, paddingHorizontal: 40, borderRadius: BORDER_RADIUS.button, width: '100%', alignItems: 'center' },
    primaryBtnText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 16 },

    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.black, marginTop: 20 },
    emptySubtitle: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: 10 },

    floatingCart: { position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 100 },
    cartContent: {
        backgroundColor: COLORS.black,
        borderRadius: BORDER_RADIUS.container,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.medium
    },
    cartTotalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: FONTS.bold },
    cartTotalPrice: { color: COLORS.white, fontSize: 18, fontFamily: FONTS.bold },
    viewCartBtn: {
        backgroundColor: COLORS.white,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: BORDER_RADIUS.button,
        flexDirection: 'row',
        alignItems: 'center'
    },
    viewCartText: { color: COLORS.black, fontFamily: FONTS.bold, fontSize: 14, marginRight: 5 },

    reorderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: COLORS.grey,
        borderRadius: BORDER_RADIUS.button,
        borderWidth: 1,
        borderColor: COLORS.lightGrey
    },
    reorderText: {
        fontSize: 13,
        fontFamily: FONTS.bold,
        color: COLORS.black
    }
});

export default OrdersScreen;
