class AuthManager {
    constructor() {
        this.user = null;
        this.userData = null;
        this.initAuthListener();
    }

    // 初始化认证监听器
    initAuthListener() {
        firebaseServices.auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.user = user;
                await this.loadUserData(user.uid);
                this.updateUI(true);
                this.updateUserMenu();
            } else {
                this.user = null;
                this.userData = null;
                this.updateUI(false);
            }
        });
    }

    // 加载用户数据
    async loadUserData(uid) {
        try {
            const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                this.userData = userDoc.data();
            } else {
                // 创建新用户文档
                await this.createUserDocument(uid);
            }
        } catch (error) {
            console.error('加载用户数据失败:', error);
        }
    }

    // 创建用户文档
    async createUserDocument(uid) {
        const user = firebaseServices.auth.currentUser;
        const userData = {
            uid: uid,
            email: user.email,
            phoneNumber: user.phoneNumber || '',
            username: user.displayName || user.email.split('@')[0],
            bio: '',
            avatarUrl: user.photoURL || '/default-avatar.png',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            followers: 0,
            following: 0,
            posts: 0,
            likes: 0,
            isAdmin: user.email === 'admin@photos.com', // 管理员检测
            privacy: {
                privateProfile: false,
                hideLikes: false
            }
        };

        await firebaseServices.db.collection('users').doc(uid).set(userData);
        this.userData = userData;
    }

    // 邮箱密码注册
    async signUp(email, password, username, phone = '') {
        try {
            // 创建用户认证
            const userCredential = await firebaseServices.auth.createUserWithEmailAndPassword(email, password);
            
            // 更新显示名称
            await userCredential.user.updateProfile({
                displayName: username
            });

            // 创建用户文档
            await this.createUserDocument(userCredential.user.uid);

            // 如果需要，验证邮箱
            await userCredential.user.sendEmailVerification();

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 邮箱密码登录
    async login(email, password) {
        try {
            // 检查输入是否为手机号
            let loginMethod = email;
            if (email.match(/^\d+$/)) {
                // 如果是纯数字，查找对应的邮箱
                const userQuery = await firebaseServices.db.collection('users')
                    .where('phoneNumber', '==', email)
                    .limit(1)
                    .get();
                
                if (!userQuery.empty) {
                    loginMethod = userQuery.docs[0].data().email;
                }
            }

            const userCredential = await firebaseServices.auth.signInWithEmailAndPassword(loginMethod, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, error: error.message };
        }
    }

    // Google登录
    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const userCredential = await firebaseServices.auth.signInWithPopup(provider);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Google登录失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 退出登录
    async logout() {
        try {
            await firebaseServices.auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('退出登录失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新用户资料
    async updateProfile(updates) {
        try {
            const uid = this.user.uid;
            updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            await firebaseServices.db.collection('users').doc(uid).update(updates);
            
            // 更新本地数据
            this.userData = { ...this.userData, ...updates };
            
            return { success: true };
        } catch (error) {
            console.error('更新资料失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新头像
    async updateAvatar(imageFile) {
        try {
            const uid = this.user.uid;
            const storageRef = firebaseServices.storage.ref(`avatars/${uid}/${Date.now()}`);
            
            // 上传图片
            const snapshot = await storageRef.put(imageFile);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            // 更新用户文档
            await firebaseServices.db.collection('users').doc(uid).update({
                avatarUrl: downloadURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // 更新认证用户头像
            await this.user.updateProfile({
                photoURL: downloadURL
            });
            
            // 更新本地数据
            this.userData.avatarUrl = downloadURL;
            
            return { success: true, url: downloadURL };
        } catch (error) {
            console.error('更新头像失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新UI状态
    updateUI(isLoggedIn) {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        
        if (isLoggedIn) {
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
        } else {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    }

    // 更新用户菜单
    updateUserMenu() {
        if (this.userData) {
            const userAvatar = document.getElementById('userAvatar');
            const profileAvatar = document.getElementById('profileAvatar');
            const profileUsername = document.getElementById('profileUsername');
            const profileBio = document.getElementById('profileBio');
            
            if (userAvatar) userAvatar.src = this.userData.avatarUrl || '/default-avatar.png';
            if (profileAvatar) profileAvatar.src = this.userData.avatarUrl || '/default-avatar.png';
            if (profileUsername) profileUsername.textContent = this.userData.username;
            if (profileBio) profileBio.textContent = this.userData.bio || '这个人很懒，还没有写简介...';
        }
    }

    // 检查用户是否为管理员
    isAdmin() {
        return this.userData && this.userData.isAdmin === true;
    }

    // 获取当前用户ID
    getUserId() {
        return this.user ? this.user.uid : null;
    }

    // 获取用户数据
    getUserData() {
        return this.userData;
    }

    // 重置密码
    async resetPassword(email) {
        try {
            await firebaseServices.auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('重置密码失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 创建全局认证管理器实例
window.authManager = new AuthManager();