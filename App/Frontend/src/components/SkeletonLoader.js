import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { COLORS, BORDER_RADIUS } from '../theme/Theme';

const Skeleton = ({ width, height, borderRadius = BORDER_RADIUS.card, style }) => {
    return (
        <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.7 }}
            transition={{
                type: 'timing',
                duration: 1000,
                loop: true,
            }}
            style={[
                styles.skeleton,
                { width, height, borderRadius },
                style
            ]}
        />
    );
};

export const ProductCardSkeleton = () => (
    <View style={styles.card}>
        <Skeleton width="100%" height={140} borderRadius={0} />
        <View style={styles.cardInfo}>
            <Skeleton width="70%" height={15} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={15} />
        </View>
    </View>
);

export const MenuProductSkeleton = () => (
    <View style={styles.menuCard}>
        <Skeleton width="100%" height={140} borderRadius={0} />
        <View style={styles.cardInfo}>
            <Skeleton width="80%" height={16} style={{ marginBottom: 6 }} />
            <Skeleton width="50%" height={16} />
        </View>
    </View>
);

export const ProductDetailSkeleton = () => (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
        <Skeleton width="100%" height={300} borderRadius={0} />
        <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <Skeleton width="60%" height={24} />
                <Skeleton width="20%" height={24} />
            </View>
            <Skeleton width="100%" height={16} style={{ marginBottom: 10 }} />
            <Skeleton width="90%" height={16} style={{ marginBottom: 10 }} />
            <Skeleton width="40%" height={16} style={{ marginBottom: 30 }} />

            <Skeleton width="30%" height={20} style={{ marginBottom: 15 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 10 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 30 }} />
        </View>
    </View>
);

export const OrderSummarySkeleton = () => (
    <View style={{ flex: 1, backgroundColor: COLORS.white, padding: 20 }}>
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <Skeleton width="60%" height={24} style={{ marginTop: 20 }} />
            <Skeleton width="40%" height={16} style={{ marginTop: 10 }} />
        </View>
        <View style={styles.card}>
            <Skeleton width="100%" height={60} />
        </View>
        <View style={styles.card}>
            <Skeleton width="40%" height={20} style={{ marginBottom: 15 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 10 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 10 }} />
            <Skeleton width="100%" height={16} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E1E1E1',
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.container,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.grey
    },
    menuCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.card,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.grey,
        marginHorizontal: 5
    },
    cardInfo: {
        padding: 12
    }
});

export default Skeleton;
