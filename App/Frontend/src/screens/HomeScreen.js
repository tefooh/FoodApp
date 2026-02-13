import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Image,
    Platform,
    Modal,
    Animated
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { Pill, Plus, Search, ArrowRight, ArrowLeft, X, ChevronRight, ChevronLeft } from 'lucide-react-native';

import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import CartSheet from '../components/CartSheet';
import PromotionOfferSheet from '../components/PromotionOfferSheet';
import Header from '../components/Header';

import { ProductCardSkeleton } from '../components/SkeletonLoader';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { t, isRTL } = useLanguage();
    const { cart, addToCart, getCartTotal } = useCart();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [promotions, setPromotions] = useState([]);
    const [loadingPromos, setLoadingPromos] = useState(true);
    const [orders, setOrders] = useState([]);
    const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const promoListRef = useRef(null);
    const [promoIndex, setPromoIndex] = useState(0);
    const [activePromoPopup, setActivePromoPopup] = useState(null);

    // Search Modal Animation State
    const [modalVisible, setModalVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

    useEffect(() => {
        if (isSearchOpen) {
            setModalVisible(true);
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
                    toValue: Dimensions.get('window').height,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start(({ finished }) => {
                if (finished) setModalVisible(false);
            });
        }
    }, [isSearchOpen]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
            const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(allProducts);

            // Randomize featured items - 2 items only
            const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
            setFeaturedProducts(shuffled.slice(0, 2));

            setLoadingProducts(false);
        });

        const unsubscribePromotions = onSnapshot(collection(db, 'promotions'), (snapshot) => {
            setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingPromos(false);
        });

        return () => {
            unsubscribe();
            unsubscribePromotions();
        };
    }, []);

    // Stabilized auto-swipe interval
    useEffect(() => {
        if (promotions.length <= 1) return;

        const interval = setInterval(() => {
            if (promoListRef.current) {
                setPromoIndex(prev => {
                    const nextIndex = (prev + 1) % promotions.length;
                    promoListRef.current.scrollToIndex({ index: nextIndex, animated: true });
                    return nextIndex;
                });
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [promotions.length]);

    useEffect(() => {
        const checkPromotions = async () => {
            if (promotions.length === 0) return;

            // Sort by createdAt desc (handling missing timestamps for old data)
            const sorted = [...promotions].sort((a, b) => {
                const tA = a.createdAt?.seconds || 0;
                const tB = b.createdAt?.seconds || 0;
                return tB - tA;
            });

            const latest = sorted[0];
            if (!latest) return;

            try {
                // If the user already saw this specific promotion ID, don't show it
                const hasSeen = await AsyncStorage.getItem(`seen_promo_${latest.id}`);
                // Also ensures we don't popup if it is explicitly inactive
                if (!hasSeen && latest.active !== false) {
                    setActivePromoPopup(latest);
                }
            } catch (e) {
                console.error("Error checking promo seen status", e);
            }
        };

        checkPromotions();
    }, [promotions]);

    const handleClosePromo = async () => {
        if (activePromoPopup) {
            try {
                await AsyncStorage.setItem(`seen_promo_${activePromoPopup.id}`, 'true');
            } catch (e) { console.error(e); }
            setActivePromoPopup(null);
        }
    };

    const handlePromoAction = (promo) => {
        handleClosePromo();
        if (promo.linkedProductIds && promo.linkedProductIds.length > 0) {
            const product = products.find(p => p.id === promo.linkedProductIds[0]);
            navigation.navigate('ProductDetail', { product, productId: promo.linkedProductIds[0] });
        }
    };

    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, 'orders'),
                where('userId', '==', user.uid),
                orderBy('timestamp', 'desc')
            );
            const unsubscribeOrders = onSnapshot(q, (snapshot) => {
                setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubscribeOrders();
        } else {
            setOrders([]);
        }
    }, [user]);

    const activeOrder = orders.find(o => o.status !== 'completed' && o.status !== 'cancelled') || orders[0];

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
        >

            {
                item.image ? (
                    <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.productImage, { backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' }]}>
                        <Pill size={40} color={COLORS.subtext} />
                    </View>
                )
            }
            <View style={styles.productInfo}>
                <Text style={[styles.productName, { textAlign: 'left' }]} numberOfLines={1}>{item.name}</Text>
                <View style={[styles.priceRow, { flexDirection: 'row' }]}>
                    <Text style={styles.productPrice}>{item.price} {t('currency_lyd')}</Text>
                    <TouchableOpacity style={styles.addButtonMini} onPress={() => addToCart(item)}>
                        <Plus size={16} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity >
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                type="logo"
                onCartPress={() => setIsCartSheetOpen(true)}
                showCart={true}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.headerSearchArea}>
                    <TouchableOpacity
                        style={[styles.searchBar, { flexDirection: 'row' }]}
                        activeOpacity={0.8}
                        onPress={() => setIsSearchOpen(true)}
                    >
                        <Search size={20} color={COLORS.subtext} />
                        <Text style={[styles.searchText, { marginLeft: 10, textAlign: 'left' }]}>
                            {t('search_placeholder')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Login Prompt - Moved Here */}
                {!user && (
                    <View style={styles.loginPrompt}>
                        <Text style={styles.loginTitle}>{t('welcome_message')}</Text>
                        <Text style={styles.loginSubtitle}>{t('login_track_msg')}</Text>
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Auth')}>
                            <Text style={styles.primaryBtnText}>{t('login_signup_btn')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Promotions Slider */}
                {promotions.length > 0 && (
                    <View style={styles.section}>
                        <FlatList
                            ref={promoListRef}
                            key={isRTL ? 'rtl-promos' : 'ltr-promos'}
                            data={promotions}
                            horizontal
                            inverted={isRTL}
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id}
                            onMomentumScrollEnd={(event) => {
                                const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
                                setPromoIndex(index);
                            }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.promoCard}
                                    activeOpacity={0.9}
                                    onPress={() => setActivePromoPopup(item)}
                                >
                                    <Image source={{ uri: item.image }} style={styles.promoBg} />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                                        style={styles.promoGradient}
                                    >
                                        <Text style={[styles.promoTitle, { textAlign: 'left', writingDirection: 'ltr' }]}>{item.title}</Text>
                                        <Text style={[styles.promoSubtitle, { textAlign: 'left', writingDirection: 'ltr' }]}>{item.price} {t('currency_lyd')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                        />
                    </View>
                )}

                {/* Active Orders */}
                {user ? (
                    activeOrder && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { textAlign: 'left' }]}>{t('active_orders')}</Text>
                            <TouchableOpacity
                                style={styles.orderContainer}
                                activeOpacity={0.9}
                                onPress={() => navigation.navigate('OrderSummary', { orderId: activeOrder.id })}
                            >
                                <View style={[styles.orderHeader, { flexDirection: 'row' }]}>
                                    <View>
                                        <Text style={[styles.orderId, { textAlign: 'left' }]}>{t('order_number_prefix')}{activeOrder.id.slice(-4)}</Text>
                                        <Text style={[styles.orderStatus, { textAlign: 'left' }]}>{activeOrder.status?.toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.reorderBtn}>
                                        <Text style={styles.reorderText}>{t('reorder_details')}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )
                )
                    : null}

                {/* Featured Items */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { textAlign: 'left' }]}>{t('featured_items')}</Text>
                    <FlatList
                        key={isRTL ? 'rtl-featured' : 'ltr-featured'}
                        data={featuredProducts}
                        renderItem={renderProduct}
                        keyExtractor={item => item.id}
                        numColumns={1}
                        scrollEnabled={false}
                        ListEmptyComponent={
                            loadingProducts ? (
                                <View>
                                    {[1, 2].map((_, i) => (
                                        <View key={i} style={{ width: width - 40, marginBottom: 20 }}>
                                            <ProductCardSkeleton />
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ fontFamily: FONTS.medium, color: COLORS.subtext }}>{t('no_items_found')}</Text>
                                </View>
                            )
                        }
                        initialNumToRender={4}
                        maxToRenderPerBatch={4}
                        windowSize={3}
                        removeClippedSubviews={Platform.OS === 'android'}
                    />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Cart Bar (Premium Look) */}
            {
                cart.length > 0 && !isCartSheetOpen && (
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
                                <Text style={[styles.cartTotalLabel, { textAlign: 'left' }]}>{cart.length} {t('items_count_label')}</Text>
                                <Text style={[styles.cartTotalPrice, { textAlign: 'left' }]}>{getCartTotal()} {t('currency_lyd')}</Text>
                            </View>
                            <View style={[styles.viewCartBtn, { flexDirection: 'row' }]}>
                                <Text style={[styles.viewCartText, { marginRight: 5 }]}>{t('view_cart')}</Text>
                                <ArrowRight size={18} color={COLORS.black} />
                            </View>
                        </TouchableOpacity>
                    </MotiView>
                )
            }


            {/* Search Modal (Animated Sheet) */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={() => setIsSearchOpen(false)}
            >
                <View style={styles.modalContainer}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsSearchOpen(false)} />
                    </Animated.View>
                    <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
                        <View style={[styles.sheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <View style={{ width: 44 }} />
                            <Text style={styles.sheetTitle}>{t('search_title')}</Text>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsSearchOpen(false)}>
                                <X size={22} color={COLORS.black} />
                            </TouchableOpacity>
                        </View>

                        <SafeAreaView style={{ flex: 1 }}>
                            <View style={styles.searchContainer}>
                                <View style={[styles.searchInputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <Search size={20} color={COLORS.subtext} />
                                    <TextInput
                                        style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left', marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}
                                        placeholder={t('search_dishes_placeholder')}
                                        autoFocus
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>
                            </View>

                            <FlatList
                                key={isRTL ? 'rtl-search' : 'ltr-search'}
                                data={products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ padding: 20 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.searchResultItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                        onPress={() => {
                                            setIsSearchOpen(false);
                                            navigation.navigate('ProductDetail', { product: item });
                                        }}
                                    >
                                        <Image source={{ uri: item.image }} style={styles.searchResultImage} />
                                        <View style={{ flex: 1, marginHorizontal: 15, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                                            <Text style={styles.searchResultName}>{item.name}</Text>
                                            <Text style={styles.searchResultPrice}>{item.price} {t('currency_lyd')}</Text>
                                        </View>
                                        {isRTL ? <ChevronLeft size={20} color={COLORS.lightGrey} /> : <ChevronRight size={20} color={COLORS.lightGrey} />}
                                    </TouchableOpacity>
                                )}
                            />
                        </SafeAreaView>
                    </Animated.View>
                </View>
            </Modal>

            <CartSheet visible={isCartSheetOpen} onClose={() => setIsCartSheetOpen(false)} />

            <PromotionOfferSheet
                visible={!!activePromoPopup}
                promotion={activePromoPopup}
                onClose={handleClosePromo}
                onLearnMore={handlePromoAction}
                navigation={navigation}
            />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    headerSearchArea: { paddingHorizontal: 20, paddingTop: 5, paddingBottom: 15 },
    searchBar: {
        backgroundColor: COLORS.grey,
        borderRadius: BORDER_RADIUS.container,
        paddingHorizontal: 15,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.lightGrey
    },
    searchText: { color: COLORS.subtext, fontSize: 16, fontFamily: FONTS.medium },

    section: { paddingHorizontal: 20, marginTop: 25 },
    sectionTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.black, marginBottom: 15 },

    promoCard: { width: width - 40, height: 180, borderRadius: BORDER_RADIUS.container, overflow: 'hidden', marginRight: 20 },
    promoBg: { ...StyleSheet.absoluteFillObject },
    promoGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 20 },
    promoTitle: { color: COLORS.white, fontSize: 24, fontFamily: FONTS.bold },
    promoSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontFamily: FONTS.medium },

    orderContainer: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 20,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.grey
    },
    orderHeader: { justifyContent: 'space-between', alignItems: 'center' },
    orderId: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.black },
    orderStatus: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 4 },
    reorderBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: BORDER_RADIUS.button, backgroundColor: COLORS.black },
    reorderText: { color: COLORS.white, fontFamily: FONTS.semibold, fontSize: 13 },

    productCard: {
        width: width - 40,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.card,
        marginBottom: 20,
        ...SHADOWS.small,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.grey
    },
    productImage: { width: '100%', height: 140 },
    productInfo: { padding: 12 },
    productName: { fontSize: 14, fontFamily: FONTS.semibold, color: COLORS.black },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    productPrice: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.black },
    addButtonMini: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center'
    },

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



    modalContainer: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
        backgroundColor: COLORS.white,
        height: Dimensions.get('window').height * 0.9,
        borderTopLeftRadius: BORDER_RADIUS.sheet,
        borderTopRightRadius: BORDER_RADIUS.sheet,
        overflow: 'hidden'
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey
    },
    sheetTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.grey,
        justifyContent: 'center',
        alignItems: 'center'
    },
    searchContainer: { paddingHorizontal: 20 },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.grey,
        borderRadius: BORDER_RADIUS.container,
        padding: 15
    },
    searchInput: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium, fontSize: 16 },
    searchResultItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    searchResultImage: { width: 60, height: 60, borderRadius: 15 },
    searchResultName: { fontSize: 16, fontFamily: FONTS.semibold },
    searchResultPrice: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.subtext },

    loginPrompt: {
        padding: 30,
        backgroundColor: COLORS.grey,
        borderRadius: BORDER_RADIUS.container,
        alignItems: 'center',
        marginTop: 20,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: COLORS.lightGrey
    },
    loginTitle: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.black },
    loginSubtitle: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: 8, marginBottom: 20 },
    primaryBtn: { backgroundColor: COLORS.black, paddingVertical: 15, paddingHorizontal: 30, borderRadius: BORDER_RADIUS.button },
    primaryBtnText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 16 }
});

export default HomeScreen;
