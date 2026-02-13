import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);

let persistence;
if (Platform.OS === 'web') {
    persistence = browserLocalPersistence;
} else {
    persistence = getReactNativePersistence(ReactNativeAsyncStorage);
}

export const auth = initializeAuth(app, {
    persistence
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
