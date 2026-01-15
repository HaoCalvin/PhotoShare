// 全局变量
let currentUser = null;
let currentTheme = 'light';
let photos = [];
let featuredPhotos = [];
let users = new Map();
let adminEmails = ['haochenxihehaohan@outlook.com']; // 添加你的管理员邮箱

// DOM 元素
const elements = {
    // 导航栏
    homeBtn: document.getElementById('homeBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    profileBtn: document.getElementById('profileBtn'),
    themeToggle: document.getElementById('themeToggle'),
    logoutBtn: document.getElementById('logoutBtn'),
    loginBtn: document.getElementById('loginBtn'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    
    // 模态框
    authModal: document.getElementById('authModal'),
    uploadModal: document.getElementById('uploadModal'),
    imageDetailModal: document.getElementById('imageDetailModal'),
    profileEditModal: document.getElementById('profileEditModal'),
    
    // 表单
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    uploadForm: document.getElementById('uploadForm'),
    profileEditForm: document.getElementById('profileEditForm'),
    
    // 内容区域
    photosGrid: document.getElementById('photosGrid'),
    featuredGrid: document.getElementById('featuredGrid'),
    loading: document.getElementById('loading'),
    
    // 侧边栏
    sidebarAvatar: document.getElementById('sidebarAvatar'),
    sidebarUsername: document.getElementById('sidebarUsername'),
    sidebarBio: document.getElementById('sidebarBio'),
    sidebarPhotos: document.getElementById('sidebarPhotos'),
    sidebarFollowers: document.getElementById('sidebarFollowers'),
    sidebarFollowing: document.getElementById('sidebarFollowing'),
    profileActions: document.getElementById('profileActions'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    followBtn: document.getElementById('followBtn'),
    adminPanel: document.getElementById('adminPanel'),
    
    // 其他
    keywordsList: document.getElementById('keywordsList'),
    uploadProgress: document.getElementById('uploadProgress'),
    progressBar: document.querySelector('.progress-bar')
};

// 初始化函数
async function initApp() {
    // 初始化Firebase
    await initFirebase();
    
    // 检查用户登录状态
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile(user.uid);
            updateUIForLoggedInUser();
            showNotification('登录成功！', 'success');
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
        loadPhotos();
        loadFeaturedPhotos();
        loadTrendingKeywords();
    });
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化主题
    initTheme();
}

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// 设置主题
function setTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = elements.themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i> 浅色';
    } else if (theme === 'light') {
        icon.className = 'fas fa-adjust';
        elements.themeToggle.innerHTML = '<i class="fas fa-adjust"></i> 深色';
    } else {
        icon.className = 'fas fa-moon';
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i> 主题';
    }
}

// 切换主题
function toggleTheme() {
    const themes = ['light', 'dark', 'light'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
}

// 设置事件监听器
function setupEventListeners() {
    // 导航栏按钮
    elements.homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadPhotos();
    });
    
    elements.uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            showModal(elements.uploadModal);
        } else {
            showModal(elements.authModal);
            showNotification('请先登录！', 'warning');
        }
    });
    
    elements.profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            loadUserProfile(currentUser.uid);
        } else {
            showModal(elements.authModal);
        }
    });
    
    elements.themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
    });
    
    elements.logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await firebase.auth().signOut();
            showNotification('已退出登录', 'success');
        } catch (error) {
            showNotification('退出失败: ' + error.message, 'error');
        }
    });
    
    elements.loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showModal(elements.authModal);
    });
    
    // 搜索功能
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // 模态框关闭
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            hideAllModals();
        });
    });
    
    // 点击背景关闭模态框
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideAllModals();
        }
    });
    
    // 登录表单
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            hideAllModals();
        } catch (error) {
            showNotification('登录失败: ' + error.message, 'error');
        }
    });
    
    // 注册表单
    elements.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // 创建用户资料
            await firebase.firestore().collection('users').doc(user.uid).set({
                uid: user.uid,
                username: name,
                email: email,
                bio: '',
                avatar: '',
                followers: [],
                following: [],
                photos: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            hideAllModals();
            showNotification('注册成功！', 'success');
        } catch (error) {
            showNotification('注册失败: ' + error.message, 'error');
        }
    });
    
    // 上传表单
    elements.uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await uploadPhoto();
    });
    
    // 图片上传预览
    document.getElementById('photoUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('previewImage').src = event.target.result;
                document.getElementById('imagePreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 头像上传预览
    document.getElementById('editAvatar').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('avatarPreview').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 个人资料编辑
    elements.profileEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateUserProfile();
    });
    
    elements.editProfileBtn.addEventListener('click', () => {
        showProfileEditModal();
    });
    
    // 标签切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

// 切换标签页
function switchTab(tab) {
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tab + 'Tab');
    });
}

// 显示模态框
function showModal(modal) {
    hideAllModals();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 隐藏所有模态框
function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

// 显示通知
function showNotification(message, type = 'success') {
    // 移除现有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => notification.classList.add('show'), 10);
    
    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 加载照片
async function loadPhotos(filter = 'all') {
    elements.loading.classList.remove('hide');
    elements.photosGrid.innerHTML = '';
    
    try {
        let query = firebase.firestore().collection('photos')
            .where('private', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(20);
        
        if (filter === 'following' && currentUser) {
            const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
            const following = userDoc.data().following || [];
            if (following.length > 0) {
                query = query.where('userId', 'in', following);
            } else {
                elements.photosGrid.innerHTML = '<p class="no-content">还没有关注任何人</p>';
                elements.loading.classList.add('hide');
                return;
            }
        } else if (filter === 'popular') {
            query = query.orderBy('likes', 'desc');
        }
        
        const snapshot = await query.get();
        photos = [];
        
        snapshot.forEach(doc => {
            photos.push({ id: doc.id, ...doc.data() });
        });
        
        renderPhotos(photos);
    } catch (error) {
        console.error('加载照片失败:', error);
        showNotification('加载照片失败', 'error');
    } finally {
        elements.loading.classList.add('hide');
    }
}

// 加载热门照片
async function loadFeaturedPhotos() {
    try {
        const snapshot = await firebase.firestore().collection('photos')
            .where('private', '==', false)
            .orderBy('views', 'desc')
            .limit(6)
            .get();
        
        featuredPhotos = [];
        snapshot.forEach(doc => {
            featuredPhotos.push({ id: doc.id, ...doc.data() });
        });
        
        renderFeaturedPhotos();
    } catch (error) {
        console.error('加载热门照片失败:', error);
    }
}

// 加载热门关键词
async function loadTrendingKeywords() {
    try {
        const snapshot = await firebase.firestore().collection('photos')
            .where('private', '==', false)
            .get();
        
        const keywordCount = {};
        snapshot.forEach(doc => {
            const keywords = doc.data().keywords || [];
            keywords.forEach(keyword => {
                keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
            });
        });
        
        // 获取最热门的关键词
        const trendingKeywords = Object.entries(keywordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(entry => entry[0]);
        
        renderTrendingKeywords(trendingKeywords);
    } catch (error) {
        console.error('加载热门关键词失败:', error);
    }
}

// 渲染照片
function renderPhotos(photosToRender) {
    elements.photosGrid.innerHTML = '';
    
    if (photosToRender.length === 0) {
        elements.photosGrid.innerHTML = '<p class="no-content">没有找到照片</p>';
        return;
    }
    
    photosToRender.forEach(photo => {
        const photoElement = createPhotoCard(photo);
        elements.photosGrid.appendChild(photoElement);
    });
}

// 渲染热门照片
function renderFeaturedPhotos() {
    elements.featuredGrid.innerHTML = '';
    
    featuredPhotos.forEach(photo => {
        const photoElement = createPhotoCard(photo, true);
        elements.featuredGrid.appendChild(photoElement);
    });
}

// 创建照片卡片
function createPhotoCard(photo, isFeatured = false) {
    const card = document.createElement('div');
    card.className = `photo-card ${isFeatured ? 'featured' : ''}`;
    card.dataset.id = photo.id;
    
    // 从用户缓存获取用户信息
    const user = users.get(photo.userId);
    
    card.innerHTML = `
        <div class="photo-image-container">
            <img src="${photo.url}" alt="${photo.title}" class="photo-image" loading="lazy">
            ${photo.private ? '<div class="private-badge"><i class="fas fa-lock"></i> 私密</div>' : ''}
        </div>
        <div class="photo-info">
            <div class="photo-user">
                <img src="${user?.avatar || 'https://via.placeholder.com/40'}" 
                     alt="${user?.username || '用户'}" 
                     class="avatar">
                <div>
                    <strong>${user?.username || '用户'}</strong>
                    <small>${formatDate(photo.createdAt?.toDate())}</small>
                </div>
            </div>
            <h3 class="photo-title">${photo.title}</h3>
            <div class="keywords">
                ${(photo.keywords || []).slice(0, 3).map(keyword => 
                    `<span class="keyword">${keyword}</span>`
                ).join('')}
            </div>
            <div class="photo-stats">
                <span><i class="fas fa-heart"></i> ${photo.likes || 0}</span>
                <span><i class="fas fa-eye"></i> ${photo.views || 0}</span>
                <span><i class="fas fa-comment"></i> ${photo.comments || 0}</span>
            </div>
        </div>
    `;
    
    // 点击查看详情
    card.addEventListener('click', () => {
        showPhotoDetail(photo.id);
    });
    
    return card;
}

// 渲染热门关键词
function renderTrendingKeywords(keywords) {
    elements.keywordsList.innerHTML = '';
    
    keywords.forEach(keyword => {
        const keywordElement = document.createElement('span');
        keywordElement.className = 'keyword';
        keywordElement.textContent = keyword;
        keywordElement.addEventListener('click', () => {
            elements.searchInput.value = keyword;
            performSearch();
        });
        elements.keywordsList.appendChild(keywordElement);
    });
}

// 显示照片详情
async function showPhotoDetail(photoId) {
    try {
        const photoDoc = await firebase.firestore().collection('photos').doc(photoId).get();
        if (!photoDoc.exists) {
            showNotification('照片不存在', 'error');
            return;
        }
        
        const photo = { id: photoDoc.id, ...photoDoc.data() };
        const userDoc = await firebase.firestore().collection('users').doc(photo.userId).get();
        const user = userDoc.data();
        
        // 更新浏览次数
        await firebase.firestore().collection('photos').doc(photoId).update({
            views: firebase.firestore.FieldValue.increment(1)
        });
        
        // 填充详情数据
        document.getElementById('detailImage').src = photo.url;
        document.getElementById('detailTitle').textContent = photo.title;
        document.getElementById('detailDescription').textContent = photo.description || '';
        document.getElementById('detailUserAvatar').src = user.avatar || 'https://via.placeholder.com/40';
        document.getElementById('detailUserName').textContent = user.username;
        document.getElementById('detailUploadTime').textContent = formatDate(photo.createdAt?.toDate());
        document.getElementById('likeCount').textContent = photo.likes || 0;
        
        // 设置关键词
        const keywordsContainer = document.getElementById('detailKeywords');
        keywordsContainer.innerHTML = '';
        (photo.keywords || []).forEach(keyword => {
            const span = document.createElement('span');
            span.className = 'keyword';
            span.textContent = keyword;
            keywordsContainer.appendChild(span);
        });
        
        // 设置点赞按钮状态
        const likeBtn = document.getElementById('likeBtn');
        const likeIcon = likeBtn.querySelector('i');
        if (currentUser && photo.likedBy?.includes(currentUser.uid)) {
            likeIcon.className = 'fas fa-heart';
            likeBtn.style.color = 'var(--danger-color)';
        } else {
            likeIcon.className = 'far fa-heart';
            likeBtn.style.color = 'var(--text-color)';
        }
        
        // 点赞功能
        likeBtn.onclick = async () => {
            if (!currentUser) {
                showModal(elements.authModal);
                return;
            }
            
            try {
                const photoRef = firebase.firestore().collection('photos').doc(photoId);
                const likedBy = photo.likedBy || [];
                
                if (likedBy.includes(currentUser.uid)) {
                    // 取消点赞
                    await photoRef.update({
                        likes: firebase.firestore.FieldValue.increment(-1),
                        likedBy: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
                    });
                    likeIcon.className = 'far fa-heart';
                    likeBtn.style.color = 'var(--text-color)';
                    document.getElementById('likeCount').textContent = (photo.likes || 1) - 1;
                } else {
                    // 点赞
                    await photoRef.update({
                        likes: firebase.firestore.FieldValue.increment(1),
                        likedBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                    });
                    likeIcon.className = 'fas fa-heart';
                    likeBtn.style.color = 'var(--danger-color)';
                    document.getElementById('likeCount').textContent = (photo.likes || 0) + 1;
                }
            } catch (error) {
                showNotification('操作失败: ' + error.message, 'error');
            }
        };
        
        // 下载功能
        document.getElementById('downloadBtn').onclick = () => {
            const link = document.createElement('a');
            link.href = photo.url;
            link.download = photo.title || 'photo';
            link.click();
        };
        
        // 分享功能
        document.getElementById('shareBtn').onclick = () => {
            if (navigator.share) {
                navigator.share({
                    title: photo.title,
                    text: photo.description,
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(window.location.href);
                showNotification('链接已复制到剪贴板', 'success');
            }
        };
        
        // 加载评论
        loadComments(photoId);
        
        // 评论功能
        document.getElementById('submitComment').onclick = async () => {
            const commentInput = document.getElementById('commentInput');
            const comment = commentInput.value.trim();
            
            if (!comment) {
                showNotification('请输入评论内容', 'warning');
                return;
            }
            
            if (!currentUser) {
                showModal(elements.authModal);
                return;
            }
            
            try {
                await firebase.firestore().collection('photos').doc(photoId).collection('comments').add({
                    userId: currentUser.uid,
                    username: currentUser.displayName || '用户',
                    userAvatar: currentUser.photoURL || '',
                    content: comment,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // 更新评论计数
                await firebase.firestore().collection('photos').doc(photoId).update({
                    comments: firebase.firestore.FieldValue.increment(1)
                });
                
                commentInput.value = '';
                loadComments(photoId);
                showNotification('评论发布成功', 'success');
            } catch (error) {
                showNotification('评论失败: ' + error.message, 'error');
            }
        };
        
        // 显示模态框
        showModal(elements.imageDetailModal);
    } catch (error) {
        console.error('加载照片详情失败:', error);
        showNotification('加载失败', 'error');
    }
}

// 加载评论
async function loadComments(photoId) {
    try {
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '';
        
        const snapshot = await firebase.firestore()
            .collection('photos').doc(photoId)
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .get();
        
        if (snapshot.empty) {
            commentsList.innerHTML = '<p class="no-comments">还没有评论</p>';
            return;
        }
        
        snapshot.forEach(async doc => {
            const comment = doc.data();
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <div class="comment-user">
                    <img src="${comment.userAvatar || 'https://via.placeholder.com/32'}" 
                         alt="${comment.username}" 
                         class="avatar">
                    <div>
                        <strong>${comment.username}</strong>
                        <small>${formatDate(comment.createdAt?.toDate())}</small>
                    </div>
                </div>
                <p>${comment.content}</p>
            `;
            commentsList.appendChild(commentElement);
        });
    } catch (error) {
        console.error('加载评论失败:', error);
    }
}

// 上传照片
async function uploadPhoto() {
    const fileInput = document.getElementById('photoUpload');
    const title = document.getElementById('photoTitle').value;
    const description = document.getElementById('photoDescription').value;
    const keywords = document.getElementById('photoKeywords').value;
    const isPrivate = document.getElementById('photoPrivate').checked;
    
    if (!fileInput.files[0]) {
        showNotification('请选择照片', 'warning');
        return;
    }
    
    if (!keywords.trim()) {
        showNotification('请输入至少一个关键词', 'warning');
        return;
    }
    
    const keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
    
    try {
        // 显示上传进度
        elements.uploadProgress.style.display = 'block';
        elements.progressBar.style.width = '0%';
        
        // 使用Cloudinary上传
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('upload_preset', 'photo_share_app');
        
        const cloudinaryResponse = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!cloudinaryResponse.ok) {
            throw new Error('图片上传失败');
        }
        
        const cloudinaryData = await cloudinaryResponse.json();
        
        // 更新进度条
        elements.progressBar.style.width = '100%';
        
        // 保存到Firebase
        const photoData = {
            url: cloudinaryData.secure_url,
            title: title,
            description: description,
            keywords: keywordsArray,
            private: isPrivate,
            userId: currentUser.uid,
            likes: 0,
            views: 0,
            comments: 0,
            likedBy: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await firebase.firestore().collection('photos').add(photoData);
        
        // 更新用户照片计数
        await firebase.firestore().collection('users').doc(currentUser.uid).update({
            photos: firebase.firestore.FieldValue.increment(1)
        });
        
        // 重置表单
        elements.uploadForm.reset();
        document.getElementById('imagePreview').style.display = 'none';
        elements.uploadProgress.style.display = 'none';
        
        // 隐藏模态框
        hideAllModals();
        
        // 重新加载照片
        loadPhotos();
        loadFeaturedPhotos();
        
        showNotification('照片上传成功！', 'success');
    } catch (error) {
        console.error('上传失败:', error);
        showNotification('上传失败: ' + error.message, 'error');
        elements.uploadProgress.style.display = 'none';
    }
}

// 搜索功能
async function performSearch() {
    const query = elements.searchInput.value.trim();
    
    if (!query) {
        loadPhotos();
        return;
    }
    
    elements.loading.classList.remove('hide');
    elements.photosGrid.innerHTML = '';
    
    try {
        // 搜索照片
        const photosSnapshot = await firebase.firestore().collection('photos')
            .where('private', '==', false)
            .get();
        
        const searchResults = [];
        
        photosSnapshot.forEach(doc => {
            const photo = { id: doc.id, ...doc.data() };
            
            // 模糊搜索：标题、描述、关键词
            const searchText = (photo.title + ' ' + (photo.description || '') + ' ' + (photo.keywords || []).join(' ')).toLowerCase();
            const searchQuery = query.toLowerCase();
            
            if (searchText.includes(searchQuery)) {
                searchResults.push(photo);
            }
        });
        
        // 搜索用户
        const usersSnapshot = await firebase.firestore().collection('users')
            .where('username', '>=', query)
            .where('username', '<=', query + '\uf8ff')
            .get();
        
        usersSnapshot.forEach(doc => {
            const user = { id: doc.id, ...doc.data(), isUser: true };
            searchResults.push(user);
        });
        
        renderSearchResults(searchResults);
    } catch (error) {
        console.error('搜索失败:', error);
        showNotification('搜索失败', 'error');
    } finally {
        elements.loading.classList.add('hide');
    }
}

// 渲染搜索结果
function renderSearchResults(results) {
    elements.photosGrid.innerHTML = '';
    
    if (results.length === 0) {
        elements.photosGrid.innerHTML = '<p class="no-content">没有找到相关结果</p>';
        return;
    }
    
    results.forEach(result => {
        if (result.isUser) {
            // 显示用户卡片
            const userCard = document.createElement('div');
            userCard.className = 'user-card photo-card';
            userCard.innerHTML = `
                <div class="photo-info">
                    <div class="photo-user">
                        <img src="${result.avatar || 'https://via.placeholder.com/40'}" 
                             alt="${result.username}" 
                             class="avatar">
                        <div>
                            <strong>${result.username}</strong>
                            <small>用户</small>
                        </div>
                    </div>
                    <p>${result.bio || '暂无简介'}</p>
                    <div class="photo-stats">
                        <span>照片: ${result.photos || 0}</span>
                        <span>粉丝: ${result.followers?.length || 0}</span>
                    </div>
                </div>
            `;
            
            userCard.addEventListener('click', () => {
                showUserProfile(result.id);
            });
            
            elements.photosGrid.appendChild(userCard);
        } else {
            // 显示照片卡片
            const photoElement = createPhotoCard(result);
            elements.photosGrid.appendChild(photoElement);
        }
    });
}

// 显示用户资料
async function showUserProfile(userId) {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            showNotification('用户不存在', 'error');
            return;
        }
        
        const user = { id: userDoc.id, ...userDoc.data() };
        
        // 更新侧边栏显示用户资料
        updateSidebarWithUser(user);
        
        // 加载用户的照片
        const photosSnapshot = await firebase.firestore().collection('photos')
            .where('userId', '==', userId)
            .where('private', '==', false)
            .orderBy('createdAt', 'desc')
            .get();
        
        const userPhotos = [];
        photosSnapshot.forEach(doc => {
            userPhotos.push({ id: doc.id, ...doc.data() });
        });
        
        // 更新主区域显示用户照片
        elements.photosGrid.innerHTML = '';
        userPhotos.forEach(photo => {
            const photoElement = createPhotoCard(photo);
            elements.photosGrid.appendChild(photoElement);
        });
        
        // 更新标题
        document.querySelector('.photos-section h2').innerHTML = `<i class="fas fa-user"></i> ${user.username} 的照片`;
        
    } catch (error) {
        console.error('加载用户资料失败:', error);
        showNotification('加载失败', 'error');
    }
}

// 加载用户资料
async function loadUserProfile(userId) {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) return;
        
        const user = { id: userDoc.id, ...userDoc.data() };
        users.set(userId, user);
        
        // 更新侧边栏
        updateSidebarWithUser(user);
        
        // 检查是否是管理员
        if (adminEmails.includes(user.email)) {
            elements.adminPanel.classList.remove('hide');
        }
        
        return user;
    } catch (error) {
        console.error('加载用户资料失败:', error);
    }
}

// 更新侧边栏显示用户资料
function updateSidebarWithUser(user) {
    elements.sidebarAvatar.src = user.avatar || 'https://via.placeholder.com/100';
    elements.sidebarUsername.textContent = user.username;
    elements.sidebarBio.textContent = user.bio || '暂无简介';
    elements.sidebarPhotos.textContent = user.photos || 0;
    elements.sidebarFollowers.textContent = user.followers?.length || 0;
    elements.sidebarFollowing.textContent = user.following?.length || 0;
    
    // 更新关注按钮
    if (currentUser && user.id !== currentUser.uid) {
        const isFollowing = user.followers?.includes(currentUser.uid);
        elements.followBtn.innerHTML = isFollowing ? '<i class="fas fa-user-minus"></i> 取消关注' : '<i class="fas fa-user-plus"></i> 关注';
        elements.followBtn.classList.remove('hide');
        elements.followBtn.onclick = () => toggleFollow(user.id, isFollowing);
    } else {
        elements.followBtn.classList.add('hide');
    }
    
    // 显示编辑资料按钮（如果是当前用户）
    if (currentUser && user.id === currentUser.uid) {
        elements.editProfileBtn.classList.remove('hide');
    } else {
        elements.editProfileBtn.classList.add('hide');
    }
}

// 关注/取消关注
async function toggleFollow(userId, isFollowing) {
    if (!currentUser) {
        showModal(elements.authModal);
        return;
    }
    
    try {
        const userRef = firebase.firestore().collection('users').doc(userId);
        const currentUserRef = firebase.firestore().collection('users').doc(currentUser.uid);
        
        if (isFollowing) {
            // 取消关注
            await userRef.update({
                followers: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
            });
            await currentUserRef.update({
                following: firebase.firestore.FieldValue.arrayRemove(userId)
            });
            showNotification('已取消关注', 'success');
        } else {
            // 关注
            await userRef.update({
                followers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
            });
            await currentUserRef.update({
                following: firebase.firestore.FieldValue.arrayUnion(userId)
            });
            showNotification('关注成功', 'success');
        }
        
        // 重新加载用户资料
        await loadUserProfile(userId);
    } catch (error) {
        showNotification('操作失败: ' + error.message, 'error');
    }
}

// 显示个人资料编辑模态框
async function showProfileEditModal() {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        const user = userDoc.data();
        
        document.getElementById('editUsername').value = user.username || '';
        document.getElementById('editBio').value = user.bio || '';
        document.getElementById('avatarPreview').src = user.avatar || 'https://via.placeholder.com/100';
        
        showModal(elements.profileEditModal);
    } catch (error) {
        showNotification('加载资料失败', 'error');
    }
}

// 更新用户资料
async function updateUserProfile() {
    const username = document.getElementById('editUsername').value;
    const bio = document.getElementById('editBio').value;
    const avatarFile = document.getElementById('editAvatar').files[0];
    
    try {
        let avatarUrl = currentUser.photoURL || '';
        
        // 如果有上传新头像
        if (avatarFile) {
            const formData = new FormData();
            formData.append('file', avatarFile);
            formData.append('upload_preset', 'photo_share_app');
            
            const cloudinaryResponse = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload', {
                method: 'POST',
                body: formData
            });
            
            if (cloudinaryResponse.ok) {
                const cloudinaryData = await cloudinaryResponse.json();
                avatarUrl = cloudinaryData.secure_url;
            }
        }
        
        // 更新Firebase用户资料
        await firebase.firestore().collection('users').doc(currentUser.uid).update({
            username: username,
            bio: bio,
            avatar: avatarUrl
        });
        
        // 更新用户显示名称
        await currentUser.updateProfile({
            displayName: username,
            photoURL: avatarUrl
        });
        
        // 重新加载用户资料
        await loadUserProfile(currentUser.uid);
        
        hideAllModals();
        showNotification('资料更新成功', 'success');
    } catch (error) {
        showNotification('更新失败: ' + error.message, 'error');
    }
}

// 更新登录状态UI
function updateUIForLoggedInUser() {
    elements.loginBtn.classList.add('hide');
    elements.logoutBtn.classList.remove('hide');
    elements.uploadBtn.classList.remove('hide');
    elements.profileBtn.classList.remove('hide');
}

// 更新退出登录UI
function updateUIForLoggedOutUser() {
    elements.loginBtn.classList.remove('hide');
    elements.logoutBtn.classList.add('hide');
    elements.uploadBtn.classList.add('hide');
    elements.profileBtn.classList.add('hide');
    elements.editProfileBtn.classList.add('hide');
    elements.followBtn.classList.add('hide');
    elements.adminPanel.classList.add('hide');
    
    // 重置侧边栏
    elements.sidebarAvatar.src = 'https://via.placeholder.com/100';
    elements.sidebarUsername.textContent = '未登录';
    elements.sidebarBio.textContent = '请登录查看个人资料';
    elements.sidebarPhotos.textContent = '0';
    elements.sidebarFollowers.textContent = '0';
    elements.sidebarFollowing.textContent = '0';
}

// 工具函数：格式化日期
function formatDate(date) {
    if (!date) return '未知时间';
    
    const now = new Date();
    const diff = now - date;
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN');
}

// 应用初始化
document.addEventListener('DOMContentLoaded', initApp);