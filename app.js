class PhotoShareApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.photos = [];
        this.currentPhoto = null;
        this.isUploading = false;
        
        // 初始化Cloudinary上传组件
        this.cloudinaryWidget = null;
    }

    async init() {
        console.log('正在初始化照片分享应用...');
        
        // 绑定事件监听器
        this.bindEvents();
        
        // 初始化页面
        await this.loadInitialData();
        
        // 显示主界面
        this.showPage('home');
        
        console.log('应用初始化完成');
    }

    bindEvents() {
        // 导航链接点击
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
                this.showPage(page);
            });
        });

        // 主题切换
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 登录/注册按钮
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showAuthModal('login');
        });

        document.getElementById('signupBtn').addEventListener('click', () => {
            this.showAuthModal('signup');
        });

        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await authManager.logout();
            this.showToast('已退出登录', 'success');
        });

        // 上传功能
        document.getElementById('selectFileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        document.getElementById('uploadPhotoBtn').addEventListener('click', () => {
            this.uploadPhoto();
        });

        // 照片点击
        document.addEventListener('click', (e) => {
            if (e.target.closest('.photo-card')) {
                const photoId = e.target.closest('.photo-card').getAttribute('data-id');
                this.showPhotoDetail(photoId);
            }
        });

        // 搜索功能
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // 关注功能
        document.getElementById('followBtn').addEventListener('click', async () => {
            await this.toggleFollow();
        });

        // 编辑资料
        document.getElementById('editProfileBtn').addEventListener('click', () => {
            this.showSettings();
        });

        // 保存资料
        document.getElementById('saveProfileBtn').addEventListener('click', async () => {
            await this.saveProfile();
        });

        // 编辑头像
        document.getElementById('editAvatarBtn').addEventListener('click', () => {
            this.showAvatarModal();
        });

        // 开始分享按钮
        document.getElementById('startSharing').addEventListener('click', () => {
            if (authManager.user) {
                this.showPage('upload');
            } else {
                this.showAuthModal('login');
            }
        });

        // 页脚链接
        document.getElementById('aboutUsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAboutUs();
        });

        document.getElementById('privacyLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPrivacyPolicy();
        });

        // 移动端菜单
        document.querySelector('.mobile-menu-btn').addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('active');
        });

        // 模态框关闭
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // 点击模态框外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // 关键词输入
        document.getElementById('photoKeywords').addEventListener('input', (e) => {
            this.updateKeywordsPreview(e.target.value);
        });

        // 登录/注册表单切换
        document.querySelectorAll('[data-auth]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const authType = e.currentTarget.getAttribute('data-auth');
                this.showAuthModal(authType);
            });
        });

        // 登录提交
        document.getElementById('loginSubmit').addEventListener('click', async () => {
            await this.submitLogin();
        });

        // 注册提交
        document.getElementById('signupSubmit').addEventListener('click', async () => {
            await this.submitSignup();
        });

        // 监听认证状态变化
        authManager.onAuthStateChanged = (user) => {
            this.currentUser = user;
            if (user) {
                this.updateUserInfo();
            }
        };
    }

    async loadInitialData() {
        // 加载热门照片
        await this.loadTrendingPhotos();
        
        // 加载探索照片
        await this.loadExplorePhotos();
    }

    async loadTrendingPhotos() {
        try {
            const photosSnapshot = await firebaseServices.db.collection('photos')
                .where('isPrivate', '==', false)
                .orderBy('likes', 'desc')
                .limit(20)
                .get();

            this.photos = photosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderPhotos(this.photos, 'trendingPhotos');
        } catch (error) {
            console.error('加载热门照片失败:', error);
            this.showToast('加载照片失败', 'error');
        }
    }

    async loadExplorePhotos() {
        try {
            const photosSnapshot = await firebaseServices.db.collection('photos')
                .where('isPrivate', '==', false)
                .orderBy('createdAt', 'desc')
                .limit(30)
                .get();

            const photos = photosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderPhotos(photos, 'explorePhotos');
        } catch (error) {
            console.error('加载探索照片失败:', error);
        }
    }

    renderPhotos(photos, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (photos.length === 0) {
            container.innerHTML = `
                <div class="no-photos">
                    <i class="fas fa-images"></i>
                    <p>还没有照片，上传第一张照片吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = photos.map(photo => `
            <div class="photo-card" data-id="${photo.id}">
                <img src="${photo.imageUrl}" alt="${photo.title}" class="photo-image">
                <div class="photo-info">
                    <div class="photo-header">
                        <img src="${photo.userAvatar || '/default-avatar.png'}" alt="${photo.username}">
                        <h4>${photo.username}</h4>
                        <span class="photo-time">${this.formatTime(photo.createdAt)}</span>
                    </div>
                    <h3>${photo.title}</h3>
                    <p class="photo-desc">${photo.description.substring(0, 100)}${photo.description.length > 100 ? '...' : ''}</p>
                    <div class="photo-keywords">
                        ${photo.keywords.slice(0, 3).map(keyword => `
                            <span class="keyword-tag">${keyword.trim()}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="photo-actions">
                    <button class="photo-action-btn like-btn" data-id="${photo.id}">
                        <i class="far fa-heart"></i>
                        <span>${photo.likes || 0}</span>
                    </button>
                    <button class="photo-action-btn comment-btn">
                        <i class="far fa-comment"></i>
                        <span>${photo.comments || 0}</span>
                    </button>
                    <button class="photo-action-btn save-btn">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async showPhotoDetail(photoId) {
        try {
            const photoDoc = await firebaseServices.db.collection('photos').doc(photoId).get();
            
            if (!photoDoc.exists) {
                this.showToast('照片不存在', 'error');
                return;
            }

            const photo = { id: photoDoc.id, ...photoDoc.data() };
            this.currentPhoto = photo;

            // 更新模态框内容
            document.getElementById('modalPhotoImage').src = photo.imageUrl;
            document.getElementById('modalPhotoTitle').textContent = photo.title;
            document.getElementById('modalPhotoDescription').textContent = photo.description;
            document.getElementById('modalUsername').textContent = photo.username;
            document.getElementById('modalUserAvatar').src = photo.userAvatar || '/default-avatar.png';
            document.getElementById('modalUploadTime').textContent = this.formatTime(photo.createdAt);
            document.getElementById('likeCountText').textContent = photo.likes || 0;
            document.getElementById('modalLikeCount').textContent = photo.likes || 0;
            document.getElementById('viewCount').textContent = (photo.views || 0) + 1;

            // 更新关键词
            const keywordsContainer = document.getElementById('modalKeywords');
            keywordsContainer.innerHTML = photo.keywords.map(keyword => `
                <span class="keyword-tag">${keyword.trim()}</span>
            `).join('');

            // 显示模态框
            this.showModal('photoModal');

            // 增加浏览量
            await firebaseServices.db.collection('photos').doc(photoId).update({
                views: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('加载照片详情失败:', error);
            this.showToast('加载照片详情失败', 'error');
        }
    }

    async uploadPhoto() {
        const fileInput = document.getElementById('fileInput');
        const title = document.getElementById('photoTitle').value.trim();
        const description = document.getElementById('photoDescription').value.trim();
        const keywordsInput = document.getElementById('photoKeywords').value.trim();
        const isPrivate = document.getElementById('privatePhoto').checked;

        // 验证输入
        if (!fileInput.files[0]) {
            this.showToast('请选择照片文件', 'error');
            return;
        }

        if (!title) {
            this.showToast('请输入照片标题', 'error');
            return;
        }

        if (!keywordsInput) {
            this.showToast('请输入至少一个关键词', 'error');
            return;
        }

        const keywords = keywordsInput.split(',').map(k => k.trim()).filter(k => k);

        if (keywords.length === 0) {
            this.showToast('请输入至少一个关键词', 'error');
            return;
        }

        this.isUploading = true;
        this.showToast('正在上传照片...', 'info');

        try {
            const user = authManager.getUserData();
            const file = fileInput.files[0];

            // 使用Cloudinary上传
            const imageUrl = await this.uploadToCloudinary(file);

            // 保存到Firestore
            const photoData = {
                title,
                description,
                keywords,
                imageUrl,
                userId: authManager.getUserId(),
                username: user.username,
                userAvatar: user.avatarUrl,
                likes: 0,
                comments: 0,
                views: 0,
                isPrivate,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await firebaseServices.db.collection('photos').add(photoData);

            // 更新用户照片计数
            await firebaseServices.db.collection('users').doc(authManager.getUserId()).update({
                posts: firebase.firestore.FieldValue.increment(1)
            });

            this.showToast('照片上传成功！', 'success');

            // 重置表单
            this.resetUploadForm();

            // 切换到首页查看新照片
            this.showPage('home');
            await this.loadTrendingPhotos();

        } catch (error) {
            console.error('上传照片失败:', error);
            this.showToast('上传失败: ' + error.message, 'error');
        } finally {
            this.isUploading = false;
        }
    }

    async uploadToCloudinary(file) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', cloudinaryConfig.uploadPreset);
            formData.append('cloud_name', cloudinaryConfig.cloudName);

            fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.secure_url) {
                    resolve(data.secure_url);
                } else {
                    reject(new Error('上传到Cloudinary失败'));
                }
            })
            .catch(reject);
        });
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        
        if (!query) {
            this.showToast('请输入搜索关键词', 'warning');
            return;
        }

        try {
            this.showToast('正在搜索...', 'info');

            // 搜索照片（标题、描述、关键词）
            const photosSnapshot = await firebaseServices.db.collection('photos')
                .where('isPrivate', '==', false)
                .get();

            const photos = photosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 模糊搜索
            const searchResults = photos.filter(photo => {
                const searchStr = query.toLowerCase();
                const titleMatch = photo.title.toLowerCase().includes(searchStr);
                const descMatch = photo.description.toLowerCase().includes(searchStr);
                const keywordMatch = photo.keywords.some(keyword => 
                    keyword.toLowerCase().includes(searchStr)
                );
                
                return titleMatch || descMatch || keywordMatch;
            });

            // 显示在探索页面
            this.renderPhotos(searchResults, 'explorePhotos');
            this.showPage('explore');

            if (searchResults.length === 0) {
                this.showToast('没有找到相关照片', 'info');
            } else {
                this.showToast(`找到 ${searchResults.length} 张照片`, 'success');
            }
        } catch (error) {
            console.error('搜索失败:', error);
            this.showToast('搜索失败', 'error');
        }
    }

    async toggleLike(photoId) {
        if (!authManager.user) {
            this.showAuthModal('login');
            return;
        }

        try {
            const userId = authManager.getUserId();
            const likeRef = firebaseServices.db.collection('likes')
                .where('photoId', '==', photoId)
                .where('userId', '==', userId)
                .limit(1);

            const likeSnapshot = await likeRef.get();

            if (likeSnapshot.empty) {
                // 添加喜欢
                await firebaseServices.db.collection('likes').add({
                    photoId,
                    userId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 更新照片喜欢数
                await firebaseServices.db.collection('photos').doc(photoId).update({
                    likes: firebase.firestore.FieldValue.increment(1)
                });

                this.showToast('已喜欢', 'success');
            } else {
                // 取消喜欢
                const likeDoc = likeSnapshot.docs[0];
                await likeDoc.ref.delete();

                // 更新照片喜欢数
                await firebaseServices.db.collection('photos').doc(photoId).update({
                    likes: firebase.firestore.FieldValue.increment(-1)
                });

                this.showToast('已取消喜欢', 'info');
            }

            // 刷新照片显示
            await this.loadTrendingPhotos();
        } catch (error) {
            console.error('操作喜欢失败:', error);
        }
    }

    async toggleFollow() {
        if (!authManager.user) {
            this.showAuthModal('login');
            return;
        }

        // 关注/取消关注逻辑
        // 这里需要实现具体的关注功能
        this.showToast('关注功能开发中...', 'info');
    }

    async saveProfile() {
        const username = document.getElementById('settingsUsername').value.trim();
        const bio = document.getElementById('settingsBio').value.trim();
        const email = document.getElementById('settingsEmail').value.trim();
        const phone = document.getElementById('settingsPhone').value.trim();

        if (!username) {
            this.showToast('用户名不能为空', 'error');
            return;
        }

        const updates = {
            username,
            bio,
            phoneNumber: phone
        };

        const result = await authManager.updateProfile(updates);
        
        if (result.success) {
            this.showToast('资料更新成功', 'success');
            this.updateUserInfo();
        } else {
            this.showToast('更新失败: ' + result.error, 'error');
        }
    }

    updateUserInfo() {
        const userData = authManager.getUserData();
        if (!userData) return;

        // 更新页面上的用户信息
        document.getElementById('profileUsername').textContent = userData.username;
        document.getElementById('profileBio').textContent = userData.bio || '这个人很懒，还没有写简介...';
        document.getElementById('postCount').textContent = userData.posts || 0;
        document.getElementById('followerCount').textContent = userData.followers || 0;
        document.getElementById('followingCount').textContent = userData.following || 0;
        document.getElementById('likeCount').textContent = userData.likes || 0;

        // 更新设置表单
        document.getElementById('settingsUsername').value = userData.username;
        document.getElementById('settingsBio').value = userData.bio || '';
        document.getElementById('settingsEmail').value = userData.email || '';
        document.getElementById('settingsPhone').value = userData.phoneNumber || '';
    }

    showPage(pageName) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });

        // 显示目标页面
        const targetPage = document.getElementById(pageName + 'Page');
        if (targetPage) {
            targetPage.classList.add('active');
        }

        this.currentPage = pageName;

        // 关闭移动端菜单
        document.querySelector('.nav-links').classList.remove('active');

        // 如果是个人资料页面，加载用户照片
        if (pageName === 'profile' && authManager.user) {
            this.loadUserPhotos();
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    showAuthModal(type = 'login') {
        // 切换到指定的认证表单
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        document.querySelector(`[data-auth="${type}"]`).classList.add('active');
        document.getElementById(`${type}Form`).classList.add('active');

        this.showModal('authModal');
    }

    showAvatarModal() {
        this.showModal('avatarModal');
    }

    async submitLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showToast('请输入邮箱/手机号和密码', 'error');
            return;
        }

        const result = await authManager.login(email, password);
        
        if (result.success) {
            this.showToast('登录成功！', 'success');
            this.closeAllModals();
        } else {
            this.showToast('登录失败: ' + result.error, 'error');
        }
    }

    async submitSignup() {
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const phone = document.getElementById('signupPhone').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        // 验证输入
        if (!username || !email || !password) {
            this.showToast('请填写所有必填字段', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showToast('两次输入的密码不一致', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('密码至少需要6个字符', 'error');
            return;
        }

        const result = await authManager.signUp(email, password, username, phone);
        
        if (result.success) {
            this.showToast('注册成功！请检查邮箱验证邮件', 'success');
            this.closeAllModals();
        } else {
            this.showToast('注册失败: ' + result.error, 'error');
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.match('image.*')) {
            this.showToast('请选择图片文件', 'error');
            return;
        }

        // 验证文件大小（10MB）
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('图片大小不能超过10MB', 'error');
            return;
        }

        // 显示预览
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('uploadPreview').classList.remove('hidden');
            document.getElementById('uploadArea').classList.add('hidden');
            document.getElementById('uploadPhotoBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    }

    resetUploadForm() {
        document.getElementById('uploadPreview').classList.add('hidden');
        document.getElementById('uploadArea').classList.remove('hidden');
        document.getElementById('fileInput').value = '';
        document.getElementById('photoTitle').value = '';
        document.getElementById('photoDescription').value = '';
        document.getElementById('photoKeywords').value = '';
        document.getElementById('privatePhoto').checked = false;
        document.getElementById('keywordsPreview').innerHTML = '';
        document.getElementById('uploadPhotoBtn').disabled = true;
    }

    updateKeywordsPreview(input) {
        const keywords = input.split(',').map(k => k.trim()).filter(k => k);
        const preview = document.getElementById('keywordsPreview');
        
        preview.innerHTML = keywords.map(keyword => `
            <span class="keyword-tag">
                ${keyword}
                <button type="button" onclick="this.removeKeyword('${keyword}')">×</button>
            </span>
        `).join('');
    }

    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        
        if (body.classList.contains('light-mode')) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        } else if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            body.classList.add('white-mode');
            themeToggle.innerHTML = '<i class="fas fa-adjust"></i>';
            localStorage.setItem('theme', 'white');
        } else {
            body.classList.remove('white-mode');
            body.classList.add('light-mode');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return '刚刚';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        const month = 30 * day;
        const year = 365 * day;
        
        if (diff < minute) {
            return '刚刚';
        } else if (diff < hour) {
            return Math.floor(diff / minute) + '分钟前';
        } else if (diff < day) {
            return Math.floor(diff / hour) + '小时前';
        } else if (diff < week) {
            return Math.floor(diff / day) + '天前';
        } else if (diff < month) {
            return Math.floor(diff / week) + '周前';
        } else if (diff < year) {
            return Math.floor(diff / month) + '月前';
        } else {
            return Math.floor(diff / year) + '年前';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    showAboutUs() {
        this.showToast('关于我们：这是一个用爱打造的照片分享平台', 'info');
    }

    showPrivacyPolicy() {
        this.showToast('隐私政策：我们尊重并保护您的隐私', 'info');
    }

    async loadUserPhotos() {
        if (!authManager.user) return;
        
        try {
            const photosSnapshot = await firebaseServices.db.collection('photos')
                .where('userId', '==', authManager.getUserId())
                .orderBy('createdAt', 'desc')
                .get();

            const photos = photosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderPhotos(photos, 'profilePhotos');
        } catch (error) {
            console.error('加载用户照片失败:', error);
        }
    }

    showSettings() {
        this.showPage('settings');
    }
}

// 扩展Array原型以移除关键词
Array.prototype.removeKeyword = function(keyword) {
    const index = this.indexOf(keyword);
    if (index > -1) {
        this.splice(index, 1);
    }
    return this;
};