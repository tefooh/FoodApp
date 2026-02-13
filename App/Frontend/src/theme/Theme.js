import { Platform } from 'react-native';

export const COLORS = {
    black: '#000000',
    white: '#FFFFFF',
    grey: '#F2F2F7', // iOS light grey
    darkGrey: '#1C1C1E',
    lightGrey: '#E5E5EA',
    text: '#000000',
    subtext: '#8E8E93',
    gradient: ['#F2F2F7', '#FFFFFF'], // Light monochrome gradient
    darkGradient: ['#000000', '#1C1C1E'],
    red: '#FF3B30',
    green: '#34C759',
    blue: '#007AFF',
    border: '#E5E5EA'
};

export const FONTS = {
    bold: Platform.select({ ios: 'SFUIText-Bold', android: 'SFUIText-Bold' }),
    semibold: Platform.select({ ios: 'SFUIText-Semibold', android: 'SFUIText-Semibold' }),
    medium: Platform.select({ ios: 'SFUIText-Medium', android: 'SFUIText-Medium' }),
    regular: Platform.select({ ios: 'SFUIText-Regular', android: 'SFUIText-Regular' }),
};

export const SHADOWS = {
    small: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    medium: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 4,
    }
};

export const BORDER_RADIUS = {
    button: 999, // Max rounded
    container: 32, // MORE rounded
    card: 24, // Consistent rounding
    sheet: 32
};
