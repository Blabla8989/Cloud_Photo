import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, addDoc, getDocs, where, serverTimestamp, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {  
  apiKey: "AIzaSyA1QG09A7IBTbfRg6mspE9B_aXRI9T-Jn0",
  authDomain: "webthanhly-16523.firebaseapp.com",
  projectId: "webthanhly-16523",
  storageBucket: "webthanhly-16523.firebasestorage.app",
  messagingSenderId: "433537417220",
  appId: "1:433537417220:web:e39cc4e66b1e896a5df551",
  measurementId: "G-3TWT0BXEWC"
}
const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app);

function removeAccents(str) { return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

function timeAgo(timestamp) {
    if (!timestamp) return 'Vừa xong';
    const diff = (new Date() - timestamp.toDate()) / 1000;
    if (diff < 60) return Math.floor(diff) + 's trước';
    if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
    if (diff < 604800) return Math.floor(diff / 86400) + ' ngày trước';
    if (diff < 2592000) return Math.floor(diff / 604800) + ' tuần trước';
    if (diff < 31536000) return Math.floor(diff / 2592000) + ' tháng trước';
    return Math.floor(diff / 31536000) + ' năm trước';
}

const themeBtn = document.getElementById("themeToggleBtn");
const currentTheme = localStorage.getItem("theme") || "light";
if (currentTheme === "dark") document.documentElement.setAttribute("data-theme", "dark");
themeBtn.innerHTML = currentTheme === "dark" ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
themeBtn.onclick = () => { const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("theme", theme); themeBtn.innerHTML = theme === "dark" ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>'; lucide.createIcons(); };

lucide.createIcons(); const dot = document.getElementById("cursorDot"), outline = document.getElementById("cursorOutline");
window.addEventListener('mousemove', (e) => { dot.style.left = `${e.clientX}px`; dot.style.top = `${e.clientY}px`; outline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 300, fill: "forwards" }); });

document.getElementById("detailCommentInput").addEventListener('keydown', e => { if(e.key === 'Enter') document.getElementById("detailSubmitCommentBtn").click(); });
document.getElementById("chatInput").addEventListener('keydown', e => { if(e.key === 'Enter') document.getElementById("chatSendBtn").click(); });

window.showToast = (msg, type = "success") => { const container = document.getElementById("toastContainer"); const toast = document.createElement("div"); toast.className = `toast-msg ${type}`; toast.innerHTML = type === 'error' ? `<i data-lucide="alert-circle"></i> <span>${msg}</span>` : `<i data-lucide="check-circle"></i> <span>${msg}</span>`; container.appendChild(toast); lucide.createIcons({ root: toast }); setTimeout(() => { toast.style.animation = "fadeOutToast 0.3s ease-out forwards"; setTimeout(() => toast.remove(), 300); }, 3000); };
window.showConfirm = (msg, callback) => { const modal = document.getElementById("confirmModal"); document.getElementById("confirmMessage").innerText = msg; modal.classList.add("active"); const acceptBtn = document.getElementById("acceptConfirmBtn"), cancelBtn = document.getElementById("cancelConfirmBtn"); acceptBtn.onclick = null; cancelBtn.onclick = null; acceptBtn.onclick = () => { modal.classList.remove("active"); callback(); }; cancelBtn.onclick = () => { modal.classList.remove("active"); }; };

const modals = ['editProfileModal', 'boardModal', 'postDetailModal', 'notiModal', 'chatModal'].map(id => document.getElementById(id));
const [editM, boardM, detailM, notiM, chatM] = modals;
document.getElementById("showEditProfileBtn").onclick = () => editM.classList.add("active"); document.getElementById("closeEditProfile").onclick = () => editM.classList.remove("active");
document.getElementById("closeBoard").onclick = () => boardM.classList.remove("active"); 
document.getElementById("notiBellBtn").onclick = () => notiM.classList.add("active"); document.getElementById("closeNoti").onclick = () => notiM.classList.remove("active");
document.getElementById("closeChat").onclick = () => chatM.classList.remove("active"); 
document.getElementById("chatBtn").onclick = () => { chatM.classList.add("active"); };

document.getElementById("closePostDetail").onclick = () => { detailM.classList.remove("active"); document.querySelector('.post-detail-content').style.boxShadow = ''; };

let currentUser = null, currentInteractPostId = null, currentTabMode = 'my-posts', currentBoardId = null, currentPostData = null;
let replyingToCommentId = null; let currentActiveChatId = null, chatMsgUnsub = null, chatRoomUnsub = null;
let chatCurrentStatus = 'accepted', chatCurrentRequester = null, chatMyMsgCount = 0;

async function logSecurityAction(userId, action, details) { if (!userId) return; try { await addDoc(collection(db, "security_logs"), { userId: userId, action: action, details: details, userAgent: navigator.userAgent, timestamp: serverTimestamp() }); } catch(e) {} }

let lastTap = 0;
document.getElementById("detailImageContainer").addEventListener('click', (e) => { const currentTime = new Date().getTime(); const tapLength = currentTime - lastTap; if (tapLength < 300 && tapLength > 0) { const heartOverlay = document.getElementById("doubleTapHeart"); heartOverlay.classList.remove('pop'); void heartOverlay.offsetWidth; heartOverlay.classList.add('pop'); const detailHeartBtn = document.getElementById("detailHeartBtn"); if (!detailHeartBtn.classList.contains('liked')) { detailHeartBtn.click(); } } lastTap = currentTime; });

document.getElementById("searchInput").addEventListener('input', (e) => {
    let rawTerm = e.target.value.trim(), term = removeAccents(rawTerm);
    const dictionary = { "bong da": ["ibrahimovic", "real madrid", "ronaldo", "messi", "banh", "ngoai hang anh", "c1"], "real madrid": ["kroos", "modric", "vinicius", "bellingham", "khen ken trang", "hoang gia", "bong da", "ronaldo"], "nga": ["russia", "putin", "moscow", "chau au"], "ibrahimovic": ["bong da", "thuy dien", "tien dao", "ac milan", "mu"] };
    let searchTerms = [term]; for (let key in dictionary) { if (term.includes(key) || dictionary[key].some(k => term.includes(k))) searchTerms.push(key, ...dictionary[key]); }
    document.querySelectorAll('.photo-card-wrap').forEach(card => { let searchableText = card.getAttribute('data-search') || '', isMatch = searchTerms.some(t => searchableText.includes(t)); card.style.display = (isMatch || term === "") ? 'inline-block' : 'none'; });
});

function updateChatState() {
    const chatInput = document.getElementById("chatInput"); const chatSendBtn = document.getElementById("chatSendBtn"); const inputArea = document.querySelector(".chat-input-area");
    if (chatCurrentStatus === 'pending') {
        if (chatCurrentRequester === currentUser.uid) {
            inputArea.style.display = 'flex';
            if (chatMyMsgCount > 0) { chatInput.disabled = true; chatInput.placeholder = "Đã gửi 1 tin chào. Chờ phản hồi..."; chatSendBtn.disabled = true; } 
            else { chatInput.disabled = false; chatInput.placeholder = "Gửi 1 tin nhắn chào hỏi duy nhất..."; chatSendBtn.disabled = false; }
        } else { inputArea.style.display = 'none'; }
    } else { inputArea.style.display = 'flex'; chatInput.disabled = false; chatInput.placeholder = "Nhắn tin..."; chatSendBtn.disabled = false; }
}

window.openChatRoom = (chatId, friendName) => {
    currentActiveChatId = chatId; document.getElementById("chatWindow").style.display = "flex"; 
    
    if(chatRoomUnsub) chatRoomUnsub();
    chatRoomUnsub = onSnapshot(doc(db, "friends_chat", chatId), (docSnap) => {
        const room = docSnap.data(); if (!room) return;
        chatCurrentStatus = room.status; chatCurrentRequester = room.requesterId;
        
        if (room.hasUnread && room.lastSenderId !== currentUser.uid) { updateDoc(doc(db, "friends_chat", chatId), { hasUnread: false }); }

        const headerArea = document.getElementById("chatActiveUser");
        if (room.status === 'pending') {
            if (room.requesterId === currentUser.uid) { headerArea.innerHTML = `Đang chat với: ${friendName} <span style="font-size:0.8rem;color:#f59e0b;font-weight:normal;">(Chờ chấp nhận)</span>`; } 
            else {
                headerArea.innerHTML = `Đang chat với: ${friendName} <button id="acceptChatBtn" class="btn btn-primary small-btn" style="margin-left:10px; padding:4px 12px; font-size:0.8rem;">Chấp nhận</button>`;
                document.getElementById("acceptChatBtn").onclick = async () => { await updateDoc(doc(db, "friends_chat", chatId), { status: 'accepted', lastUpdated: serverTimestamp() }); showToast("Đã trở thành bạn bè!"); logSecurityAction(currentUser.uid, "ACCEPT_FRIEND", `Đã chấp nhận kết bạn từ ${friendName}`); };
            }
        } else { headerArea.innerHTML = `Đang chat với: ${friendName}`; }
        updateChatState();
    });

    if(chatMsgUnsub) chatMsgUnsub();
    chatMsgUnsub = onSnapshot(query(collection(db, "friends_chat", chatId, "messages"), orderBy("timestamp", "asc")), (snap) => {
        const msgList = document.getElementById("chatMessages"); let html = ""; let myCount = 0;
        snap.forEach(d => { 
            const msg = d.data(), isMine = msg.senderId === currentUser.uid; if(isMine) myCount++; 
            const timeStr = timeAgo(msg.timestamp); 
            html += `<div style="display:flex; flex-direction:column; align-items: ${isMine ? 'flex-end' : 'flex-start'}; margin-bottom: 8px;">
                        <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}">${msg.text}</div>
                        <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; padding: 0 4px;">${timeStr}</span>
                     </div>`; 
        });
        msgList.innerHTML = html; msgList.scrollTop = msgList.scrollHeight; chatMyMsgCount = myCount; updateChatState(); 
    });
};

document.getElementById("chatSendBtn").onclick = async () => { 
    const text = document.getElementById("chatInput").value.trim(); 
    if(!text || !currentActiveChatId) return; 
    document.getElementById("chatInput").value = ""; 
    await addDoc(collection(db, "friends_chat", currentActiveChatId, "messages"), { senderId: currentUser.uid, text: text, timestamp: serverTimestamp() }); 
    await updateDoc(doc(db, "friends_chat", currentActiveChatId), { hasUnread: true, lastSenderId: currentUser.uid, lastUpdated: serverTimestamp() });
};

// ==============================================================
// BỘ QUẢN LÝ TIN NHẮN REAL-TIME (SẮP XẾP LÊN TOP & CHUÔNG ĐỎ)
// ==============================================================
let chatNotiUnsub = null;
function listenChatNotifications() {
    if(chatNotiUnsub) chatNotiUnsub();
    chatNotiUnsub = onSnapshot(query(collection(db, "friends_chat"), where("users", "array-contains", currentUser.uid)), (snap) => {
        let badgeCount = 0; let friendsArray = [];
        
        snap.forEach(d => { 
            const data = d.data(); 
            friendsArray.push({ id: d.id, ...data });
            if (data.status === 'pending' && data.requesterId !== currentUser.uid) { badgeCount++; } 
            else if (data.status === 'accepted' && data.hasUnread && data.lastSenderId !== currentUser.uid) { badgeCount++; }
        });

        // TỰ ĐỘNG CẤY THÔNG BÁO VÀO NÚT CHAT BÊN NGOÀI
        let chatBadge = document.getElementById("chatBadge");
        if(!chatBadge) {
            const chatBtn = document.getElementById("chatBtn");
            if(chatBtn) { chatBadge = document.createElement("span"); chatBadge.id = "chatBadge"; chatBadge.className = "noti-badge"; chatBadge.style.display = "none"; chatBtn.appendChild(chatBadge); }
        }
        if(chatBadge) {
            if(badgeCount > 0) { chatBadge.innerText = badgeCount; chatBadge.style.display = "flex"; } 
            else { chatBadge.style.display = "none"; }
        }

        // SẮP XẾP LẠI DANH SÁCH BẠN BÈ (TIN MỚI NHẤT LÊN ĐẦU)
        friendsArray.sort((a, b) => {
            const timeA = (a.lastUpdated || a.createdAt)?.toMillis() || 0;
            const timeB = (b.lastUpdated || b.createdAt)?.toMillis() || 0;
            return timeB - timeA;
        });

        const listEl = document.getElementById("friendList");
        if(listEl) {
            if (friendsArray.length === 0) { listEl.innerHTML = "<p style='padding:20px; color:var(--text-muted); text-align:center;'>Chưa có bạn bè nào.</p>"; } 
            else {
                let html = "";
                friendsArray.forEach(data => {
                    const friendId = data.users.find(id => id !== currentUser.uid);
                    const friendName = data.userNames[friendId]; 
                    let badge = '';
                    if (data.status === 'pending') {
                        if (data.requesterId === currentUser.uid) badge = `<span style="font-size:0.7rem; color:#f59e0b; margin-left:auto;">Đang chờ</span>`;
                        else badge = `<span style="font-size:0.7rem; color:#e60023; margin-left:auto; font-weight:bold;">Có yêu cầu</span>`;
                    } else if (data.hasUnread && data.lastSenderId !== currentUser.uid) {
                        badge = `<div style="width:10px; height:10px; background:#e60023; border-radius:50%; margin-left:auto;"></div>`;
                    }
                    html += `<div class="friend-item ${currentActiveChatId === data.id ? 'active' : ''}" style="${currentActiveChatId === data.id ? 'background: var(--hover-bg);' : ''}" onclick="openChatRoom('${data.id}', '${friendName}')"><div class="friend-avatar">${friendName.charAt(0).toUpperCase()}</div><span class="friend-name" style="${(data.hasUnread && data.lastSenderId !== currentUser.uid) ? 'font-weight:bold;' : ''}">${friendName}</span>${badge}</div>`;
                });
                listEl.innerHTML = html;
            }
        }
    });
}

let unsubNoti = null;
function listenNotifications() {
    if(unsubNoti) unsubNoti();
    unsubNoti = onSnapshot(query(collection(db, "notifications"), where("userId", "==", currentUser.uid), orderBy("timestamp", "desc")), (snap) => {
        const notiList = document.getElementById("notiList"), notiBadge = document.getElementById("notiBadge"); let unreadCount = 0, html = "";
        if (snap.empty) { notiList.innerHTML = "<p class='text-muted' style='text-align:center; padding: 30px;'>Không có thông báo nào.</p>"; notiBadge.style.display = "none"; return; }
        snap.forEach(docSnap => { const n = docSnap.data(); if (!n.isRead) unreadCount++; const text = n.type === 'like' ? 'đã thả tim bài viết ❤️' : 'đã bình luận về bài viết 💬'; const timeStr = timeAgo(n.timestamp); html += `<div class="noti-item ${n.isRead ? '' : 'unread'}" data-id="${docSnap.id}" data-post-id="${n.postId}"><img src="${n.postImage}"><div class="noti-item-content"><strong>${n.fromUserName}</strong> ${text}<span class="noti-time">${timeStr}</span></div></div>`; });
        notiList.innerHTML = html; if(unreadCount > 0) { notiBadge.innerText = unreadCount; notiBadge.style.display = "flex"; } else { notiBadge.style.display = "none"; }
    });
}

document.getElementById("notiList").addEventListener('click', async (e) => { const item = e.target.closest('.noti-item'); if (item) { await updateDoc(doc(db, "notifications", item.dataset.id), { isRead: true }); notiM.classList.remove("active"); const postCard = document.querySelector(`.photo-card[data-id="${item.dataset.postId}"]`); if(postCard) postCard.click(); else showToast("Cuộn tìm ảnh hoặc vào trang chủ để xem chi tiết!", "error"); } });

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user; document.getElementById("displayUserName").innerText = user.email.split('@')[0]; document.getElementById("profileName").innerText = user.email.split('@')[0]; document.getElementById("profileEmail").innerText = user.email;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid)); 
            document.getElementById("profileAvatar").src = (userDoc.exists() && userDoc.data().avatar) ? userDoc.data().avatar : `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=random&color=fff`;
            document.getElementById("profileBio").innerText = (userDoc.exists() && userDoc.data().bio) ? userDoc.data().bio : "Chưa có tiểu sử."; 
        } catch (error) {
            document.getElementById("profileAvatar").src = `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=random&color=fff`;
            document.getElementById("profileBio").innerText = "Chưa có tiểu sử.";
        }
        document.querySelector('.tab-btn[data-tab="my-posts"]').click(); 
        listenNotifications(); listenChatNotifications();
    } else { window.location.href = "index.html"; } 
});
document.getElementById("logoutBtn").onclick = () => signOut(auth);

document.getElementById("saveProfileBtn").onclick = async () => { const file = document.getElementById("avatarInput").files[0], bio = document.getElementById("bioInput").value; document.getElementById("saveProfileBtn").innerText = "Đang lưu..."; let base64Data = null, mimeType = null; if (file) { mimeType = file.type; base64Data = await new Promise(res => { const r = new FileReader(); r.onloadend = () => res(r.result.split(',')[1]); r.readAsDataURL(file); }); } await fetch('/.netlify/functions/api-post', { method: 'POST', body: JSON.stringify({ action: "update_profile", image: base64Data, mimeType, bio, userId: currentUser.uid }) }); await logSecurityAction(currentUser.uid, "UPDATE_PROFILE", `Cập nhật hồ sơ.`); window.location.reload(); };

function showSkeletons() { let html = ""; for(let i=0; i<10; i++) { html += `<div class="photo-card-wrap"><div class="skeleton"></div></div>`; } document.getElementById("profileGrid").innerHTML = html; }

function renderGrid(docsArray, container) {
    let htmlBuffer = "";
    docsArray.forEach(postDoc => {
        if (!postDoc.exists()) return; const post = postDoc.data(), isLiked = (post.likedBy || []).includes(currentUser.uid); let rawContent = post.content || "", tagsMatch = rawContent.match(/#[\w\u00C0-\u1EF9]+/g) || [], cleanCaption = rawContent.replace(/#[\w\u00C0-\u1EF9]+/g, '').trim(); let searchableData = removeAccents(rawContent) + " " + removeAccents(tagsMatch.join(" "));
        htmlBuffer += `<div class="photo-card-wrap" id="wrap-${postDoc.id}" data-search="${searchableData}"><div class="photo-card" data-id="${postDoc.id}"><img src="${post.image_url}"><div class="photo-overlay"><button class="save-btn" data-id="${postDoc.id}">Lưu</button><div class="card-stats"><span class="action-wrapper"><button class="action-btn heart-btn" data-id="${postDoc.id}"><i data-lucide="heart" class="${isLiked?'icon-filled':''}"></i></button> ${(post.likedBy||[]).length}</span><span class="action-wrapper"><i data-lucide="message-circle"></i> ${post.commentCount||0}</span></div></div></div><div class="card-caption" style="display:none;">${cleanCaption}</div></div>`;
    });
    container.innerHTML = htmlBuffer || "<p style='text-align:center; width:100%; color:var(--text-muted); margin-top:20px;'>Không có hình ảnh nào.</p>"; lucide.createIcons(); document.getElementById("searchInput").dispatchEvent(new Event('input'));
}

async function loadProfileTab(tabName) {
    const grid = document.getElementById("profileGrid"); currentTabMode = tabName; currentBoardId = null;
    if (tabName === 'security-logs') {
        grid.innerHTML = "Đang tải nhật ký..."; grid.classList.remove('masonry-grid'); 
        const s = await getDocs(query(collection(db, "security_logs"), where("userId", "==", currentUser.uid))); let logs = s.docs.map(d => d.data()); logs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
        if (logs.length === 0) { grid.innerHTML = "<p style='text-align:center; width:100%; color:var(--text-muted); margin-top:20px;'>Chưa có nhật ký hoạt động.</p>"; return; }
        let logHtml = '<div class="log-list">'; 
        logs.forEach(log => { 
            const timeStr = timeAgo(log.timestamp); let typeClass = ''; 
            if(log.action === 'LOGIN' || log.action === 'REGISTER') typeClass = 'login'; 
            if(log.action.includes('DELETE') || log.action.includes('UNLIKE') || log.action.includes('REMOVE')) typeClass = 'delete'; 
            if(log.action.includes('UPDATE') || log.action.includes('LIKE') || log.action.includes('SAVE')) typeClass = 'update'; 
            if(log.action.includes('CREATE') || log.action.includes('ADD')) typeClass = 'create'; 
            logHtml += `<div class="log-item ${typeClass}"><div class="log-header"><span class="log-action-badge">${log.action}</span><span>${timeStr}</span></div><div class="log-details">${log.details}</div><div class="log-device">Device: ${log.userAgent.substring(0, 80)}...</div></div>`; 
        }); 
        logHtml += '</div>'; grid.innerHTML = logHtml; return;
    }
    grid.classList.add('masonry-grid'); showSkeletons();
    if (tabName === 'my-posts') { const s = await getDocs(query(collection(db, "football_posts"), where("userId", "==", currentUser.uid))); renderGrid(s.docs, grid); }
    else if (tabName === 'liked-posts') { const s = await getDocs(query(collection(db, "football_posts"), where("likedBy", "array-contains", currentUser.uid))); renderGrid(s.docs, grid); }
    else if (tabName === 'my-boards') { const s = await getDocs(query(collection(db, "boards"), where("userId", "==", currentUser.uid))); grid.innerHTML = ""; if (s.empty) { grid.innerHTML = "<p style='text-align:center; width:100%; color:var(--text-muted); margin-top:20px;'>Chưa có bộ sưu tập nào.</p>"; return; } s.forEach(d => grid.innerHTML += `<div class="photo-card-wrap" data-search="${removeAccents(d.data().name)}"><div class="photo-card board-folder" data-board-id="${d.id}" data-board-name="${d.data().name}" style="background:var(--bg-card); border:1px solid var(--border-color); padding:30px; text-align:center; cursor:pointer;"><i data-lucide="folder-open" style="width:40px;height:40px;margin-bottom:10px;"></i><h3 style="color:var(--text-main);">${d.data().name}</h3></div></div>`); lucide.createIcons(); document.getElementById("searchInput").dispatchEvent(new Event('input')); }
}
document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => { document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); document.getElementById("boardHeader").style.display = "none"; loadProfileTab(e.target.dataset.tab); });

window.openBoard = async (bId, bName) => { currentTabMode = 'inside-board'; currentBoardId = bId; document.getElementById("boardHeader").style.display = "flex"; document.getElementById("currentBoardName").innerText = bName; const pinSnaps = await getDocs(query(collection(db, "saved_pins"), where("boardId", "==", bId))); if (pinSnaps.empty) { document.getElementById("profileGrid").innerHTML = "<p style='text-align:center; width:100%; color:var(--text-muted); margin-top:20px;'>Bảng trống.</p>"; return; } const postDocs = await Promise.all(pinSnaps.docs.map(pin => getDoc(doc(db, "football_posts", pin.data().postId)))); renderGrid(postDocs, document.getElementById("profileGrid")); };
document.getElementById("backToBoardsBtn").onclick = () => document.querySelector('.tab-btn[data-tab="my-boards"]').click();

window.addEventListener('scroll', function(e) {
    let target = e.target;
    if (target === document) target = document.documentElement;
    if (!target || typeof target.scrollTop === 'undefined') return;

    const scrollTop = target.scrollTop || window.scrollY || 0;
    const scrollHeight = target.scrollHeight || document.documentElement.scrollHeight || 0;
    const clientHeight = target.clientHeight || window.innerHeight || 0;

    if (scrollHeight > clientHeight && (scrollTop + clientHeight) >= (scrollHeight - 600) && !isFetching) { 
        // Logic cuộn tải thêm không dùng ở trang profile
    } 
}, true);

document.getElementById("profileGrid").addEventListener('click', async (e) => {
    const folder = e.target.closest('.board-folder'); if (folder) { window.openBoard(folder.dataset.boardId, folder.dataset.boardName); return; }
    const heartBtn = e.target.closest('.heart-btn');
    if (heartBtn) {
        const pRef = doc(db, "football_posts", heartBtn.dataset.id); const icon = heartBtn.querySelector('.lucide') || heartBtn.querySelector('svg'); const pData = (await getDoc(pRef)).data();
        if (icon) {
            if (icon.classList.contains('icon-filled')) { 
                updateDoc(pRef, { likedBy: arrayRemove(currentUser.uid) }); icon.classList.remove('icon-filled'); 
                logSecurityAction(currentUser.uid, "UNLIKE_POST", `Đã gỡ tim bài viết ID: ${heartBtn.dataset.id}`);
                if(pData.userId !== currentUser.uid) deleteDoc(doc(db, "notifications", `like_${heartBtn.dataset.id}_${currentUser.uid}`)); 
            } else { 
                updateDoc(pRef, { likedBy: arrayUnion(currentUser.uid) }); icon.classList.add('icon-filled'); 
                logSecurityAction(currentUser.uid, "LIKE_POST", `Đã thả tim bài viết ID: ${heartBtn.dataset.id}`);
                if(pData.userId !== currentUser.uid) setDoc(doc(db, "notifications", `like_${heartBtn.dataset.id}_${currentUser.uid}`), { userId: pData.userId, fromUserId: currentUser.uid, fromUserName: currentUser.email.split('@')[0], type: 'like', postId: heartBtn.dataset.id, postImage: pData.image_url, timestamp: serverTimestamp(), isRead: false }); 
            }
        } return;
    }
    const saveBtn = e.target.closest('.save-btn'); if (saveBtn) { currentInteractPostId = saveBtn.dataset.id; boardM.classList.add("active"); loadBoards(); return; }
    
    const card = e.target.closest('.photo-card');
    if (card) { 
        currentInteractPostId = card.dataset.id; detailM.classList.add("active"); replyingToCommentId = null;
        currentPostData = (await getDoc(doc(db, "football_posts", currentInteractPostId))).data();
        
        const addFriendBtn = document.getElementById("addFriendBtn");
        if (currentPostData.userId !== currentUser.uid) {
            const chatId = currentPostData.userId < currentUser.uid ? `${currentPostData.userId}_${currentUser.uid}` : `${currentUser.uid}_${currentPostData.userId}`;
            const chatDoc = await getDoc(doc(db, "friends_chat", chatId)); addFriendBtn.style.display = "inline-flex";
            if (chatDoc.exists()) { 
                const data = chatDoc.data();
                if (data.status === 'accepted') { addFriendBtn.innerHTML = `<i data-lucide="check" style="width:14px;"></i> Bạn bè`; addFriendBtn.onclick = null; }
                else if (data.status === 'pending') {
                    if (data.requesterId === currentUser.uid) { addFriendBtn.innerHTML = `<i data-lucide="clock" style="width:14px;"></i> Đã gửi yêu cầu`; addFriendBtn.onclick = null; }
                    else { 
                        addFriendBtn.innerHTML = `<i data-lucide="check-circle" style="width:14px;"></i> Chấp nhận`; 
                        addFriendBtn.onclick = async () => { await updateDoc(doc(db, "friends_chat", chatId), { status: 'accepted', lastUpdated: serverTimestamp() }); addFriendBtn.innerHTML = `<i data-lucide="check" style="width:14px;"></i> Bạn bè`; showToast("Đã kết bạn!"); };
                    }
                }
            } else {
                addFriendBtn.innerHTML = `<i data-lucide="user-plus" style="width:14px;"></i> Kết bạn`;
                addFriendBtn.onclick = async () => { 
                    await setDoc(doc(db, "friends_chat", chatId), { users: [currentUser.uid, currentPostData.userId], userNames: { [currentUser.uid]: currentUser.email.split('@')[0], [currentPostData.userId]: currentPostData.userName }, status: 'pending', requesterId: currentUser.uid, createdAt: serverTimestamp(), lastUpdated: serverTimestamp() }); 
                    addFriendBtn.innerHTML = `<i data-lucide="clock" style="width:14px;"></i> Đã gửi yêu cầu`; showToast("Đã gửi yêu cầu kết bạn!"); logSecurityAction(currentUser.uid, "ADD_FRIEND", `Gửi yêu cầu kết bạn tới ${currentPostData.userName}`);
                };
            }
        } else { addFriendBtn.style.display = "none"; }

        const imgEl = document.getElementById("detailImage"); imgEl.crossOrigin = "Anonymous"; imgEl.src = currentPostData.image_url; 
        imgEl.onload = () => { try { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); canvas.width = imgEl.width; canvas.height = imgEl.height; ctx.drawImage(imgEl, 0, 0); const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let r=0, g=0, b=0, count=0; for (let i = 0; i < data.length; i += 40) { r += data[i]; g += data[i+1]; b += data[i+2]; count++; } r = Math.floor(r/count); g = Math.floor(g/count); b = Math.floor(b/count); document.querySelector('.post-detail-content').style.boxShadow = `0 0 80px rgba(${r}, ${g}, ${b}, 0.55)`; } catch(e) { document.querySelector('.post-detail-content').style.boxShadow = ''; } };

        document.getElementById("authorNameText").innerText = currentPostData.userName; 
        let cleanCaptionDetail = (currentPostData.content || "").replace(/#[\w\u00C0-\u1EF9]+/g, '').trim(); document.getElementById("detailCaption").innerText = cleanCaptionDetail;
        
        const delPostBtn = document.getElementById("detailDeletePostBtn"), removePinBtn = document.getElementById("detailRemovePinBtn");
        if(delPostBtn) delPostBtn.style.display = "none"; if(removePinBtn) removePinBtn.style.display = "none";

        if (currentTabMode === 'my-posts' && currentPostData.userId === currentUser.uid) {
            if(delPostBtn) { delPostBtn.style.display = "block"; delPostBtn.onclick = () => showConfirm("Chắc chắn xóa bài viết này vĩnh viễn?", async () => { try { await deleteDoc(doc(db, "football_posts", currentInteractPostId)); detailM.classList.remove("active"); const wrap = document.getElementById(`wrap-${currentInteractPostId}`); if(wrap) wrap.remove(); showToast("Đã xóa vĩnh viễn!"); document.querySelector('.post-detail-content').style.boxShadow = ''; logSecurityAction(currentUser.uid, "DELETE_POST", `Đã xóa vĩnh viễn bài viết ID: ${currentInteractPostId}`); } catch (error) { showToast("Lỗi khi xóa!", "error"); } }); }
        }
        if (currentTabMode === 'inside-board') {
            if(removePinBtn) { removePinBtn.style.display = "block"; removePinBtn.onclick = () => showConfirm("Gỡ ảnh này ra khỏi bộ sưu tập?", async () => { try { const q = query(collection(db, "saved_pins"), where("postId", "==", currentInteractPostId), where("boardId", "==", currentBoardId), where("userId", "==", currentUser.uid)); const snaps = await getDocs(q); snaps.forEach(async (d) => await deleteDoc(d.ref)); detailM.classList.remove("active"); const wrap = document.getElementById(`wrap-${currentInteractPostId}`); if(wrap) wrap.remove(); showToast("Đã gỡ ảnh thành công!"); document.querySelector('.post-detail-content').style.boxShadow = ''; logSecurityAction(currentUser.uid, "REMOVE_SAVED_POST", `Đã gỡ bài viết ID: ${currentInteractPostId} khỏi bộ sưu tập`); } catch (error) { showToast("Lỗi khi gỡ!", "error"); } }); }
        }

        const detailHeartBtn = document.getElementById("detailHeartBtn");
        if ((currentPostData.likedBy||[]).includes(currentUser.uid)) { detailHeartBtn.classList.add('liked'); } else { detailHeartBtn.classList.remove('liked'); }
        document.getElementById("detailLikes").innerText = (currentPostData.likedBy||[]).length;
        detailHeartBtn.onclick = async () => { 
            const pRef = doc(db, "football_posts", currentInteractPostId); 
            if (detailHeartBtn.classList.contains('liked')) { 
                await updateDoc(pRef, { likedBy: arrayRemove(currentUser.uid) }); detailHeartBtn.classList.remove('liked'); document.getElementById("detailLikes").innerText = parseInt(document.getElementById("detailLikes").innerText) - 1; 
                logSecurityAction(currentUser.uid, "UNLIKE_POST", `Đã gỡ tim bài viết ID: ${currentInteractPostId}`);
                if(currentPostData.userId !== currentUser.uid) await deleteDoc(doc(db, "notifications", `like_${currentInteractPostId}_${currentUser.uid}`));
            } else { 
                await updateDoc(pRef, { likedBy: arrayUnion(currentUser.uid) }); detailHeartBtn.classList.add('liked'); document.getElementById("detailLikes").innerText = parseInt(document.getElementById("detailLikes").innerText) + 1; 
                logSecurityAction(currentUser.uid, "LIKE_POST", `Đã thả tim bài viết ID: ${currentInteractPostId}`);
                if(currentPostData.userId !== currentUser.uid) await setDoc(doc(db, "notifications", `like_${currentInteractPostId}_${currentUser.uid}`), { userId: currentPostData.userId, fromUserId: currentUser.uid, fromUserName: currentUser.email.split('@')[0], type: 'like', postId: currentInteractPostId, postImage: currentPostData.image_url, timestamp: serverTimestamp(), isRead: false }); 
            } 
        };
        document.getElementById("detailSaveBtn").onclick = () => { boardM.classList.add("active"); loadBoards(); };
        loadDetailComments(currentInteractPostId);
    }
});

document.getElementById("detailDownloadBtn").onclick = () => {
    showToast("Đang chuẩn bị ảnh bản quyền...", "success"); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image(); img.crossOrigin = "Anonymous"; img.src = currentPostData.image_url;
    img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fillRect(0, img.height - 60, img.width, 60); ctx.fillStyle = "#ffffff"; ctx.font = "bold 24px Inter, sans-serif"; ctx.fillText(`FootyNet © Tác giả: ${currentPostData.userName}`, 20, img.height - 22); const link = document.createElement('a'); link.download = `FootyNet_${currentPostData.userName}_${Date.now()}.png`; link.href = canvas.toDataURL("image/png"); link.click(); showToast("Tải thành công!"); }; img.onerror = () => showToast("Lỗi bảo mật CORS từ máy chủ ảnh!", "error");
};
async function loadBoards() { const list = document.getElementById("boardList"); const snap = await getDocs(query(collection(db, "boards"), where("userId", "==", currentUser.uid))); list.innerHTML = snap.empty ? "<p class='text-muted'>Chưa có bảng.</p>" : ""; snap.forEach(d => list.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid var(--border-color); border-radius:12px; margin-bottom:10px;"><strong>${d.data().name}</strong><button class="btn small-btn btn-glass" onclick="saveToBoard('${d.id}')">Lưu</button></div>`); }
document.getElementById("createBoardBtn").onclick = async () => { const n = document.getElementById("newBoardInput").value; if(!n)return; const r = await addDoc(collection(db, "boards"), { name: n, userId: currentUser.uid, timestamp: serverTimestamp() }); saveToBoard(r.id); document.getElementById("newBoardInput").value = ""; };
window.saveToBoard = async (bId) => { 
    const checkSnap = await getDocs(query(collection(db, "saved_pins"), where("boardId", "==", bId), where("postId", "==", currentInteractPostId))); 
    if (!checkSnap.empty) { showToast("Ảnh này đã có trong bộ sưu tập!", "error"); boardM.classList.remove("active"); return; } 
    await addDoc(collection(db, "saved_pins"), { boardId: bId, postId: currentInteractPostId, userId: currentUser.uid, timestamp: serverTimestamp() }); boardM.classList.remove("active"); showToast("Đã lưu thành công!"); 
    logSecurityAction(currentUser.uid, "SAVE_POST", `Đã lưu bài viết ID: ${currentInteractPostId} vào bộ sưu tập`);
};

let unsub = null;
function loadDetailComments(pId) {
    const list = document.getElementById("detailCommentList"); if (unsub) unsub();
    unsub = onSnapshot(query(collection(db, "football_posts", pId, "comments"), orderBy("timestamp", "asc")), (snap) => {
        list.innerHTML = snap.empty ? "<p class='text-muted'>Chưa có bình luận.</p>" : ""; 
        let commentsMap = {}; snap.forEach(d => { commentsMap[d.id] = { id: d.id, ...d.data() }; }); let html = "";
        
        Object.values(commentsMap).filter(c => !c.replyTo).forEach(c => {
            const timeStr = timeAgo(c.timestamp);
            const isLiked = (c.likedBy || []).includes(currentUser?.uid); const delBtnHTML = (currentUser && c.userId === currentUser.uid) ? `<button class="delete-comment-btn" data-id="${c.id}" title="Xóa"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>` : '';
            html += `<div class="comment-item" id="comment-${c.id}"><div class="comment-text-content"><strong>${c.userName}</strong><span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px; font-weight:normal;">${timeStr}</span><p>${c.text}</p><div class="comment-actions"><span class="comment-action-btn ${isLiked?'liked':''}" data-action="like-comment" data-id="${c.id}"><i data-lucide="heart" style="width:12px;"></i> ${(c.likedBy||[]).length||0}</span><span class="comment-action-btn" data-action="reply-comment" data-id="${c.id}" data-name="${c.userName}"><i data-lucide="reply" style="width:12px;"></i> Trả lời</span></div></div>${delBtnHTML}</div>`;
            
            Object.values(commentsMap).filter(r => r.replyTo === c.id).forEach(r => {
                const rTimeStr = timeAgo(r.timestamp);
                const rIsLiked = (r.likedBy || []).includes(currentUser?.uid); const rDelBtnHTML = (currentUser && r.userId === currentUser.uid) ? `<button class="delete-comment-btn" data-id="${r.id}" title="Xóa"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>` : '';
                html += `<div class="comment-item reply-item" id="comment-${r.id}"><div class="comment-text-content"><strong>${r.userName}</strong><span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px; font-weight:normal;">${rTimeStr}</span><p>${r.text}</p><div class="comment-actions"><span class="comment-action-btn ${rIsLiked?'liked':''}" data-action="like-comment" data-id="${r.id}"><i data-lucide="heart" style="width:12px;"></i> ${(r.likedBy||[]).length||0}</span></div></div>${rDelBtnHTML}</div>`;
            });
        });
        list.innerHTML = html; updateDoc(doc(db, "football_posts", pId), { commentCount: snap.size }); list.scrollTop = list.scrollHeight; lucide.createIcons({root: list});
    });
}

document.getElementById("detailCommentList").addEventListener('click', async (e) => {
    if (!currentUser) return showToast("Cần đăng nhập để tương tác!", "error");
    const delBtn = e.target.closest('.delete-comment-btn'); 
    if (delBtn) { 
        showConfirm("Xóa bình luận này?", async () => { 
            await deleteDoc(doc(db, "football_posts", currentInteractPostId, "comments", delBtn.dataset.id)); showToast("Đã xóa!"); 
            logSecurityAction(currentUser.uid, "DELETE_COMMENT", `Đã xóa bình luận trong bài viết ID: ${currentInteractPostId}`);
        }); return; 
    }
    const actionBtn = e.target.closest('.comment-action-btn');
    if (actionBtn) {
        const cId = actionBtn.dataset.id;
        if (actionBtn.dataset.action === "like-comment") {
            const cRef = doc(db, "football_posts", currentInteractPostId, "comments", cId); const cDoc = await getDoc(cRef);
            if ((cDoc.data().likedBy||[]).includes(currentUser.uid)) { 
                await updateDoc(cRef, { likedBy: arrayRemove(currentUser.uid) }); 
                logSecurityAction(currentUser.uid, "UNLIKE_COMMENT", `Đã gỡ tim bình luận ID: ${cId}`);
            } else { 
                await updateDoc(cRef, { likedBy: arrayUnion(currentUser.uid) }); 
                logSecurityAction(currentUser.uid, "LIKE_COMMENT", `Đã thả tim bình luận ID: ${cId}`);
            }
        } else if (actionBtn.dataset.action === "reply-comment") { replyingToCommentId = cId; const input = document.getElementById("detailCommentInput"); input.value = `@${actionBtn.dataset.name} `; input.focus(); }
    }
});

document.getElementById("detailSubmitCommentBtn").onclick = async () => { 
    const t = document.getElementById("detailCommentInput").value; if(!t)return; document.getElementById("detailCommentInput").value = ""; 
    await addDoc(collection(db, "football_posts", currentInteractPostId, "comments"), { text: t, userName: currentUser.email.split('@')[0], userId: currentUser.uid, replyTo: replyingToCommentId, timestamp: serverTimestamp() }); 
    replyingToCommentId = null; 
    logSecurityAction(currentUser.uid, "ADD_COMMENT", `Đã bình luận vào bài viết ID: ${currentInteractPostId}`);
    if(currentPostData && currentPostData.userId !== currentUser.uid) { await addDoc(collection(db, "notifications"), { userId: currentPostData.userId, fromUserId: currentUser.uid, fromUserName: currentUser.email.split('@')[0], type: 'comment', postId: currentInteractPostId, postImage: currentPostData.image_url, timestamp: serverTimestamp(), isRead: false }); }
};