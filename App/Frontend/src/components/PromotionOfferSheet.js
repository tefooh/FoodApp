import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Platform, Dimensions, ActivityIndicator, Alert, Animated } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../theme/Theme';
import { X } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const { height, width } = Dimensions.get('window');

const PromotionOfferSheet = ({ visible, onClose, promotion, navigation }) => {
    const { t, isRTL } = useLanguage();
    const { addToCart } = useCart();
    const [products, setProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [selections, setSelections] = useState({});
    const user = auth.currentUser;

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

    useEffect(() => {
        if (!promotion?.linkedProductIds?.length) {
            setLoading(false);
            setProducts({});
            return;
        }

        const fetchProducts = async () => {
            setLoading(true);
            const fetched = {};
            try {
                // Fetch all linked products
                await Promise.all(promotion.linkedProductIds.map(async (id) => {
                    const d = await getDoc(doc(db, 'products', id));
                    if (d.exists()) {
                        fetched[id] = { id: d.id, ...d.data() };
                    }
                }));
                setProducts(fetched);

                // Initialize default selections (optional, but good for UX if needed)
                setSelections({});
            } catch (e) {
                console.error("Error fetching promo products", e);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [promotion]);

    const handleOptionSelect = (productId, optionName, choiceLabel, type) => {
        setSelections(prev => {
            const productSelections = prev[productId] || {};
            const currentOptionValue = productSelections[optionName];

            let newValue;
            if (type === 'multiple') {
                // Toggle
                const currentArray = Array.isArray(currentOptionValue) ? currentOptionValue : [];
                if (currentArray.includes(choiceLabel)) {
                    newValue = currentArray.filter(l => l !== choiceLabel);
                } else {
                    newValue = [...currentArray, choiceLabel];
                }
            } else {
                // Single
                newValue = choiceLabel;
            }

            return {
                ...prev,
                [productId]: {
                    ...productSelections,
                    [optionName]: newValue
                }
            };
        });
    };

    const validate = () => {
        // Iterate through all products and their required options
        const productIds = promotion.linkedProductIds || [];
        for (const pid of productIds) {
            const product = products[pid];
            if (!product) continue;

            if (product.options) {
                for (const opt of product.options) {
                    if (opt.required) {
                        const userSel = selections[pid]?.[opt.name];
                        if (!userSel || (Array.isArray(userSel) && userSel.length === 0)) {
                            Alert.alert(t('error'), `${t('select_option_prefix')} ${opt.name} ${t('select_option_suffix')} ${product.name}`);
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    };

    const handleAddToCart = () => {
        if (!user) {
            onClose();
            // Assuming navigation is passed or available via hook if needed, 
            // but relying on parent to handle or pass navigation. 
            // HomeScreen passes navigation.
            if (navigation) navigation.navigate('Auth');
            return;
        }

        if (!validate()) return;

        // Flatten selections for Cart Display
        // We want key: "ProductName - OptionName", value: Choice
        const flattenedOptions = {};

        Object.entries(selections).forEach(([pid, prodSels]) => {
            const prod = products[pid];
            if (!prod) return;
            Object.entries(prodSels).forEach(([optName, val]) => {
                const displayVal = Array.isArray(val) ? val.join(', ') : val;
                flattenedOptions[`${prod.name} - ${optName}`] = displayVal;
            });
        });

        const promoItem = {
            id: promotion.id,
            name: promotion.title,
            price: parseFloat(promotion.price),
            image: promotion.image,
            selectedOptions: flattenedOptions,
            quantity: 1,
            isPromotion: true
        };

        addToCart(promoItem);
        Alert.alert(t('success'), t('cart_updated'));
        onClose();
    };

    if (!showModal || !promotion) return null;

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
                    <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={{ width: 44 }} />
                        <Text style={styles.headerTitle}>{promotion.title}</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <X size={22} color={COLORS.black} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {promotion.image ? (
                            <Image source={{ uri: promotion.image }} style={styles.promoImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.promoImage, { backgroundColor: COLORS.grey }]} />
                        )}

                        <View style={styles.infoSection}>
                            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[styles.promoTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{promotion.title}</Text>
                                <Text style={[styles.promoPrice, { textAlign: isRTL ? 'right' : 'left' }]}>{promotion.price} {t('currency_lyd')}</Text>
                            </View>
                            {promotion.description && <Text style={[styles.promoDesc, { textAlign: isRTL ? 'right' : 'left' }]}>{promotion.description}</Text>}
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color={COLORS.black} style={{ marginTop: 20 }} />
                        ) : (
                            <View style={styles.productsSection}>
                                <Text style={[styles.sectionHeader, { textAlign: isRTL ? 'right' : 'left' }]}>{t('included_items')}</Text>
                                {promotion.linkedProductIds?.map((pid, idx) => {
                                    const product = products[pid];
                                    if (!product) return null;

                                    return (
                                        <View key={pid} style={styles.productGroup}>
                                            <View style={styles.productHeader}>
                                                <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]}>{idx + 1}. {product.name}</Text>
                                            </View>

                                            {/* Options */}
                                            {product.options?.map((option, optIdx) => (
                                                <React.Fragment key={optIdx}>
                                                    <View style={[styles.optionContainer, { [isRTL ? 'borderRightWidth' : 'borderLeftWidth']: 3 }]}>
                                                        <Text style={[styles.optionName, { textAlign: isRTL ? 'right' : 'left' }]}>
                                                            {option.name}
                                                            {option.required && <Text style={{ color: COLORS.red }}> *</Text>}
                                                        </Text>
                                                        <Text style={[styles.optionType, { textAlign: isRTL ? 'right' : 'left' }]}>
                                                            {option.type === 'multiple' ? t('choose_multiple') : t('choose_one')}
                                                        </Text>
                                                    </View>

                                                    <View style={[styles.choicesGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                                        {option.choices?.map((choice, cIdx) => {
                                                            const currentVal = selections[pid]?.[option.name];
                                                            const isSelected = option.type === 'multiple'
                                                                ? (Array.isArray(currentVal) && currentVal.includes(choice.label))
                                                                : currentVal === choice.label;

                                                            return (
                                                                <TouchableOpacity
                                                                    key={cIdx}
                                                                    style={[styles.choiceChip, isSelected && styles.choiceChipSelected]}
                                                                    onPress={() => handleOptionSelect(pid, option.name, choice.label, option.type)}
                                                                >
                                                                    <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                                                                        {choice.label}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                </React.Fragment>
                                            ))}
                                            <View style={styles.divider} />
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity activeOpacity={0.9} onPress={handleAddToCart}>
                            <LinearGradient colors={COLORS.darkGradient} style={styles.addToCartBtn}>
                                <Text style={styles.btnText}>{t('add_bundle_to_cart')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View >
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
    headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center' },

    scrollContent: { paddingBottom: 20 },
    promoImage: { width: width, height: 250 },
    infoSection: { padding: 20 },
    promoTitle: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.black, flex: 1 },
    promoPrice: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.black },
    promoDesc: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.subtext, marginTop: 10, lineHeight: 22 },

    productsSection: { padding: 20, paddingTop: 0 },
    sectionHeader: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 15, color: COLORS.black },

    productGroup: { marginBottom: 20 },
    productHeader: { marginBottom: 15 },
    productName: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.black },
    divider: { height: 1, backgroundColor: COLORS.grey, marginVertical: 20 },

    optionContainer: {
        marginBottom: 15,
        paddingHorizontal: 10,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderColor: COLORS.grey
    },
    optionName: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: 8, color: COLORS.black },
    optionType: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.subtext },

    choicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
    choiceChip: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 25,
        backgroundColor: COLORS.grey,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    choiceChipSelected: {
        backgroundColor: COLORS.black,
        borderColor: COLORS.black
    },
    choiceText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.black },
    choiceTextSelected: { color: COLORS.white, fontFamily: FONTS.bold },

    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.grey,
        ...SHADOWS.medium
    },
    addToCartBtn: {
        height: 60,
        borderRadius: BORDER_RADIUS.button,
        justifyContent: 'center',
        alignItems: 'center'
    },
    btnText: { color: COLORS.white, fontSize: 18, fontFamily: FONTS.bold }
});

export default PromotionOfferSheet;
