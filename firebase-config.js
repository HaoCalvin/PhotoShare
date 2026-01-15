// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyC3Dz_j6n9dRJP_MPaplhgro5x-sbmH3yw",
    authDomain: "photo-e92b2.firebaseapp.com",
    projectId: "photo-e92b2",
    storageBucket: "photo-e92b2.firebasestorage.app",
    messagingSenderId: "999157546476",
    appId: "1:999157546476:web:9f69f34e5b2b87f478d4c9",
    measurementId: "G-5EH6GFC1CE"
};

// 初始化 Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
const analytics = firebase.analytics();

// 初始化函数
async function initFirebase() {
    try {
        // 启用离线持久化
        await firestore.enablePersistence({
            synchronizeTabs: true
        });
        
        console.log('Firebase 初始化成功');
    } catch (error) {
        console.error('Firebase 初始化失败:', error);
        
        if (error.code === 'failed-precondition') {
            console.error('多个标签页同时打开了 Firebase 持久化');
        } else if (error.code === 'unimplemented') {
            console.error('当前浏览器不支持 Firebase 持久化');
        }
    }
}

// 导出 Firebase 实例
window.firebase = firebase;