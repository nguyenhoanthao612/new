import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Firestore, doc, getDocFromServer } from "firebase/firestore";
import config from "../firebase-applet-config.json";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (getApps().length === 0) {
    app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    });
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app, config.firestoreDatabaseId);

  // Test connection on boot (client-side)
  if (typeof window !== "undefined") {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const googleProvider = new GoogleAuthProvider();
export { app, auth, db };
