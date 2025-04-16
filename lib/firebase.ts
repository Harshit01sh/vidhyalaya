import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
    apiKey: "AIzaSyB_hlseCgKhtb1qltpaRWTiKzNceO2D3zg",
    authDomain: "vidhayalaya-9c36f.firebaseapp.com",
    projectId: "vidhayalaya-9c36f",
    storageBucket: "vidhayalaya-9c36f.firebasestorage.app",
    messagingSenderId: "816726147244",
    appId: "1:816726147244:web:92ede241e7d67898879f09"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app

