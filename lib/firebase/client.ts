import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, GoogleAuthProvider, getAuth } from "firebase/auth";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { Firestore, getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initClientApp(): FirebaseApp {
	if (getApps().length > 0) {
		return getApp();
	}

	if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
		throw new Error("Missing Firebase web config. Set NEXT_PUBLIC_FIREBASE_* variables.");
	}

	return initializeApp(firebaseConfig);
}

export function getFirebaseClientAuth(): Auth {
	return getAuth(initClientApp());
}

export function getFirebaseClientStorage(): FirebaseStorage {
	return getStorage(initClientApp());
}

export function getFirebaseClientFirestore(): Firestore {
  return getFirestore(initClientApp());
}

export const firebaseGoogleProvider = new GoogleAuthProvider();
