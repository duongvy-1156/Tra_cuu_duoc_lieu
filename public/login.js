import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const q = query(collection(db, "quan_tri_vien"), where("email", "==", user.email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            window.location.href = "admin.html";
        } else {
            auth.signOut();
        }
    }
});

document.getElementById("btn-login-google").addEventListener("click", () => {
    signInWithPopup(auth, provider)
        .then(async (result) => {
            const user = result.user;
            const q = query(collection(db, "quan_tri_vien"), where("email", "==", user.email.toLowerCase()));
            const querySnapshot = await getDocs(q);

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