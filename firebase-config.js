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
firebase.initializeApp(firebaseConfig);

// Firebase服务引用
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const analytics = firebase.analytics();

// Cloudinary配置
const cloudinaryConfig = {
    cloudName: 'dy77idija',
    apiKey: '735299868247252',
    // API Secret should be kept server-side in production
    uploadPreset: 'photo_share_app'
};

// 导出Firebase服务
window.firebaseServices = {
    auth,
    db,
    storage,
    analytics
};