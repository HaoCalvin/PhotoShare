// Cloudinary配置 - 使用您提供的API密钥
const CLOUDINARY_CONFIG = {
  cloudName: 'dy77idija',
  apiKey: '735299868247252',
  // 注意：API Secret不应在前端代码中暴露
  // 在实际生产环境中，应该通过后端API处理上传
  uploadPreset: 'photo_share_app' // 您需要创建一个上传预设
};
// DOM元素
const elements = {
  // 主题
  themeToggle: document.getElementById('themeToggle'),
  
  // 导航
  homeLink: document.getElementById('homeLink'),
  exploreLink: document.getElementById('exploreLink'),
  uploadLink: document.getElementById('uploadLink'),
  profileLink: document.getElementById('profileLink'),
  loginLink: document.getElementById('loginLink'),
  registerLink: document.getElementById('registerLink'),
  logoutBtn: document.getElementById('logoutBtn'),
  
  // 搜索
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  
  // 模态框
  authModal: document.getElementById('authModal'),
  uploadModal: document.getElementById('uploadModal'),
  imageDetailModal: document.getElementById('imageDetailModal'),
  profileModal: document.getElementById('profileModal'),
  aboutModal: document.getElementById('aboutModal'),
  privacyModal: document.getElementById('privacyModal'),
  
  // 表单
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  uploadForm: document.getElementById('uploadForm'),
  
  // 标签页
  loginTab: document.getElementById('loginTab'),
  registerTab: document.getElementById('registerTab'),
  
  // 内容区域
  popularPhotos: document.getElementById('popularPhotos'),
  recentPhotos: document.getElementById('recentPhotos'),
  welcomeBanner: document.getElementById('welcomeBanner'),
  
  // 统计数据
  totalPhotos: document.getElementById('totalPhotos'),
  totalUsers: document.getElementById('totalUsers'),
  totalLikes: document.getElementById('totalLikes'),
  
  // 页脚链接
  aboutUsLink: document.getElementById('aboutUsLink'),
  privacyLink: document.getElementById('privacyLink'),
  termsLink: document.getElementById('termsLink'),
  contactLink: document.getElementById('contactLink'),
  
  // 加载器
  loader: document.getElementById('loader')
};

// 全局状态
let currentUser = null;
let currentTheme = 'light-mode';
let photos = [];
let users = [];
let userLikes = new Set();

// 初始化应用
async function initApp() {
  showLoader();
  
  // 设置事件监听器
  setupEventListeners();
  
  // 检查登录状态
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await loadUserData(user.uid);
      updateUIForLoggedInUser();
    } else {
      currentUser = null;
      updateUIForLoggedOutUser();
    }
    
    // 加载照片和统计数据
    await loadPhotos();
    await loadStatistics();
    hideLoader();
  });
}

// 设置事件监听器
function setupEventListeners() {
  // 主题切换
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // 导航链接
  elements.homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showHomePage();
  });
  
  elements.exploreLink.addEventListener('click', (e) => {
    e.preventDefault();
    showExplorePage();
  });
  
  elements.uploadLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
      showUploadModal();
    } else {
      showAuthModal();
    }
  });
  
  elements.profileLink.addEventListener('click', (e) => {
    e.preventDefault();
    showUserProfile(currentUser.uid);
  });
  
  elements.loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('login');
  });
  
  elements.registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('register');
  });
  
  elements.logoutBtn.addEventListener('click', handleLogout);
  
  // 搜索功能
  elements.searchBtn.addEventListener('click', handleSearch);
  elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  
  // 认证表单
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.registerForm.addEventListener('submit', handleRegister);
  
  // 标签页切换
  elements.loginTab.addEventListener('click', () => switchAuthTab('login'));
  elements.registerTab.addEventListener('click', () => switchAuthTab('register'));
  
  // 上传表单
  elements.uploadForm.addEventListener('submit', handlePhotoUpload);
  
  // 上传区域点击
  const uploadArea = document.getElementById('uploadArea');
  const photoUpload = document.getElementById('photoUpload');
  
  uploadArea.addEventListener('click', () => photoUpload.click());
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-color)';
    uploadArea.style.background = 'var(--bg-secondary)';
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.background = 'transparent';
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.background = 'transparent';
    
    if (e.dataTransfer.files.length) {
      photoUpload.files = e.dataTransfer.files;
      previewImage(e.dataTransfer.files[0]);
    }
  });
  
  photoUpload.addEventListener('change', (e) => {
    if (e.target.files.length) {
      previewImage(e.target.files[0]);
    }
  });
  
  // 关闭模态框
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
      });
    });
  });
  
  // 模态框外部点击关闭
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });
  
  // 页脚链接
  elements.aboutUsLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAboutModal();
  });
  
  elements.privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPrivacyModal();
  });
  
  // 开始探索按钮
  document.getElementById('getStartedBtn').addEventListener('click', () => {
    if (currentUser) {
      showUploadModal();
    } else {
      showAuthModal('register');
    }
  });
  
  // 查看模式切换
  document.querySelectorAll('.view-option').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.view-option').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const view = this.dataset.view;
      elements.recentPhotos.classList.remove('grid-view', 'list-view');
      elements.recentPhotos.classList.add(`${view}-view`);
    });
  });
}

// 主题切换
function toggleTheme() {
  const body = document.body;
  const themeIcon = elements.themeToggle.querySelector('i');
  
  if (body.classList.contains('light-mode')) {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
    currentTheme = 'dark-mode';
  } else if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    body.classList.add('white-mode');
    themeIcon.classList.remove('fa-sun');
    themeIcon.classList.add('fa-adjust');
    currentTheme = 'white-mode';
  } else {
    body.classList.remove('white-mode');
    body.classList.add('light-mode');
    themeIcon.classList.remove('fa-adjust');
    themeIcon.classList.add('fa-moon');
    currentTheme = 'light-mode';
  }
  
  // 保存主题偏好
  localStorage.setItem('theme', currentTheme);
}

// 显示认证模态框
function showAuthModal(tab = 'login') {
  elements.authModal.classList.add('active');
  switchAuthTab(tab);
}

// 切换认证标签页
function switchAuthTab(tab) {
  if (tab === 'login') {
    elements.loginTab.classList.add('active');
    elements.registerTab.classList.remove('active');
    elements.loginForm.classList.add('active');
    elements.registerForm.classList.remove('active');
  } else {
    elements.registerTab.classList.remove('active');
    elements.loginTab.classList.add('active');
    elements.registerForm.classList.add('active');
    elements.loginForm.classList.remove('active');
  }
}

// 显示上传模态框
function showUploadModal() {
  elements.uploadModal.classList.add('active');
  // 重置表单
  elements.uploadForm.reset();
  document.getElementById('imagePreview').innerHTML = '';
  document.getElementById('imagePreview').style.display = 'none';
}

// 显示图片详情
async function showImageDetail(photoId) {
  const photo = photos.find(p => p.id === photoId);
  if (!photo) return;
  
  const userDoc = await getDoc(doc(db, 'users', photo.userId));
  const userData = userDoc.data();
  
  const content = `
    <div class="image-detail">
      <img src="${photo.imageUrl}" alt="${photo.title}" id="detailImage">
      <div class="image-sidebar">
        <div class="image-info">
          <h2>${photo.title}</h2>
          <p class="photo-author" onclick="showUserProfile('${photo.userId}')">
            <i class="fas fa-user"></i> ${userData?.username || '未知用户'}
          </p>
          <p>${photo.description}</p>
          <div class="keywords">
            ${photo.keywords.map(kw => `<span class="keyword">${kw}</span>`).join('')}
          </div>
        </div>
        
        <div class="image-stats">
          <div class="image-stat">
            <i class="fas fa-heart"></i>
            <p>${photo.likes || 0} 点赞</p>
          </div>
          <div class="image-stat">
            <i class="fas fa-calendar"></i>
            <p>${new Date(photo.timestamp).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div class="image-actions">
          <button class="btn-primary like-btn-detail ${userLikes.has(photoId) ? 'liked' : ''}" 
                  onclick="toggleLike('${photoId}')">
            <i class="fas fa-heart"></i> 
            ${userLikes.has(photoId) ? '已点赞' : '点赞'}
          </button>
          ${currentUser && (currentUser.uid === photo.userId || isAdmin(currentUser.email)) ? `
            <button class="btn-secondary" onclick="deletePhoto('${photoId}')">
              <i class="fas fa-trash"></i> 删除
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('imageDetailContent').innerHTML = content;
  elements.imageDetailModal.classList.add('active');
}

// 显示用户资料
async function showUserProfile(userId) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return;
  
  const userData = userDoc.data();
  const userPhotos = photos.filter(p => p.userId === userId && (p.privacy === 'public' || currentUser?.uid === userId));
  
  const content = `
    <div class="profile-header">
      <img src="${userData.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.username)}" 
           alt="${userData.username}" class="profile-avatar">
      <div class="profile-info">
        <h2>${userData.username} ${isAdmin(userData.email) ? '<span class="admin-badge">管理员</span>' : ''}</h2>
        <p>${userData.bio || '暂无简介'}</p>
        <p><i class="fas fa-envelope"></i> ${userData.email}</p>
      </div>
    </div>
    
    <div class="profile-stats">
      <div class="stat">
        <i class="fas fa-images"></i>
        <div>
          <h3>${userPhotos.length}</h3>
          <p>照片</p>
        </div>
      </div>
      <div class="stat">
        <i class="fas fa-heart"></i>
        <div>
          <h3>${userData.totalLikes || 0}</h3>
          <p>获赞</p>
        </div>
      </div>
      <div class="stat">
        <i class="fas fa-user-friends"></i>
        <div>
          <h3>${userData.followers || 0}</h3>
          <p>粉丝</p>
        </div>
      </div>
    </div>
    
    ${currentUser && currentUser.uid === userId ? `
      <div class="profile-actions">
        <button class="btn-primary" onclick="showEditProfileModal()">
          <i class="fas fa-edit"></i> 编辑资料
        </button>
      </div>
    ` : ''}
    
    <div class="section">
      <h3>发布的照片</h3>
      <div class="photo-grid grid-view">
        ${userPhotos.map(photo => `
          <div class="photo-card" onclick="showImageDetail('${photo.id}')">
            <img src="${photo.imageUrl}" alt="${photo.title}">
            <div class="photo-info">
              <div class="photo-header">
                <div>
                  <div class="photo-title">${photo.title}</div>
                </div>
                <button class="like-btn ${userLikes.has(photo.id) ? 'liked' : ''}" 
                        onclick="event.stopPropagation(); toggleLike('${photo.id}')">
                  <i class="fas fa-heart"></i> ${photo.likes || 0}
                </button>
              </div>
              <div class="keywords">
                ${photo.keywords.slice(0, 3).map(kw => `<span class="keyword">${kw}</span>`).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  document.getElementById('profileContent').innerHTML = content;
  elements.profileModal.classList.add('active');
}

// 显示关于我们模态框
function showAboutModal() {
  elements.aboutModal.classList.add('active');
}

// 显示隐私政策模态框
function showPrivacyModal() {
  elements.privacyModal.classList.add('active');
}

// 显示首页
function showHomePage() {
  // 实现首页逻辑
}

// 显示探索页面
function showExplorePage() {
  // 实现探索页面逻辑
}

// 图片预览
function previewImage(file) {
  const preview = document.getElementById('imagePreview');
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="预览">`;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

// 处理登录
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    elements.authModal.classList.remove('active');
    showNotification('登录成功！', 'success');
  } catch (error) {
    showNotification('登录失败：' + error.message, 'error');
  }
}

// 处理注册
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const bio = document.getElementById('registerBio').value;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 保存用户信息到Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      username,
      email,
      bio,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
      createdAt: new Date().toISOString(),
      totalLikes: 0,
      followers: 0,
      following: 0,
      isAdmin: isAdmin(email)
    });
    
    elements.authModal.classList.remove('active');
    showNotification('注册成功！', 'success');
  } catch (error) {
    showNotification('注册失败：' + error.message, 'error');
  }
}

// 处理注销
async function handleLogout() {
  try {
    await signOut(auth);
    showNotification('已成功退出登录', 'info');
  } catch (error) {
    showNotification('退出登录失败：' + error.message, 'error');
  }
}

// 处理照片上传
async function handlePhotoUpload(e) {
  e.preventDefault();
  
  if (!currentUser) {
    showNotification('请先登录', 'error');
    return;
  }
  
  const title = document.getElementById('photoTitle').value;
  const description = document.getElementById('photoDescription').value;
  const keywords = document.getElementById('photoKeywords').value
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);
  
  if (keywords.length === 0) {
    showNotification('请至少输入一个关键词', 'error');
    return;
  }
  
  const privacy = document.getElementById('photoPrivacy').value;
  const fileInput = document.getElementById('photoUpload');
  
  if (!fileInput.files.length) {
    showNotification('请选择一张照片', 'error');
    return;
  }
  
  const file = fileInput.files[0];
  
  try {
    showLoader();
    
    // 使用Cloudinary上传
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.secure_url) {
      // 保存照片信息到Firestore
      const photoData = {
        title,
        description,
        keywords,
        privacy,
        imageUrl: data.secure_url,
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email.split('@')[0],
        likes: 0,
        views: 0,
        timestamp: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'photos'), photoData);
      
      elements.uploadModal.classList.remove('active');
      showNotification('照片上传成功！', 'success');
      
      // 重新加载照片
      await loadPhotos();
    } else {
      throw new Error('上传到Cloudinary失败');
    }
  } catch (error) {
    showNotification('上传失败：' + error.message, 'error');
  } finally {
    hideLoader();
  }
}

// 处理搜索
async function handleSearch() {
  const query = elements.searchInput.value.trim();
  if (!query) return;
  
  showLoader();
  
  try {
    // 搜索照片
    const photosQuery = queryPhotos(query);
    const photosSnapshot = await getDocs(photosQuery);
    const searchResults = photosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 显示搜索结果
    displaySearchResults(searchResults, query);
  } catch (error) {
    showNotification('搜索失败：' + error.message, 'error');
  } finally {
    hideLoader();
  }
}

// 查询照片（支持模糊搜索）
function queryPhotos(searchTerm) {
  const searchWords = searchTerm.toLowerCase().split(' ');
  
  // 创建多个查询条件
  const queries = [];
  
  // 搜索关键词
  searchWords.forEach(word => {
    queries.push(query(
      collection(db, 'photos'),
      where('keywords', 'array-contains', word),
      where('privacy', '==', 'public'),
      orderBy('timestamp', 'desc')
    ));
  });
  
  // 搜索标题和描述
  searchWords.forEach(word => {
    queries.push(query(
      collection(db, 'photos'),
      where('title', '>=', word),
      where('title', '<=', word + '\uf8ff'),
      where('privacy', '==', 'public'),
      orderBy('title')
    ));
  });
  
  // 返回第一个查询（简化实现，实际应合并结果）
  return queries[0];
}

// 显示搜索结果
function displaySearchResults(results, query) {
  const content = `
    <div class="search-results">
      <h2>搜索结果: "${query}"</h2>
      <p>找到 ${results.length} 个结果</p>
      <div class="photo-grid grid-view">
        ${results.map(photo => `
          <div class="photo-card" onclick="showImageDetail('${photo.id}')">
            <img src="${photo.imageUrl}" alt="${photo.title}">
            <div class="photo-info">
              <div class="photo-header">
                <div>
                  <div class="photo-title">${photo.title}</div>
                  <div class="photo-author" onclick="event.stopPropagation(); showUserProfile('${photo.userId}')">
                    <i class="fas fa-user"></i> ${photo.username}
                  </div>
                </div>
                <button class="like-btn ${userLikes.has(photo.id) ? 'liked' : ''}" 
                        onclick="event.stopPropagation(); toggleLike('${photo.id}')">
                  <i class="fas fa-heart"></i> ${photo.likes || 0}
                </button>
              </div>
              <div class="keywords">
                ${photo.keywords.slice(0, 3).map(kw => `<span class="keyword">${kw}</span>`).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // 替换主内容区域
  document.querySelector('main .container').innerHTML = content;
}

// 加载照片
async function loadPhotos() {
  try {
    // 加载热门照片（按点赞数排序）
    const popularQuery = query(
      collection(db, 'photos'),
      where('privacy', '==', 'public'),
      orderBy('likes', 'desc'),
      limit(8)
    );
    
    const recentQuery = query(
      collection(db, 'photos'),
      where('privacy', '==', 'public'),
      orderBy('timestamp', 'desc'),
      limit(12)
    );
    
    const [popularSnapshot, recentSnapshot] = await Promise.all([
      getDocs(popularQuery),
      getDocs(recentQuery)
    ]);
    
    photos = [
      ...popularSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];
    
    // 去重
    const photoMap = new Map();
    photos.forEach(photo => photoMap.set(photo.id, photo));
    photos = Array.from(photoMap.values());
    
    // 显示热门照片
    displayPopularPhotos(photos.slice(0, 8));
    
    // 显示最新照片
    displayRecentPhotos(photos.slice(0, 12));
  } catch (error) {
    console.error('加载照片失败:', error);
  }
}

// 显示热门照片
function displayPopularPhotos(photos) {
  const html = photos.map(photo => `
    <div class="photo-card" onclick="showImageDetail('${photo.id}')">
      <img src="${photo.imageUrl}" alt="${photo.title}">
      <div class="photo-info">
        <div class="photo-header">
          <div>
            <div class="photo-title">${photo.title}</div>
            <div class="photo-author" onclick="event.stopPropagation(); showUserProfile('${photo.userId}')">
              <i class="fas fa-user"></i> ${photo.username}
            </div>
          </div>
          <button class="like-btn ${userLikes.has(photo.id) ? 'liked' : ''}" 
                  onclick="event.stopPropagation(); toggleLike('${photo.id}')">
            <i class="fas fa-heart"></i> ${photo.likes || 0}
          </button>
        </div>
        <div class="keywords">
          ${photo.keywords.slice(0, 3).map(kw => `<span class="keyword">${kw}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
  
  elements.popularPhotos.innerHTML = html;
}

// 显示最新照片
function displayRecentPhotos(photos) {
  const html = photos.map(photo => `
    <div class="photo-card" onclick="showImageDetail('${photo.id}')">
      <img src="${photo.imageUrl}" alt="${photo.title}">
      <div class="photo-info">
        <div class="photo-header">
          <div>
            <div class="photo-title">${photo.title}</div>
            <div class="photo-author" onclick="event.stopPropagation(); showUserProfile('${photo.userId}')">
              <i class="fas fa-user"></i> ${photo.username}
            </div>
          </div>
          <button class="like-btn ${userLikes.has(photo.id) ? 'liked' : ''}" 
                  onclick="event.stopPropagation(); toggleLike('${photo.id}')">
            <i class="fas fa-heart"></i> ${photo.likes || 0}
          </button>
        </div>
        <div class="keywords">
          ${photo.keywords.slice(0, 3).map(kw => `<span class="keyword">${kw}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
  
  elements.recentPhotos.innerHTML = html;
}

// 加载统计数据
async function loadStatistics() {
  try {
    // 获取照片总数
    const photosSnapshot = await getDocs(query(collection(db, 'photos'), where('privacy', '==', 'public')));
    elements.totalPhotos.textContent = photosSnapshot.size;
    
    // 获取用户总数
    const usersSnapshot = await getDocs(collection(db, 'users'));
    elements.totalUsers.textContent = usersSnapshot.size;
    
    // 获取总点赞数
    let totalLikes = 0;
    photosSnapshot.forEach(doc => {
      totalLikes += doc.data().likes || 0;
    });
    elements.totalLikes.textContent = totalLikes;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 加载用户数据
async function loadUserData(userId) {
  try {
    // 加载用户点赞数据
    const likesQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId)
    );
    
    const likesSnapshot = await getDocs(likesQuery);
    userLikes.clear();
    likesSnapshot.forEach(doc => {
      userLikes.add(doc.data().photoId);
    });
  } catch (error) {
    console.error('加载用户数据失败:', error);
  }
}

// 点赞/取消点赞
async function toggleLike(photoId) {
  if (!currentUser) {
    showNotification('请先登录', 'error');
    return;
  }
  
  try {
    const likeRef = doc(db, 'likes', `${currentUser.uid}_${photoId}`);
    const photoRef = doc(db, 'photos', photoId);
    
    if (userLikes.has(photoId)) {
      // 取消点赞
      await deleteDoc(likeRef);
      await updateDoc(photoRef, {
        likes: increment(-1)
      });
      userLikes.delete(photoId);
    } else {
      // 点赞
      await setDoc(likeRef, {
        userId: currentUser.uid,
        photoId,
        timestamp: new Date().toISOString()
      });
      await updateDoc(photoRef, {
        likes: increment(1)
      });
      userLikes.add(photoId);
    }
    
    // 重新加载照片
    await loadPhotos();
  } catch (error) {
    showNotification('操作失败：' + error.message, 'error');
  }
}

// 删除照片
async function deletePhoto(photoId) {
  if (!currentUser) return;
  
  const photo = photos.find(p => p.id === photoId);
  if (!photo) return;
  
  // 检查权限
  if (currentUser.uid !== photo.userId && !isAdmin(currentUser.email)) {
    showNotification('没有权限删除此照片', 'error');
    return;
  }
  
  if (!confirm('确定要删除这张照片吗？此操作不可撤销。')) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'photos', photoId));
    showNotification('照片已删除', 'success');
    
    // 重新加载照片
    await loadPhotos();
    elements.imageDetailModal.classList.remove('active');
  } catch (error) {
    showNotification('删除失败：' + error.message, 'error');
  }
}

// 更新登录/注销状态UI
function updateUIForLoggedInUser() {
  elements.profileLink.style.display = 'flex';
  elements.logoutBtn.style.display = 'flex';
  elements.loginLink.style.display = 'none';
  elements.registerLink.style.display = 'none';
  
  // 更新个人资料链接文本
  elements.profileLink.innerHTML = `
    <i class="fas fa-user"></i> ${currentUser.displayName || currentUser.email.split('@')[0]}
  `;
}

function updateUIForLoggedOutUser() {
  elements.profileLink.style.display = 'none';
  elements.logoutBtn.style.display = 'none';
  elements.loginLink.style.display = 'flex';
  elements.registerLink.style.display = 'flex';
}

// 显示通知
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// 显示/隐藏加载器
function showLoader() {
  elements.loader.style.display = 'flex';
}

function hideLoader() {
  elements.loader.style.display = 'none';
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 将函数暴露给全局作用域，供HTML内联事件调用
window.showUserProfile = showUserProfile;
window.showImageDetail = showImageDetail;
window.toggleLike = toggleLike;
window.deletePhoto = deletePhoto;
window.showEditProfileModal = function() {
  // 实现编辑资料模态框
  showNotification('编辑资料功能正在开发中', 'info');
};