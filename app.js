// Firebase 配置
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updateEmail,
    updatePassword
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    onSnapshot,
    arrayUnion,
    increment,
    setDoc,
    getDocFromCache
} from 'firebase/firestore';

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ImgBB API 配置
const IMGBB_API_KEY = "cf05bd750e73b32dfb190d209821a2e3"; // 请替换为你的API Key

// 管理员邮箱
const ADMIN_EMAIL = "haochenxihehaohan@outlook.com";

// 全局变量
let currentUser = null;
let currentUploadType = 'photo';
let currentAuthType = 'login';
let currentContentId = null;
let viewerContents = [];
let currentViewerIndex = 0;

// DOM 元素
const elements = {
    // 导航
    homeLink: document.getElementById('homeLink'),
    exploreLink: document.getElementById('exploreLink'),
    hotLink: document.getElementById('hotLink'),
    discussionLink: document.getElementById('discussionLink'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    themeToggle: document.getElementById('themeToggle'),
    uploadBtn: document.getElementById('uploadBtn'),
    profileBtn: document.getElementById('profileBtn'),
    loginBtn: document.getElementById('loginBtn'),
    
    // 内容区域
    homeSection: document.getElementById('homeSection'),
    exploreSection: document.getElementById('exploreSection'),
    hotSection: document.getElementById('hotSection'),
    discussionSection: document.getElementById('discussionSection'),
    profileSection: document.getElementById('profileSection'),
    searchResultsSection: document.getElementById('searchResultsSection'),
    
    // 内容网格
    homeGrid: document.getElementById('homeGrid'),
    exploreGrid: document.getElementById('exploreGrid'),
    hotGrid: document.getElementById('hotGrid'),
    discussionList: document.getElementById('discussionList'),
    profileContainer: document.getElementById('profileContainer'),
    searchResultsGrid: document.getElementById('searchResultsGrid'),
    searchTitle: document.getElementById('searchTitle'),
    
    // 模态框
    uploadModal: document.getElementById('uploadModal'),
    authModal: document.getElementById('authModal'),
    viewerModal: document.getElementById('viewerModal'),
    editProfileModal: document.getElementById('editProfileModal'),
    
    // 上传表单
    uploadTabs: document.querySelectorAll('.upload-tab'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    filePreview: document.getElementById('filePreview'),
    uploadForm: document.getElementById('uploadForm'),
    uploadTitle: document.getElementById('uploadTitle'),
    uploadKeywords: document.getElementById('uploadKeywords'),
    uploadDescription: document.getElementById('uploadDescription'),
    uploadPrivate: document.getElementById('uploadPrivate'),
    
    // 认证表单
    authTabs: document.querySelectorAll('.auth-tab'),
    authTitle: document.getElementById('authTitle'),
    nameGroup: document.getElementById('nameGroup'),
    confirmPasswordGroup: document.getElementById('confirmPasswordGroup'),
    authForm: document.getElementById('authForm'),
    authName: document.getElementById('authName'),
    authEmail: document.getElementById('authEmail'),
    authPassword: document.getElementById('authPassword'),
    authConfirmPassword: document.getElementById('authConfirmPassword'),
    authSubmit: document.getElementById('authSubmit'),
    googleAuthBtn: document.getElementById('googleAuthBtn'),
    
    // 查看器
    viewerMedia: document.getElementById('viewerMedia'),
    viewerAuthor: document.getElementById('viewerAuthor'),
    viewerTitle: document.getElementById('viewerTitle'),
    viewerKeywords: document.getElementById('viewerKeywords'),
    viewerDescription: document.getElementById('viewerDescription'),
    viewerStats: document.getElementById('viewerStats'),
    viewerLike: document.getElementById('viewerLike'),
    viewerLikeCount: document.getElementById('viewerLikeCount'),
    viewerFollow: document.getElementById('viewerFollow'),
    viewerPrev: document.getElementById('viewerPrev'),
    viewerNext: document.getElementById('viewerNext'),
    commentsList: document.getElementById('commentsList'),
    commentText: document.getElementById('commentText'),
    postComment: document.getElementById('postComment'),
    relatedGrid: document.getElementById('relatedGrid'),
    
    // 编辑资料
    avatarPreview: document.getElementById('avatarPreview'),
    avatarInput: document.getElementById('avatarInput'),
    editProfileForm: document.getElementById('editProfileForm'),
    editName: document.getElementById('editName'),
    editEmail: document.getElementById('editEmail'),
    editBio: document.getElementById('editBio'),
    
    // 其他
    toast: document.getElementById('toast'),
    discussionText: document.getElementById('discussionText'),
    postDiscussion: document.getElementById('postDiscussion')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadContent();
});

// 初始化应用
function initializeApp() {
    // 检查主题设置
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // 监听认证状态
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateAuthUI();
        loadContent();
    });
}

// 设置事件监听
function setupEventListeners() {
    // 导航链接
    elements.homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchSection('home');
    });
    
    elements.exploreLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchSection('explore');
    });
    
    elements.hotLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchSection('hot');
    });
    
    elements.discussionLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchSection('discussion');
    });
    
    // 主题切换
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // 上传按钮
    elements.uploadBtn.addEventListener('click', openUploadModal);
    
    // 登录按钮
    elements.loginBtn.addEventListener('click', openAuthModal);
    
    // 个人资料按钮
    elements.profileBtn.addEventListener('click', () => {
        if (currentUser) {
            loadUserProfile(currentUser.uid);
        }
    });
    
    // 搜索
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 上传标签切换
    elements.uploadTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            currentUploadType = tab.dataset.type;
            updateUploadTabs();
            updateFileInput();
        });
    });
    
    // 文件选择
    elements.uploadArea.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // 上传表单提交
    elements.uploadForm.addEventListener('submit', handleUpload);
    
    // 认证标签切换
    elements.authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            currentAuthType = tab.dataset.type;
            updateAuthTabs();
        });
    });
    
    // 认证表单提交
    elements.authForm.addEventListener('submit', handleAuth);
    
    // Google 登录
    elements.googleAuthBtn.addEventListener('click', handleGoogleAuth);
    
    // 模态框关闭
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal);
        });
    });
    
    // 点击模态框外部关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
    
    // 查看器导航
    elements.viewerPrev.addEventListener('click', navigateViewer);
    elements.viewerNext.addEventListener('click', navigateViewer);
    
    // 查看器交互
    elements.viewerLike.addEventListener('click', toggleLike);
    elements.viewerFollow.addEventListener('click', toggleFollow);
    
    // 评论提交
    elements.postComment.addEventListener('click', postComment);
    
    // 讨论区提交
    elements.postDiscussion.addEventListener('click', postDiscussion);
    
    // 编辑资料
    elements.avatarInput.addEventListener('change', handleAvatarSelect);
    elements.editProfileForm.addEventListener('submit', handleProfileUpdate);
    
    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterContent(btn.dataset.filter);
        });
    });
}

// 加载内容
async function loadContent() {
    loadHomeContent();
    loadExploreContent();
    loadHotContent();
    loadDiscussions();
}

// 加载首页内容
async function loadHomeContent() {
    try {
        elements.homeGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const contentsRef = collection(db, 'contents');
        const q = query(contentsRef, orderBy('createdAt', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        
        elements.homeGrid.innerHTML = '';
        const contents = [];
        
        for (const docSnapshot of querySnapshot.docs) {
            const content = docSnapshot.data();
            content.id = docSnapshot.id;
            
            // 检查隐私设置
            if (content.isPrivate && content.authorId !== currentUser?.uid) {
                continue;
            }
            
            contents.push(content);
        }
        
        renderContentGrid(contents, elements.homeGrid);
    } catch (error) {
        console.error('加载首页内容失败:', error);
        showToast('加载失败，请重试');
        elements.homeGrid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>加载失败</h3><p>请稍后重试</p></div>';
    }
}

// 加载发现内容
async function loadExploreContent() {
    try {
        const contentsRef = collection(db, 'contents');
        const q = query(contentsRef, orderBy('views', 'desc'), limit(15));
        const querySnapshot = await getDocs(q);
        
        const contents = querySnapshot.docs.map(doc => {
            const content = doc.data();
            content.id = doc.id;
            return content;
        });
        
        renderContentGrid(contents, elements.exploreGrid);
    } catch (error) {
        console.error('加载发现内容失败:', error);
    }
}

// 加载热门内容
async function loadHotContent() {
    try {
        const contentsRef = collection(db, 'contents');
        const q = query(contentsRef, orderBy('likes', 'desc'), limit(15));
        const querySnapshot = await getDocs(q);
        
        const contents = querySnapshot.docs.map(doc => {
            const content = doc.data();
            content.id = doc.id;
            
            // 检查隐私设置
            if (content.isPrivate && content.authorId !== currentUser?.uid) {
                return null;
            }
            
            return content;
        }).filter(Boolean);
        
        renderContentGrid(contents, elements.hotGrid);
    } catch (error) {
        console.error('加载热门内容失败:', error);
    }
}

// 加载讨论区
async function loadDiscussions() {
    try {
        const discussionsRef = collection(db, 'discussions');
        const q = query(discussionsRef, orderBy('createdAt', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        
        elements.discussionList.innerHTML = '';
        
        for (const docSnapshot of querySnapshot.docs) {
            const discussion = docSnapshot.data();
            discussion.id = docSnapshot.id;
            
            // 获取作者信息
            const authorRef = doc(db, 'users', discussion.authorId);
            const authorSnapshot = await getDoc(authorRef);
            
            if (authorSnapshot.exists()) {
                const author = authorSnapshot.data();
                renderDiscussionItem(discussion, author);
            }
        }
    } catch (error) {
        console.error('加载讨论失败:', error);
    }
}

// 渲染内容网格
function renderContentGrid(contents, container) {
    if (!contents || contents.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><h3>暂无内容</h3><p>快来发布第一个作品吧！</p></div>';
        return;
    }
    
    contents.forEach((content, index) => {
        const item = createContentItem(content, index);
        container.appendChild(item);
    });
}

// 创建内容项
function createContentItem(content, index) {
    const item = document.createElement('div');
    item.className = 'content-item fade-in';
    item.style.animationDelay = `${index * 0.1}s`;
    item.dataset.id = content.id;
    
    const mediaElement = content.type === 'video' 
        ? `<video src="${content.url}" muted loop playsinline></video>`
        : `<img src="${content.url}" alt="${content.title}" loading="lazy">`;
    
    const keywordsHTML = content.keywords && content.keywords.length > 0
        ? content.keywords.slice(0, 3).map(kw => `<span class="keyword-tag">${kw}</span>`).join('')
        : '';
    
    item.innerHTML = `
        ${mediaElement}
        <div class="content-item-overlay">
            <div class="content-item-stats">
                <span><i class="fas fa-heart"></i> ${content.likes || 0}</span>
                <span><i class="fas fa-eye"></i> ${content.views || 0}</span>
            </div>
        </div>
    `;
    
    item.addEventListener('click', () => openViewer(content.id));
    
    return item;
}

// 打开查看器
async function openViewer(contentId) {
    try {
        currentContentId = contentId;
        
        // 获取内容
        const contentRef = doc(db, 'contents', contentId);
        const contentSnapshot = await getDoc(contentRef);
        
        if (!contentSnapshot.exists()) {
            showToast('内容不存在');
            return;
        }
        
        const content = contentSnapshot.data();
        content.id = contentId;
        
        // 更新浏览次数
        await updateDoc(contentRef, {
            views: increment(1)
        });
        content.views = (content.views || 0) + 1;
        
        // 检查隐私设置
        if (content.isPrivate && content.authorId !== currentUser?.uid) {
            showToast('这是私密内容');
            return;
        }
        
        // 获取作者信息
        const authorRef = doc(db, 'users', content.authorId);
        const authorSnapshot = await getDoc(authorRef);
        const author = authorSnapshot.exists() ? authorSnapshot.data() : {};
        
        // 渲染查看器
        renderViewer(content, author);
        
        // 加载评论
        loadComments(contentId);
        
        // 加载相关内容
        loadRelatedContent(content);
        
        // 检查点赞状态
        checkLikeStatus(contentId);
        
        // 检查关注状态
        checkFollowStatus(content.authorId);
        
        // 显示模态框
        openModal(elements.viewerModal);
    } catch (error) {
        console.error('打开查看器失败:', error);
        showToast('加载失败，请重试');
    }
}

// 渲染查看器
function renderViewer(content, author) {
    const mediaElement = content.type === 'video'
        ? `<video src="${content.url}" controls autoplay playsinline></video>`
        : `<img src="${content.url}" alt="${content.title}">`;
    
    elements.viewerMedia.innerHTML = mediaElement;
    
    // 图片缩放功能
    if (content.type === 'photo') {
        const img = elements.viewerMedia.querySelector('img');
        img.addEventListener('click', () => {
            elements.viewerMedia.classList.toggle('zoomed');
        });
    }
    
    elements.viewerAuthor.innerHTML = `
        <img src="${author.avatarUrl || 'https://via.placeholder.com/40'}" alt="${author.displayName || '用户'}">
        <div class="viewer-author-info">
            <span class="viewer-author-name">${author.displayName || '用户'}</span>
        </div>
    `;
    
    elements.viewerTitle.textContent = content.title || '未命名';
    elements.viewerKeywords.innerHTML = content.keywords && content.keywords.length > 0
        ? content.keywords.map(kw => `<span class="keyword-tag">${kw}</span>`).join('')
        : '<span class="keyword-tag">无关键词</span>';
    elements.viewerDescription.textContent = content.description || '暂无描述';
    elements.viewerStats.innerHTML = `
        <span><i class="fas fa-heart"></i> ${content.likes || 0} 点赞</span>
        <span><i class="fas fa-eye"></i> ${content.views || 0} 浏览</span>
        <span><i class="fas fa-clock"></i> ${formatDate(content.createdAt)}</span>
    `;
    elements.viewerLikeCount.textContent = content.likes || 0;
    
    // 更新点赞按钮状态
    if (content.likedBy && content.likedBy.includes(currentUser?.uid)) {
        elements.viewerLike.classList.add('active');
    } else {
        elements.viewerLike.classList.remove('active');
    }
    
    // 更新关注按钮
    if (author.followers && author.followers.includes(currentUser?.uid)) {
        elements.viewerFollow.innerHTML = '<i class="fas fa-user-check"></i><span>已关注</span>';
    } else {
        elements.viewerFollow.innerHTML = '<i class="far fa-user-plus"></i><span>关注</span>';
    }
    
    // 点击作者查看个人资料
    elements.viewerAuthor.querySelector('.viewer-author-name').addEventListener('click', () => {
        closeModal(elements.viewerModal);
        loadUserProfile(author.id || content.authorId);
    });
}

// 加载评论
async function loadComments(contentId) {
    try {
        elements.commentsList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const commentsRef = collection(db, 'comments');
        const q = query(commentsRef, where('contentId', '==', contentId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        elements.commentsList.innerHTML = '';
        
        if (querySnapshot.empty) {
            elements.commentsList.innerHTML = '<div class="empty-state"><p>暂无评论，快来抢沙发吧！</p></div>';
            return;
        }
        
        for (const docSnapshot of querySnapshot.docs) {
            const comment = docSnapshot.data();
            comment.id = docSnapshot.id;
            
            // 获取评论者信息
            const commenterRef = doc(db, 'users', comment.authorId);
            const commenterSnapshot = await getDoc(commenterRef);
            
            if (commenterSnapshot.exists()) {
                const commenter = commenterSnapshot.data();
                renderCommentItem(comment, commenter);
            }
        }
    } catch (error) {
        console.error('加载评论失败:', error);
        elements.commentsList.innerHTML = '<div class="empty-state"><p>加载评论失败</p></div>';
    }
}

// 渲染评论项
function renderCommentItem(comment, commenter) {
    const item = document.createElement('div');
    item.className = 'comment-item';
    
    item.innerHTML = `
        <img src="${commenter.avatarUrl || 'https://via.placeholder.com/35'}" alt="${commenter.displayName || '用户'}">
        <div class="comment-content">
            <div class="comment-author">${commenter.displayName || '用户'}</div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-time">${formatDate(comment.createdAt)}</div>
        </div>
    `;
    
    elements.commentsList.appendChild(item);
}

// 发布评论
async function postComment() {
    if (!currentUser) {
        showToast('请先登录');
        openAuthModal();
        return;
    }
    
    const text = elements.commentText.value.trim();
    if (!text) {
        showToast('请输入评论内容');
        return;
    }
    
    try {
        await addDoc(collection(db, 'comments'), {
            contentId: currentContentId,
            authorId: currentUser.uid,
            text: text,
            createdAt: new Date().toISOString()
        });
        
        elements.commentText.value = '';
        showToast('评论成功');
        loadComments(currentContentId);
    } catch (error) {
        console.error('发布评论失败:', error);
        showToast('发布失败，请重试');
    }
}

// 加载相关内容
async function loadRelatedContent(content) {
    try {
        let relatedQuery;
        
        if (content.keywords && content.keywords.length > 0) {
            // 基于关键词搜索相关内容
            const keyword = content.keywords[0];
            relatedQuery = query(
                collection(db, 'contents'),
                where('keywords', 'array-contains', keyword),
                limit(6)
            );
        } else {
            // 随机推荐
            relatedQuery = query(
                collection(db, 'contents'),
                orderBy('createdAt', 'desc'),
                limit(6)
            );
        }
        
        const querySnapshot = await getDocs(relatedQuery);
        const relatedContents = querySnapshot.docs
            .map(doc => {
                const c = doc.data();
                c.id = doc.id;
                return c;
            })
            .filter(c => c.id !== content.id && (!c.isPrivate || c.authorId === currentUser?.uid))
            .slice(0, 6);
        
        renderRelatedContent(relatedContents);
    } catch (error) {
        console.error('加载相关内容失败:', error);
    }
}

// 渲染相关内容
function renderRelatedContent(contents) {
    if (!contents || contents.length === 0) {
        elements.relatedGrid.innerHTML = '<div class="empty-state"><p>暂无相关内容</p></div>';
        return;
    }
    
    elements.relatedGrid.innerHTML = '';
    
    contents.forEach(content => {
        const item = document.createElement('div');
        item.className = 'related-item';
        
        const mediaElement = content.type === 'video'
            ? `<video src="${content.url}" muted loop playsinline></video>`
            : `<img src="${content.url}" alt="${content.title}">`;
        
        item.innerHTML = mediaElement;
        item.addEventListener('click', () => {
            closeModal(elements.viewerModal);
            openViewer(content.id);
        });
        
        elements.relatedGrid.appendChild(item);
    });
}

// 检查点赞状态
async function checkLikeStatus(contentId) {
    if (!currentUser) return;
    
    try {
        const contentRef = doc(db, 'contents', contentId);
        const contentSnapshot = await getDoc(contentRef);
        
        if (contentSnapshot.exists()) {
            const content = contentSnapshot.data();
            const isLiked = content.likedBy && content.likedBy.includes(currentUser.uid);
            
            if (isLiked) {
                elements.viewerLike.classList.add('active');
                elements.viewerLike.querySelector('i').className = 'fas fa-heart';
            } else {
                elements.viewerLike.classList.remove('active');
                elements.viewerLike.querySelector('i').className = 'far fa-heart';
            }
        }
    } catch (error) {
        console.error('检查点赞状态失败:', error);
    }
}

// 切换点赞
async function toggleLike() {
    if (!currentUser) {
        showToast('请先登录');
        openAuthModal();
        return;
    }
    
    try {
        const contentRef = doc(db, 'contents', currentContentId);
        const contentSnapshot = await getDoc(contentRef);
        
        if (!contentSnapshot.exists()) {
            showToast('内容不存在');
            return;
        }
        
        const content = contentSnapshot.data();
        const isLiked = content.likedBy && content.likedBy.includes(currentUser.uid);
        
        if (isLiked) {
            // 取消点赞
            await updateDoc(contentRef, {
                likes: increment(-1),
                likedBy: content.likedBy.filter(id => id !== currentUser.uid)
            });
            elements.viewerLike.classList.remove('active');
            elements.viewerLike.querySelector('i').className = 'far fa-heart';
            showToast('已取消点赞');
        } else {
            // 添加点赞
            await updateDoc(contentRef, {
                likes: increment(1),
                likedBy: arrayUnion(currentUser.uid)
            });
            elements.viewerLike.classList.add('active');
            elements.viewerLike.querySelector('i').className = 'fas fa-heart';
            showToast('点赞成功');
        }
        
        // 更新点赞数
        const newSnapshot = await getDoc(contentRef);
        const newContent = newSnapshot.data();
        elements.viewerLikeCount.textContent = newContent.likes || 0;
        
    } catch (error) {
        console.error('点赞失败:', error);
        showToast('操作失败，请重试');
    }
}

// 检查关注状态
async function checkFollowStatus(authorId) {
    if (!currentUser || currentUser.uid === authorId) {
        elements.viewerFollow.style.display = 'none';
        return;
    }
    
    elements.viewerFollow.style.display = 'flex';
    
    try {
        const authorRef = doc(db, 'users', authorId);
        const authorSnapshot = await getDoc(authorRef);
        
        if (authorSnapshot.exists()) {
            const author = authorSnapshot.data();
            const isFollowing = author.followers && author.followers.includes(currentUser.uid);
            
            if (isFollowing) {
                elements.viewerFollow.innerHTML = '<i class="fas fa-user-check"></i><span>已关注</span>';
            } else {
                elements.viewerFollow.innerHTML = '<i class="far fa-user-plus"></i><span>关注</span>';
            }
        }
    } catch (error) {
        console.error('检查关注状态失败:', error);
    }
}

// 切换关注
async function toggleFollow() {
    if (!currentUser) {
        showToast('请先登录');
        openAuthModal();
        return;
    }
    
    try {
        // 获取当前内容作者ID
        const contentRef = doc(db, 'contents', currentContentId);
        const contentSnapshot = await getDoc(contentRef);
        const content = contentSnapshot.data();
        const authorId = content.authorId;
        
        if (currentUser.uid === authorId) {
            showToast('不能关注自己');
            return;
        }
        
        const authorRef = doc(db, 'users', authorId);
        const authorSnapshot = await getDoc(authorRef);
        
        if (!authorSnapshot.exists()) {
            showToast('用户不存在');
            return;
        }
        
        const author = authorSnapshot.data();
        const isFollowing = author.followers && author.followers.includes(currentUser.uid);
        
        if (isFollowing) {
            // 取消关注
            await updateDoc(authorRef, {
                followers: author.followers.filter(id => id !== currentUser.uid),
                followerCount: increment(-1)
            });
            elements.viewerFollow.innerHTML = '<i class="far fa-user-plus"></i><span>关注</span>';
            showToast('已取消关注');
        } else {
            // 添加关注
            await updateDoc(authorRef, {
                followers: arrayUnion(currentUser.uid),
                followerCount: increment(1)
            });
            elements.viewerFollow.innerHTML = '<i class="fas fa-user-check"></i><span>已关注</span>';
            showToast('关注成功');
        }
        
    } catch (error) {
        console.error('关注失败:', error);
        showToast('操作失败，请重试');
    }
}

// 导航查看器
function navigateViewer(e) {
    const direction = e.currentTarget.id === 'viewerPrev' ? -1 : 1;
    const newIndex = currentViewerIndex + direction;
    
    if (newIndex >= 0 && newIndex < viewerContents.length) {
        currentViewerIndex = newIndex;
        openViewer(viewerContents[newIndex].id);
    }
}

// 打开上传模态框
function openUploadModal() {
    if (!currentUser) {
        showToast('请先登录');
        openAuthModal();
        return;
    }
    
    currentUploadType = 'photo';
    updateUploadTabs();
    updateFileInput();
    resetUploadForm();
    openModal(elements.uploadModal);
}

// 更新上传标签
function updateUploadTabs() {
    elements.uploadTabs.forEach(tab => {
        if (tab.dataset.type === currentUploadType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// 更新文件输入
function updateFileInput() {
    if (currentUploadType === 'photo') {
        elements.fileInput.accept = 'image/*';
    } else {
        elements.fileInput.accept = 'video/*';
    }
}

// 处理文件选择
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 验证文件大小
    const maxSize = currentUploadType === 'photo' ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 图片10MB，视频100MB
    if (file.size > maxSize) {
        showToast('文件大小超过限制');
        return;
    }
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.filePreview.innerHTML = currentUploadType === 'photo'
            ? `<img src="${e.target.result}" alt="预览">`
            : `<video src="${e.target.result}" controls></video>`;
        elements.filePreview.classList.add('active');
        elements.uploadArea.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// 处理上传
async function handleUpload(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('请先登录');
        return;
    }
    
    const file = elements.fileInput.files[0];
    if (!file) {
        showToast('请选择文件');
        return;
    }
    
    const title = elements.uploadTitle.value.trim();
    const keywordsText = elements.uploadKeywords.value.trim();
    const description = elements.uploadDescription.value.trim();
    const isPrivate = elements.uploadPrivate.checked;
    
    if (!title) {
        showToast('请输入标题');
        return;
    }
    
    if (!keywordsText) {
        showToast('请至少输入一个关键词');
        return;
    }
    
    // 处理关键词
    const keywords = keywordsText.split(/[,，]/)
        .map(kw => kw.trim())
        .filter(kw => kw.length > 0);
    
    if (keywords.length === 0) {
        showToast('请至少输入一个关键词');
        return;
    }
    
    try {
        showToast('正在上传...');
        
        // 上传文件到 Firebase Storage
        const storageRef = ref(storage, `contents/${currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        
        // 保存内容信息到 Firestore
        await addDoc(collection(db, 'contents'), {
            url: downloadUrl,
            type: currentUploadType,
            title: title,
            keywords: keywords,
            description: description,
            isPrivate: isPrivate,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || '用户',
            authorAvatar: currentUser.photoURL || '',
            likes: 0,
            views: 0,
            createdAt: new Date().toISOString()
        });
        
        showToast('上传成功！');
        resetUploadForm();
        closeModal(elements.uploadModal);
        loadContent();
        
    } catch (error) {
        console.error('上传失败:', error);
        showToast('上传失败，请重试');
    }
}

// 重置上传表单
function resetUploadForm() {
    elements.uploadForm.reset();
    elements.filePreview.innerHTML = '';
    elements.filePreview.classList.remove('active');
    elements.uploadArea.style.display = 'block';
}

// 打开认证模态框
function openAuthModal() {
    currentAuthType = 'login';
    updateAuthTabs();
    elements.authForm.reset();
    openModal(elements.authModal);
}

// 更新认证标签
function updateAuthTabs() {
    elements.authTabs.forEach(tab => {
        if (tab.dataset.type === currentAuthType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    if (currentAuthType === 'login') {
        elements.authTitle.textContent = '登录';
        elements.nameGroup.style.display = 'none';
        elements.confirmPasswordGroup.style.display = 'none';
        elements.authSubmit.textContent = '登录';
    } else {
        elements.authTitle.textContent = '注册';
        elements.nameGroup.style.display = 'block';
        elements.confirmPasswordGroup.style.display = 'block';
        elements.authSubmit.textContent = '注册';
    }
}

// 处理认证
async function handleAuth(e) {
    e.preventDefault();
    
    const name = elements.authName.value.trim();
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;
    const confirmPassword = elements.authConfirmPassword.value;
    
    if (!email || !password) {
        showToast('请填写邮箱和密码');
        return;
    }
    
    if (currentAuthType === 'register') {
        if (!name) {
            showToast('请输入用户名');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('两次密码不一致');
            return;
        }
        
        if (password.length < 6) {
            showToast('密码长度至少6位');
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // 更新用户资料
            await updateProfile(user, {
                displayName: name
            });
            
            // 创建用户文档
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                displayName: name,
                email: email,
                avatarUrl: '',
                bio: '',
                followerCount: 0,
                followingCount: 0,
                followers: [],
                following: [],
                createdAt: new Date().toISOString(),
                isAdmin: email === ADMIN_EMAIL
            });
            
            showToast('注册成功！');
            closeModal(elements.authModal);
            
        } catch (error) {
            console.error('注册失败:', error);
            showToast(error.message || '注册失败');
        }
    } else {
        // 登录
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast('登录成功！');
            closeModal(elements.authModal);
            
        } catch (error) {
            console.error('登录失败:', error);
            showToast('邮箱或密码错误');
        }
    }
}

// 处理 Google 认证
async function handleGoogleAuth() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // 检查用户文档是否存在
        const userRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);
        
        if (!userSnapshot.exists()) {
            // 创建新用户文档
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName || '用户',
                email: user.email || '',
                avatarUrl: user.photoURL || '',
                bio: '',
                followerCount: 0,
                followingCount: 0,
                followers: [],
                following: [],
                createdAt: new Date().toISOString(),
                isAdmin: user.email === ADMIN_EMAIL
            });
        }
        
        showToast('登录成功！');
        closeModal(elements.authModal);
        
    } catch (error) {
        console.error('Google 登录失败:', error);
        showToast('登录失败，请重试');
    }
}

// 更新认证UI
function updateAuthUI() {
    if (currentUser) {
        elements.loginBtn.style.display = 'none';
        elements.profileBtn.style.display = 'flex';
        elements.uploadBtn.disabled = false;
    } else {
        elements.loginBtn.style.display = 'flex';
        elements.profileBtn.style.display = 'none';
        elements.uploadBtn.disabled = true;
    }
}

// 加载用户资料
async function loadUserProfile(userId) {
    try {
        // 获取用户信息
        const userRef = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userRef);
        
        if (!userSnapshot.exists()) {
            showToast('用户不存在');
            return;
        }
        
        const user = userSnapshot.data();
        
        // 检查是否是当前用户
        const isCurrentUser = currentUser && currentUser.uid === userId;
        const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
        
        // 渲染个人资料页
        renderProfilePage(user, isCurrentUser, isAdmin);
        
        // 加载用户内容
        await loadUserContents(userId);
        
        // 切换到个人资料区域
        switchSection('profile');
        
    } catch (error) {
        console.error('加载用户资料失败:', error);
        showToast('加载失败，请重试');
    }
}

// 渲染个人资料页
function renderProfilePage(user, isCurrentUser, isAdmin) {
    elements.profileContainer.innerHTML = `
        <div class="profile-header">
            <img src="${user.avatarUrl || 'https://via.placeholder.com/150'}" alt="${user.displayName || '用户'}" class="profile-avatar">
            <h1 class="profile-name">${user.displayName || '用户'}</h1>
            <p class="profile-bio">${user.bio || '这个人很懒，还没有填写简介'}</p>
            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="profile-stat-value">${user.followerCount || 0}</div>
                    <div class="profile-stat-label">粉丝</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${user.followingCount || 0}</div>
                    <div class="profile-stat-label">关注</div>
                </div>
                ${isAdmin && user.email === ADMIN_EMAIL ? '<div class="profile-stat"><div class="profile-stat-value">管理员</div></div>' : ''}
            </div>
            <div class="profile-actions">
                ${isCurrentUser ? `
                    <button class="nav-btn primary" id="editProfileBtn"><i class="fas fa-edit"></i> 编辑资料</button>
                ` : `
                    <button class="nav-btn" id="followBtn"><i class="far fa-user-plus"></i> 关注</button>
                    <button class="nav-btn" id="messageBtn"><i class="fas fa-envelope"></i> 私信</button>
                `}
            </div>
        </div>
        <div class="profile-content">
            <div class="profile-tabs">
                <button class="profile-tab active" data-tab="contents">作品</button>
                <button class="profile-tab" data-tab="liked">点赞</button>
            </div>
            <div class="content-grid" id="profileContentGrid"></div>
        </div>
    `;
    
    // 绑定事件
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openEditProfileModal);
    }
    
    // 关注按钮
    const followBtn = document.getElementById('followBtn');
    if (followBtn) {
        followBtn.addEventListener('click', () => toggleProfileFollow(user));
        
        // 更新关注按钮状态
        if (currentUser && user.followers && user.followers.includes(currentUser.uid)) {
            followBtn.innerHTML = '<i class="fas fa-user-check"></i> 已关注';
        }
    }
    
    // 标签切换
    const profileTabs = document.querySelectorAll('.profile-tab');
    profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            profileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabType = tab.dataset.tab;
            if (tabType === 'contents') {
                loadUserContents(user.uid);
            } else if (tabType === 'liked') {
                loadUserLikedContents(user.uid);
            }
        });
    });
}

// 加载用户内容
async function loadUserContents(userId) {
    try {
        const grid = document.getElementById('profileContentGrid');
        grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const contentsRef = collection(db, 'contents');
        const q = query(contentsRef, where('authorId', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const contents = [];
        const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
        
        for (const docSnapshot of querySnapshot.docs) {
            const content = docSnapshot.data();
            content.id = docSnapshot.id;
            
            // 私密内容只对作者和管理员可见
            if (!content.isPrivate || content.authorId === currentUser?.uid || isAdmin) {
                contents.push(content);
            }
        }
        
        if (contents.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><h3>暂无作品</h3><p>快来发布第一个作品吧！</p></div>';
            return;
        }
        
        grid.innerHTML = '';
        contents.forEach((content, index) => {
            const item = createContentItem(content, index);
            
            // 管理员删除按钮
            if (isAdmin && content.authorId !== currentUser?.uid) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '10px';
                deleteBtn.style.right = '10px';
                deleteBtn.style.background = 'rgba(244, 67, 54, 0.9)';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.borderRadius = '50%';
                deleteBtn.style.width = '35px';
                deleteBtn.style.height = '35px';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteContent(content.id);
                });
                item.appendChild(deleteBtn);
            }
            
            // 作者可以删除自己的内容
            if (currentUser && content.authorId === currentUser.uid) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '10px';
                deleteBtn.style.right = '10px';
                deleteBtn.style.background = 'rgba(244, 67, 54, 0.9)';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.borderRadius = '50%';
                deleteBtn.style.width = '35px';
                deleteBtn.style.height = '35px';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteContent(content.id);
                });
                item.appendChild(deleteBtn);
            }
            
            grid.appendChild(item);
        });
        
    } catch (error) {
        console.error('加载用户内容失败:', error);
        const grid = document.getElementById('profileContentGrid');
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>加载失败</h3><p>请稍后重试</p></div>';
    }
}

// 加载用户点赞的内容
async function loadUserLikedContents(userId) {
    try {
        const grid = document.getElementById('profileContentGrid');
        grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const contentsRef = collection(db, 'contents');
        const querySnapshot = await getDocs(contentsRef);
        
        const likedContents = [];
        
        for (const docSnapshot of querySnapshot.docs) {
            const content = docSnapshot.data();
            content.id = docSnapshot.id;
            
            if (content.likedBy && content.likedBy.includes(userId)) {
                // 检查隐私设置
                if (!content.isPrivate || content.authorId === currentUser?.uid) {
                    likedContents.push(content);
                }
            }
        }
        
        if (likedContents.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><h3>暂无点赞</h3><p>去喜欢一些精彩的内容吧！</p></div>';
            return;
        }
        
        grid.innerHTML = '';
        likedContents.forEach((content, index) => {
            const item = createContentItem(content, index);
            grid.appendChild(item);
        });
        
    } catch (error) {
        console.error('加载点赞内容失败:', error);
        const grid = document.getElementById('profileContentGrid');
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>加载失败</h3><p>请稍后重试</p></div>';
    }
}

// 删除内容
async function deleteContent(contentId) {
    if (!confirm('确定要删除这个内容吗？')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'contents', contentId));
        showToast('删除成功');
        
        // 重新加载当前页面
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection.id === 'profileSection') {
            // 获取当前查看的用户ID
            const profileName = document.querySelector('.profile-name');
            // 需要重新加载用户资料
            const userMatch = document.querySelector('.profile-header')?.querySelector('.profile-name');
        } else {
            loadContent();
        }
        
    } catch (error) {
        console.error('删除失败:', error);
        showToast('删除失败，请重试');
    }
}

// 切换个人资料关注
async function toggleProfileFollow(user) {
    if (!currentUser) {
        showToast('请先登录');
        openAuthModal();
        return;
    }
    
    if (currentUser.uid === user.uid) {
        showToast('不能关注自己');
        return;
    }
    
    try {
        const userRef = doc(db, 'users', user.uid);
        const isFollowing = user.followers && user.followers.includes(currentUser.uid);
        
        if (isFollowing) {
            // 取消关注
            await updateDoc(userRef, {
                followers: user.followers.filter(id => id !== currentUser.uid),
                followerCount: increment(-1)
            });
            showToast('已取消关注');
        } else {
            // 添加关注
            await updateDoc(userRef, {
                followers: arrayUnion(currentUser.uid),
                followerCount: increment(1)
            });
            showToast('关注成功');
        }
        
        // 重新加载用户资料
        loadUserProfile(user.uid);
        
    } catch (error) {
        console.error('关注失败:', error);
        showToast('操作失败，请重试');
    }
}

// 打开编辑资料模态框
function openEditProfileModal() {
    if (!currentUser) return;
    
    elements.avatarPreview.src = currentUser.photoURL || 'https://via.placeholder.com/150';
    elements.editName.value = currentUser.displayName || '';
    elements.editEmail.value = currentUser.email || '';
    elements.editBio.value = currentUser.bio || '';
    
    openModal(elements.editProfileModal);
}

// 处理头像选择
function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) { // 5MB
        showToast('文件大小不能超过5MB');
        return;
    }
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.avatarPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 处理个人资料更新
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const name = elements.editName.value.trim();
    const email = elements.editEmail.value.trim();
    const bio = elements.editBio.value.trim();
    const avatarFile = elements.avatarInput.files[0];
    
    if (!name || !email) {
        showToast('请填写必填项');
        return;
    }
    
    try {
        showToast('正在更新...');
        
        // 更新头像
        if (avatarFile) {
            const avatarRef = ref(storage, `avatars/${currentUser.uid}/${Date.now()}_${avatarFile.name}`);
            await uploadBytes(avatarRef, avatarFile);
            const avatarUrl = await getDownloadURL(avatarRef);
            
            // 更新 Firebase Auth
            await updateProfile(currentUser, {
                displayName: name,
                photoURL: avatarUrl
            });
            
            // 更新 Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                displayName: name,
                email: email,
                avatarUrl: avatarUrl,
                bio: bio
            });
        } else {
            // 更新 Firebase Auth
            await updateProfile(currentUser, {
                displayName: name
            });
            
            // 更新 Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                displayName: name,
                email: email,
                bio: bio
            });
        }
        
        showToast('更新成功！');
        closeModal(elements.editProfileModal);
        loadUserProfile(currentUser.uid);
        
    } catch (error) {
        console.error('更新失败:', error);
        showToast(error.message || '更新失败，请重试');
    }
}

// 发布讨论
async function postDiscussion() {
    if (!currentUser) {
        showToast('请先登录');
        openAuthModal();
        return;
    }
    
    const text = elements.discussionText.value.trim();
    if (!text) {
        showToast('请输入讨论内容');
        return;
    }
    
    try {
        await addDoc(collection(db, 'discussions'), {
            text: text,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || '用户',
            authorAvatar: currentUser.photoURL || '',
            likes: 0,
            comments: 0,
            createdAt: new Date().toISOString()
        });
        
        elements.discussionText.value = '';
        showToast('发布成功');
        loadDiscussions();
        
    } catch (error) {
        console.error('发布讨论失败:', error);
        showToast('发布失败，请重试');
    }
}

// 渲染讨论项
function renderDiscussionItem(discussion, author) {
    const item = document.createElement('div');
    item.className = 'discussion-item fade-in';
    
    item.innerHTML = `
        <div class="discussion-header">
            <img src="${author.avatarUrl || 'https://via.placeholder.com/45'}" alt="${author.displayName || '用户'}">
            <div class="discussion-author-info">
                <h4>${author.displayName || '用户'}</h4>
                <span>${formatDate(discussion.createdAt)}</span>
            </div>
        </div>
        <div class="discussion-content">${discussion.text}</div>
        <div class="discussion-actions">
            <span class="discussion-action"><i class="far fa-heart"></i> ${discussion.likes || 0}</span>
            <span class="discussion-action"><i class="far fa-comment"></i> ${discussion.comments || 0}</span>
        </div>
    `;
    
    elements.discussionList.appendChild(item);
}

// 执行搜索
async function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) {
        showToast('请输入搜索内容');
        return;
    }
    
    try {
        elements.searchResultsGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
        elements.searchTitle.textContent = `搜索结果: ${query}`;
        
        // 搜索内容
        const contentsRef = collection(db, 'contents');
        const querySnapshot = await getDocs(contentsRef);
        
        const results = [];
        const searchLower = query.toLowerCase();
        
        for (const docSnapshot of querySnapshot.docs) {
            const content = docSnapshot.data();
            content.id = docSnapshot.id;
            
            // 检查隐私设置
            if (content.isPrivate && content.authorId !== currentUser?.uid) {
                continue;
            }
            
            // 模糊搜索：检查标题、关键词、描述、作者名
            const titleMatch = content.title && content.title.toLowerCase().includes(searchLower);
            const keywordMatch = content.keywords && content.keywords.some(kw => kw.toLowerCase().includes(searchLower));
            const descriptionMatch = content.description && content.description.toLowerCase().includes(searchLower);
            const authorMatch = content.authorName && content.authorName.toLowerCase().includes(searchLower);
            
            if (titleMatch || keywordMatch || descriptionMatch || authorMatch) {
                results.push(content);
            }
        }
        
        // 切换到搜索结果区域
        switchSection('searchResults');
        
        if (results.length === 0) {
            elements.searchResultsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>未找到相关内容</h3><p>试试其他关键词吧</p></div>';
            return;
        }
        
        renderContentGrid(results, elements.searchResultsGrid);
        showToast(`找到 ${results.length} 个结果`);
        
    } catch (error) {
        console.error('搜索失败:', error);
        showToast('搜索失败，请重试');
    }
}

// 筛选内容
function filterContent(filter) {
    const items = document.querySelectorAll('#homeGrid .content-item');
    
    items.forEach(item => {
        const contentId = item.dataset.id;
        // 这里需要重新获取内容信息来判断类型
        // 简化处理：重新加载首页内容
    });
    
    // 重新加载首页内容
    if (filter === 'all') {
        loadHomeContent();
    } else if (filter === 'photos') {
        loadFilteredHomeContent('photo');
    } else if (filter === 'videos') {
        loadFilteredHomeContent('video');
    }
}

// 加载筛选后的首页内容
async function loadFilteredHomeContent(type) {
    try {
        elements.homeGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const contentsRef = collection(db, 'contents');
        const q = query(contentsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const contents = [];
        
        for (const docSnapshot of querySnapshot.docs) {
            const content = docSnapshot.data();
            content.id = docSnapshot.id;
            
            // 检查类型和隐私设置
            if (content.type === type && (!content.isPrivate || content.authorId === currentUser?.uid)) {
                contents.push(content);
            }
        }
        
        renderContentGrid(contents, elements.homeGrid);
    } catch (error) {
        console.error('加载筛选内容失败:', error);
        showToast('加载失败，请重试');
    }
}

// 切换主题
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    let newTheme;
    
    if (currentTheme === 'dark') {
        newTheme = 'light';
    } else if (currentTheme === 'light') {
        newTheme = 'white';
    } else {
        newTheme = 'dark';
    }
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// 更新主题图标
function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    
    if (theme === 'dark') {
        icon.className = 'fas fa-moon';
    } else if (theme === 'light') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-cloud-sun';
    }
}

// 切换区域
function switchSection(sectionId) {
    // 隐藏所有区域
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示目标区域
    const targetSection = document.getElementById(`${sectionId}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // 更新导航链接状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.getElementById(`${sectionId}Link`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// 打开模态框
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭模态框
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// 显示Toast提示
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('active');
    
    setTimeout(() => {
        elements.toast.classList.remove('active');
    }, 3000);
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
        return '刚刚';
    } else if (minutes < 60) {
        return `${minutes} 分钟前`;
    } else if (hours < 24) {
        return `${hours} 小时前`;
    } else if (days < 7) {
        return `${days} 天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// 导出函数供外部使用
window.app = {
    openViewer,
    loadUserProfile,
    performSearch
};