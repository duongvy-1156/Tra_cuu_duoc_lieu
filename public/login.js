import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// Thêm công cụ của Firestore vào
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYMLhxvoF3SY5VyaTUXhAwhX0xAoLaVJU",
  authDomain: "qlvatracuuduoclieu.firebaseapp.com",
  projectId: "qlvatracuuduoclieu",
  storageBucket: "qlvatracuuduoclieu.firebasestorage.app",
  messagingSenderId: "1064110527972",
  appId: "1:1064110527972:web:5e0f28e33840bcd67763f1",
  measurementId: "G-Z0VQQZ4FM3"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Gọi mảng cơ sở dữ liệu
const provider = new GoogleAuthProvider();
// ==============================================================
// 1. TỰ ĐỘNG KIỂM TRA: NẾU ĐÃ ĐĂNG NHẬP RỒI THÌ VÀO THẲNG ADMIN
// ==============================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Đã có phiên đăng nhập lưu trong máy -> Đi lên Firebase check quyền
        const q = query(collection(db, "quan_tri_vien"), where("email", "==", user.email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Đúng là người nhà -> Chuyển hướng thẳng vào trang Admin (không cần bấm nút)
            window.location.href = "admin.html";
        } else {
            // Người lạ vô tình kẹt lại phiên đăng nhập -> Đăng xuất ngay
            auth.signOut();
        }
    }
});

document.getElementById("btn-login-google").addEventListener("click", () => {
    signInWithPopup(auth, provider)
        .then(async (result) => {
            const user = result.user;

            // Chạy lên Firebase tìm xem email người này có trong bảng quan_tri_vien không
            const q = query(collection(db, "quan_tri_vien"), where("email", "==", user.email.toLowerCase()));
            const querySnapshot = await getDocs(q);

            // empty có nghĩa là "trống". Nếu !empty (không trống) nghĩa là tìm thấy email!
            if (!querySnapshot.empty) {
                window.location.href = "admin.html";
            } else {
                auth.signOut().then(() => {
                    alert(`Từ chối truy cập: Tài khoản ${user.email} không có quyền Quản trị!`);
                });
            }
        })
        .catch((error) => {
            console.error("Lỗi đăng nhập:", error);
        });
});