import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DÁN FIREBASE CONFIG CỦA VY VÀO ĐÂY
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

let tatCaDuocLieu = [];

// 1. TẢO NÚT BẤM CHO BẢNG CHỮ CÁI
function taoBoLocChuCai() {
    const bangChuCai = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const boLocContainer = document.getElementById("bo-loc-chu-cai");
    
    bangChuCai.forEach(chu => {
        const btn = document.createElement("button");
        btn.className = "btn-filter";
        btn.innerText = chu;
        btn.setAttribute("data-letter", chu);
        
        btn.addEventListener("click", () => {
            // Hiệu ứng đổi màu nút khi bấm
            document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            locTheoChuCai(chu);
        });
        
        boLocContainer.appendChild(btn);
    });

    // Xử lý riêng cho nút "Tất cả"
    document.querySelector(".btn-filter[data-letter='ALL']").addEventListener("click", (e) => {
        document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        hienThiDanhSach(tatCaDuocLieu);
    });
}

// 2. KÉO DỮ LIỆU TỪ FIREBASE XUỐNG
async function taiDuLieuDanhMuc() {
    try {
        const querySnapshot = await getDocs(collection(db, "duoc_lieu"));
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            data.luot_xem = data.luot_xem || 0; 
            tatCaDuocLieu.push(data);
        });

        // Sắp xếp mặc định A-Z
        tatCaDuocLieu.sort((a, b) => a.ten_thuong_goi.localeCompare(b.ten_thuong_goi));
        hienThiDanhSach(tatCaDuocLieu);

    } catch (error) {
        console.error("Lỗi:", error);
        document.getElementById("danh-sach-duoc-lieu").innerHTML = "<p>Lỗi kết nối máy chủ!</p>";
    }
}

// 3. HIỂN THỊ DANH SÁCH RA MÀN HÌNH
function hienThiDanhSach(danhSach) {
    const container = document.getElementById("danh-sach-duoc-lieu");
    container.innerHTML = ""; 

    if (danhSach.length === 0) {
        container.innerHTML = "<p style='text-align:center; width:100%;'>Không có dược liệu nào bắt đầu bằng chữ cái này.</p>";
        return;
    }

    danhSach.forEach(cay => {
        const card = document.createElement("div");
        card.className = "card";
        card.onclick = () => { window.location.href = `chitiet.html?id=${cay.id}`; };
        
        const anhHienThi = cay.hinh_anh || "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg";

        card.innerHTML = `
            <img src="${anhHienThi}" class="card-img" alt="${cay.ten_thuong_goi}">
            <h3>${cay.ten_thuong_goi}</h3>
            <p style="font-style: italic; color: #555; margin-bottom: 5px;">${cay.ten_khoa_hoc}</p>
        `;
        container.appendChild(card);
    });
}

// 4. LỌC CÂY THEO CHỮ CÁI ĐẦU TIÊN
function locTheoChuCai(chuCai) {
    const ketQua = tatCaDuocLieu.filter(cay => {
        // Lấy ký tự đầu tiên, bỏ dấu (nếu có) và in hoa để so sánh
        const ten = cay.ten_thuong_goi.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const chuDauTien = ten.charAt(0).toUpperCase();
        return chuDauTien === chuCai;
    });
    hienThiDanhSach(ketQua);
}

// Chạy hệ thống
taoBoLocChuCai();
taiDuLieuDanhMuc();