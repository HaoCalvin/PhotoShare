// Firebase配置和初始化
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc, deleteDoc, getDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyC3Dz_j6n9dRJP_MPaplhgro5x-sbmH3yw",
  authDomain: "photo-e92b2.firebaseapp.com",
  projectId: "photo-e92b2",
  storageBucket: "photo-e92b2.firebasestorage.app",
  messagingSenderId: "999157546476",
  appId: "1:999157546476:web:9f69f34e5b2b87f478d4c9",
  measurementId: "G-5EH6GFC1CE"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 管理员邮箱列表
const ADMIN_EMAILS = ['haochenxihehaohan@outlook.com', 'haochenxihehaohan@outlook.com'];

// 检查用户是否是管理员
function isAdmin(email) {
  return ADMIN_EMAILS.includes(email);
}

// 导出Firebase服务
export {
  auth,
  db,
  storage,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  increment,
  ref,
  uploadBytes,
  getDownloadURL,
  isAdmin
};