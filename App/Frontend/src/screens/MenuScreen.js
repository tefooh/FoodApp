import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ScrollView, TextInput, Dimensions, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../translations';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { Pill, Search, X, Minus, Plus, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import Header from '../components/Header';
import CartSheet from '../components/CartSheet';
import { MenuProductSkeleton } from '../components/SkeletonLoader';

const { width, height } = Dimensions.get('window');

const MenuScreen = ({ navigation, route }) => {
    const { t, isRTL } = useLanguage();
    const { addToCart, cart, getCartTotal } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const processedLinkedProductRef = useRef(null);
    const { user, isGuest } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);
    const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
            const loadedProducts = snapshot.docs.map(doc => {
                const data = doc.data();
                // Normalize category to English Key for internal consistency
                // This handles cases where DB has Arabic or mixed category names
                return {
                    id: doc.id,
                    ...data,
                    category: translateText(data.category, 'en')
                };
            });
            setProducts(loadedProducts);

            // Extract unique categories from normalized data
            const uniqueCats = ['All', ...new Set(loadedProducts.map(p => p.category).filter(Boolean))];
            setCategories(uniqueCats);

            setLoading(false);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        const linkedProductId = route.params?.linkedProductId;
        if (linkedProductId && products.length > 0 && processedLinkedProductRef.current !== linkedProductId) {
            const linked = products.find(p => p.id === linkedProductId);
            if (linked) {
                processedLinkedProductRef.current = linkedProductId;
                navigation.navigate('ProductDetail', { product: linked });
            }
        }
    }, [route.params?.linkedProductId, products]);

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });


    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                title={t('menu')}
                onCartPress={() => setIsCartSheetOpen(true)}
            />

            <View style={styles.content}>
                <View style={[styles.searchWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Search size={20} color={COLORS.subtext} />
                    <TextInput
                        placeholder={t('search_placeholder')}
                        placeholderTextColor={COLORS.subtext}
                        style={[styles.searchBar, { color: COLORS.black, textAlign: isRTL ? 'right' : 'left', marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Categories Tab */}
                {!loading && (
                    <View style={styles.categoryContainer}>
                        <FlatList
                            data={categories}
                            keyExtractor={item => item}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.categoryContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                            renderItem={({ item }) => {
                                const isSelected = selectedCategory === item;
                                return (
                                    <TouchableOpacity
                                        style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                                        onPress={() => setSelectedCategory(item)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                                            {item === 'All' ? t('all_items') : (isRTL ? translateText(item, 'ar') : item)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                )}

                <FlatList
                    key={isRTL ? 'rtl-menu' : 'ltr-menu'}
                    data={loading ? [1, 2, 3, 4, 5, 6] : filtered}
                    keyExtractor={item => loading ? item.toString() : item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                    renderItem={({ item }) => {
                        if (loading) {
                            return (
                                <View style={{ width: (width - 45) / 2 }}>
                                    <MenuProductSkeleton />
                                </View>
                            );
                        }
                        return (
                            <TouchableOpacity
                                style={styles.card}
                                activeOpacity={0.9}
                                onPress={() => navigation.navigate('ProductDetail', { product: item })}
                            >
                                {item.image ? (
                                    <Image source={{ uri: item.image }} style={styles.productImg} resizeMode="cover" />
                                ) : (
                                    <View style={[styles.productImg, { backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' }]}>
                                        <Pill size={32} color={COLORS.subtext} />
                                    </View>
                                )}
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.foodName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{item.name}</Text>
                                    <Text style={[styles.foodPrice, { textAlign: isRTL ? 'right' : 'left' }]}>{item.price} {t('currency_lyd')}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Product Details Modal Removed - Now using separate screen */}

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
    content: { flex: 1 },
    searchWrapper: {
        backgroundColor: COLORS.grey,
        borderRadius: BORDER_RADIUS.container,
        paddingHorizontal: 15,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        marginHorizontal: 20,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.lightGrey
    },
    searchBar: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium, fontSize: 16 },

    categoryContainer: { marginBottom: 15, height: 40 },
    categoryContent: { paddingHorizontal: 20, alignItems: 'center' },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.button,
        backgroundColor: COLORS.grey,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.lightGrey
    },
    categoryPillActive: {
        backgroundColor: COLORS.black,
        borderColor: COLORS.black
    },
    categoryText: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.subtext
    },
    categoryTextActive: {
        color: COLORS.white,
        fontFamily: FONTS.bold
    },

    listContent: { padding: 15, paddingBottom: 100 },
    card: {
        width: (width - 45) / 2,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.card,
        marginBottom: 15,
        overflow: 'hidden',
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.grey
    },
    productImg: { width: '100%', height: 140 },
    cardInfo: { padding: 12 },
    foodName: { fontSize: 15, fontFamily: FONTS.semibold, color: COLORS.black },
    foodPrice: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.black, marginTop: 4 },

    floatingCart: { position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 100 },

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
    viewCartText: { color: COLORS.black, fontFamily: FONTS.bold, fontSize: 14, marginRight: 5 }
});

export default MenuScreen;
