import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DÁN FIREBASE CONFIG CỦA EM VÀO ĐÂY
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
const db = getFirestore(app);

async function hienThiChiTiet() {
    // 1. Lấy mã ID từ thanh địa chỉ URL (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const duocLieuId = urlParams.get('id');

    if (!duocLieuId) {
        document.getElementById("chi-tiet-duoc-lieu").innerHTML = "Không tìm thấy mã dược liệu!";
        return;
    }

    try {
        // 2. Truy vấn đúng Document ID này trong Firebase
        const docRef = doc(db, "duoc_lieu", duocLieuId);

        // --- TĂNG LƯỢT XEM LÊN 1 TRƯỚC KHI HIỂN THỊ ---
        await updateDoc(docRef, {
            luot_xem: increment(1)
        });

        // 3. Kéo dữ liệu từ đám mây xuống (dữ liệu này đã được cộng điểm)
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const khungHienThi = document.getElementById("chi-tiet-duoc-lieu");
            
            // 4. Đổ dữ liệu ra giao diện (Đã được CSS lại cho cực kỳ đẹp)
            khungHienThi.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                    <h1 style="color: #2e7d32; text-align: center; margin-bottom: 5px; font-size: 32px;">${data.ten_thuong_goi}</h1>
                    <p style="text-align: center; color: #777; font-style: italic; margin-top: 0;">Tên khoa học: ${data.ten_khoa_hoc}</p>
                    
                    <div style="text-align: center;">
                        <img src="${data.hinh_anh || 'https://via.placeholder.com/400'}" alt="${data.ten_thuong_goi}" style="max-width: 100%; width: 450px; height: 350px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); margin: 20px 0;">
                    </div>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #2e7d32;">
                        <h3 style="margin-top: 0; color: #1b5e20;">🌱 Đặc tính sinh học</h3>
                        <p style="line-height: 1.6; color: #333; margin-bottom: 0;">${data.dac_tinh_sinh_hoc}</p>
                    </div>

                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #1565c0;">
                        <h3 style="margin-top: 0; color: #0d47a1;">💊 Công dụng chữa bệnh</h3>
                        <p style="line-height: 1.6; color: #333; margin-bottom: 0;">${data.cong_dung}</p>
                    </div>

                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 10px; border-left: 5px solid #e65100;">
                        <h3 style="margin-top: 0; color: #bf360c;">📍 Khu vực phân bố</h3>
                        <p style="line-height: 1.6; color: #333; margin-bottom: 0;">${data.tap_trung_trong_o}</p>
                    </div>
                </div>
            `;
        } else {
            document.getElementById("chi-tiet-duoc-lieu").innerHTML = "Dược liệu này không tồn tại trên hệ thống.";
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// Chạy hàm
hienThiChiTiet();