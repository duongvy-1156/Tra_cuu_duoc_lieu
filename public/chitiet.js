import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Cấu hình Firebase
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

// 1. Hàm tự động tách dòng từ database và tạo các đoạn văn thụt lề chuẩn chỉnh
function dinhDangDoanVan(vanBan) {
    if (!vanBan) return "Chưa cập nhật dữ liệu.";
    
    return vanBan.split('\n')
        .filter(dong => dong.trim() !== "")
        .map(dong => `
            <p style="text-indent: 30px; line-height: 1.6; color: #333; margin-bottom: 12px; text-align: justify;">
                ${dong}
            </p>
        `).join('');
}

// 2. Hàm xử lý tương tác khi người dùng click vào ảnh thu nhỏ
window.doiAnhChinh = (imgElement, urlAnhMoi) => {
    const anhChinh = document.getElementById("anh-chinh-hien-thi");
    if (anhChinh) {
        anhChinh.src = urlAnhMoi;
    }
    document.querySelectorAll(".thumb-img").forEach(thumb => thumb.style.borderColor = "transparent");
    imgElement.style.borderColor = "#2e7d32";
};

// 3. Hàm chính hiển thị dữ liệu
async function hienThiChiTiet() {
    const urlParams = new URLSearchParams(window.location.search);
    const duocLieuId = urlParams.get('id');

    if (!duocLieuId) {
        document.getElementById("chi-tiet-duoc-lieu").innerHTML = "Không tìm thấy mã dược liệu!";
        return;
    }

    try {
        const docRef = doc(db, "duoc_lieu", duocLieuId);

        // Tăng lượt xem lên 1
        await updateDoc(docRef, {
            luot_xem: increment(1)
        });

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const khungHienThi = document.getElementById("chi-tiet-duoc-lieu");
            
            // Xử lý danh sách ảnh phụ cho album
            const listAnh = data.danh_sach_anh && data.danh_sach_anh.length > 0 ? data.danh_sach_anh : [data.hinh_anh || 'https://via.placeholder.com/400'];
            
            let thumbnailsHtml = "";
            if (listAnh.length > 1) {
                thumbnailsHtml = `<div style="display: flex; justify-content: center; gap: 10px; margin-top: 12px; flex-wrap: wrap;">`;
                listAnh.forEach((anhUrl, index) => {
                    thumbnailsHtml += `
                        <img src="${anhUrl}" class="thumb-img" style="width: 75px; height: 55px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid ${index === 0 ? '#2e7d32' : 'transparent'}; transition: all 0.2s;" onclick="doiAnhChinh(this, '${anhUrl}')">
                    `;
                });
                thumbnailsHtml += `</div>`;
            }

            // Đổ dữ liệu ra giao diện
            khungHienThi.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                    <h1 style="color: #2e7d32; text-align: center; margin-bottom: 5px; font-size: 32px;">${data.ten_thuong_goi}</h1>
                    <p style="text-align: center; color: #777; font-style: italic; margin-top: 0;">Tên khoa học: ${data.ten_khoa_hoc}</p>
                    
                    <div style="text-align: center; margin-bottom: 25px;">
                        <img id="anh-chinh-hien-thi" src="${listAnh[0]}" alt="${data.ten_thuong_goi}" style="max-width: 100%; width: 450px; height: 350px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); margin: 20px 0 5px 0;">
                        ${thumbnailsHtml}
                    </div>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #2e7d32;">
                        <h3 style="margin-top: 0; color: #1b5e20; margin-bottom: 10px;">🌱 Đặc tính sinh học</h3>
                        <div>${dinhDangDoanVan(data.dac_tinh_sinh_hoc)}</div>
                    </div>

                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #1565c0;">
                        <h3 style="margin-top: 0; color: #0d47a1; margin-bottom: 10px;">💊 Công dụng chữa bệnh</h3>
                        <div>${dinhDangDoanVan(data.cong_dung)}</div>
                    </div>

                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 10px; border-left: 5px solid #e65100;">
                        <h3 style="margin-top: 0; color: #bf360c; margin-bottom: 10px;">📍 Khu vực phân bố</h3>
                        <div>${dinhDangDoanVan(data.tap_trung_trong_o)}</div>
                    </div>
                </div>
            `;
        } else {
            document.getElementById("chi-tiet-duoc-lieu").innerHTML = "Dược liệu này không tồn tại trên hệ thống.";
        }
    } catch (error) {
        console.error("Lỗi:", error);
        document.getElementById("chi-tiet-duoc-lieu").innerHTML = "Có lỗi xảy ra khi tải dữ liệu từ đám mây.";
    }
}

// 4. Khởi chạy hàm hiển thị
hienThiChiTiet();

// 5. Xử lý nút "Quay lại danh sách" thông minh theo lịch sử trình duyệt
const nutQuayLai = document.querySelector(".btn-back");
if (nutQuayLai) {
    nutQuayLai.addEventListener("click", (e) => {
        e.preventDefault(); 
        if (document.referrer) {
            window.history.back(); 
        } else {
            window.location.href = "index.html"; 
        }
    });
}