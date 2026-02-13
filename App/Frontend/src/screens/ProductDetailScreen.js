import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductDetailSkeleton } from '../components/SkeletonLoader';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { Pill, X, Minus, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
    const { t, isRTL } = useLanguage();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(route.params?.product || null);
    const [loading, setLoading] = useState(!route.params?.product);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [user, setUser] = useState(auth.currentUser);

    useEffect(() => {
        const authUnsubscribe = auth.onAuthStateChanged(u => setUser(u));

        if (!product && route.params?.productId) {
            fetchProduct(route.params.productId);
        }

        return () => authUnsubscribe();
    }, []);

    const fetchProduct = async (id) => {
        try {
            const docRef = doc(db, 'products', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProduct({ id: docSnap.id, ...docSnap.data() });
            }
        } catch (error) {
            console.error("Error fetching product:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;

        if (!user) {
            Alert.alert(t('login_required'), t('login_add_cart_alert'));
            return;
        }

        let optionsPrice = 0;
        if (product.options) {
            product.options.forEach(option => {
                const selectedChoice = selectedOptions[option.name];
                if (selectedChoice) {
                    const choice = option.choices.find(c => c.label === selectedChoice);
                    if (choice) optionsPrice += choice.price;
                }
            });
        }

        const productWithOptions = {
            ...product,
            selectedOptions: selectedOptions,
            price: parseFloat(product.price) + optionsPrice,
            quantity: quantity
        };

        addToCart(productWithOptions);
        Alert.alert(t('success'), t('cart_updated'));
        navigation.goBack();
    };

    if (loading) {
        return <ProductDetailSkeleton />;
    }

    if (!product) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ fontSize: 16, fontFamily: FONTS.medium }}>{t('product_not_found')}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: COLORS.blue, fontFamily: FONTS.bold }}>{t('go_back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isGuest = !user;

    return (
        <View style={styles.container}>
            {/* Custom Header for Modal Feel */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ width: 44 }} />
                <Text style={styles.headerText}>{product.name}</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                    <X size={22} color={COLORS.black} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.productImage, { backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' }]}>
                        <Pill size={64} color={COLORS.subtext} />
                    </View>
                )}

                <View style={styles.infoContainer}>
                    <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{product.name}</Text>
                        <Text style={styles.price}>{product.price} {t('currency_lyd')}</Text>
                    </View>
                    <Text style={[styles.description, { textAlign: isRTL ? 'right' : 'left' }]}>{product.description}</Text>

                    {product.ingredients && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionHeading, { textAlign: isRTL ? 'right' : 'left' }]}>{t('ingredients_title')}</Text>
                            <Text style={[styles.sectionText, { textAlign: isRTL ? 'right' : 'left' }]}>{product.ingredients}</Text>
                        </View>
                    )}


                    {product.options && product.options.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionHeading, { textAlign: isRTL ? 'right' : 'left' }]}>{t('options')}</Text>
                            {product.options.map((option, idx) => (
                                <View key={idx} style={styles.optionGroup}>
                                    <Text style={[styles.optionName, { textAlign: isRTL ? 'right' : 'left' }]}>{option.name}</Text>
                                    {option.choices.map((choice, choiceIdx) => {
                                        const isSelected = selectedOptions[option.name] === choice.label;
                                        return (
                                            <TouchableOpacity
                                                key={choiceIdx}
                                                style={[styles.choiceItem, isSelected && styles.choiceItemSelected, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                                onPress={() => setSelectedOptions({ ...selectedOptions, [option.name]: choice.label })}
                                            >
                                                <View style={[styles.radio, isSelected && styles.radioActive, { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]}>
                                                    {isSelected && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[styles.choiceLabel, isSelected && styles.choiceLabelActive, { textAlign: isRTL ? 'right' : 'left' }]}>{choice.label}</Text>
                                                {choice.price > 0 && <Text style={styles.choicePrice}>+{choice.price} {t('currency_lyd')}</Text>}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {!isGuest ? (
                    <>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                                <Minus size={20} color={COLORS.black} />
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{quantity}</Text>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
                                <Plus size={20} color={COLORS.black} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity activeOpacity={0.9} style={{ flex: 1 }} onPress={handleAddToCart}>
                            <LinearGradient colors={COLORS.darkGradient} style={styles.addBtn}>
                                <Text style={styles.addBtnText}>{t('add_to_cart')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: COLORS.black, flex: 1 }]}
                        onPress={() => {
                            navigation.navigate('Auth');
                        }}
                    >
                        <Text style={styles.addBtnText}>{t('login_to_order_btn')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
    header: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grey,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginTop: Platform.OS === 'ios' ? 0 : 30
    },
    headerText: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 20 },
    productImage: { width: width, height: 300 },
    infoContainer: { padding: 20 },
    titleRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    title: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.black, flex: 1 },
    price: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.black },
    description: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 10, lineHeight: 22 },
    section: { marginTop: 30 },
    sectionHeading: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black, marginBottom: 15 },
    sectionText: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.subtext, lineHeight: 22 },
    optionGroup: { marginBottom: 25 },
    optionName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.black, marginBottom: 12 },
    choiceItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: BORDER_RADIUS.card, backgroundColor: COLORS.grey, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
    choiceItemSelected: { borderColor: COLORS.black, backgroundColor: COLORS.white },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.lightGrey, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: COLORS.black },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.black },
    choiceLabel: { flex: 1, fontSize: 15, fontFamily: FONTS.medium, color: COLORS.subtext },
    choiceLabelActive: { color: COLORS.black, fontFamily: FONTS.bold },
    choicePrice: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.black },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.grey,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.grey, borderRadius: BORDER_RADIUS.button, padding: 6 },
    qtyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
    qtyValue: { fontSize: 18, fontFamily: FONTS.bold, marginHorizontal: 15, minWidth: 20, textAlign: 'center' },
    addBtn: { height: 56, borderRadius: BORDER_RADIUS.button, justifyContent: 'center', alignItems: 'center' },
    addBtnText: { color: COLORS.white, fontSize: 17, fontFamily: FONTS.bold }
});

export default ProductDetailScreen;
