import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { auth } from './firebase';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { enableScreens } from 'react-native-screens';
// enableScreens(false); // Disable for better Web animation support

// Screens
import HomeScreen from './src/screens/HomeScreen';
import MenuScreen from './src/screens/MenuScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderSummaryScreen from './src/screens/OrderSummaryScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import ContactSupportScreen from './src/screens/ContactSupportScreen';
import AboutScreen from './src/screens/AboutScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import LanguageScreen from './src/screens/LanguageScreen';

import { Home, LayoutGrid, ClipboardList, User } from 'lucide-react-native';
import { COLORS, FONTS } from './src/theme/Theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

function MainTabs({ route }) {
  const { t } = useLanguage();
  const user = route?.params?.user;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          if (route.name === 'Home') IconComponent = Home;
          else if (route.name === 'Menu') IconComponent = LayoutGrid;
          else if (route.name === 'Orders') IconComponent = ClipboardList;
          else if (route.name === 'Profile') IconComponent = User;

          return <IconComponent size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
        },
        tabBarActiveTintColor: COLORS.black,
        tabBarInactiveTintColor: COLORS.subtext,
        headerShown: false,
        tabBarLabel: t(route.name.toLowerCase()),
        tabBarLabelStyle: {
          fontFamily: FONTS.semibold,
          fontSize: 11,
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.grey,
          elevation: 0,
          backgroundColor: COLORS.white,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        lazy: false,
        freezeOnBlur: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const AuthScreenWrapper = () => {
  return <AuthScreen onLogin={() => { }} isModalMode={true} />;
};

function Root() {
  const { user, loading: authLoading } = useAuth();
  const { isRTL } = useLanguage();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'SFUIText-Bold': require('./assets/SFUI Font/SFUIText-Bold.ttf'),
        'SFUIText-Semibold': require('./assets/SFUI Font/SFUIText-Semibold.ttf'),
        'SFUIText-Medium': require('./assets/SFUI Font/SFUIText-Medium.ttf'),
        'SFUIText-Regular': require('./assets/SFUI Font/SFUIText-Regular.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (authLoading || !fontsLoaded) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color="#000" /></View>;

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isRTL ? 'rtl-stack' : 'ltr-stack'}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          gestureEnabled: true,
          contentStyle: { backgroundColor: COLORS.white },
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} initialParams={{ user }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen
          name="OrderSummary"
          component={OrderSummaryScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { CartProvider } from './src/context/CartContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <Root />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

