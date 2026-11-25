import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYMLhxvoF3SY5VyaTUXhAwhX0xAoLaVJU",
  authDomain: "qlvatracuuduoclieu.firebaseapp.com",
  projectId: "qlvatracuuduoclieu",
  storageBucket: "qlvatracuuduoclieu.firebasestorage.app",
  messagingSenderId: "1064110527972",
  appId: "1:1064110527972:web:5e0f28e33840bcd67763f1",
  measurementId: "G-Z0VQQZ4FM3"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Hàm dùng chung để đồng bộ tên quản trị viên trên thanh điều hướng
export function capNhatMenuDangNhap() {
    onAuthStateChanged(auth, (user) => {
        const nutQuanTri = document.getElementById("nav-admin-link");
        if (!nutQuanTri) return;

        if (user) {
            const tenHienThi = user.displayName || user.email.split('@')[0];
            nutQuanTri.innerHTML = `👋 Chào, ${tenHienThi}`;
            nutQuanTri.style.color = "#ffb300";
            nutQuanTri.style.fontWeight = "bold";
        } else {
            nutQuanTri.innerText = "Quản trị";
            nutQuanTri.style.color = "";
            nutQuanTri.style.fontWeight = "";
        }
    });
}