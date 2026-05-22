import { Platform } from "react-native";
import { initializeApp, getApps } from "firebase/app";

import {
  initializeAuth,
  getReactNativePersistence,
  browserSessionPersistence
} from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAG8wagg2PeMZ0Vv-MyH_5K873KZGc4lwI",
  authDomain: "meditrack-842e5.firebaseapp.com",
  projectId: "meditrack-842e5",
  storageBucket: "meditrack-842e5.firebasestorage.app",
  messagingSenderId: "945170693733",
  appId: "1:945170693733:web:88714b80a50ac33759d08c",
  measurementId: "G-K7FMP0DF2N"
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];
const determinarPersistencia = () => {
  if (Platform.OS === "web") {
    return browserSessionPersistence;
  } else {
    return getReactNativePersistence(AsyncStorage);
  } };
export const auth = initializeAuth(app, {
  persistence: determinarPersistencia()});

export const db = getFirestore(app);