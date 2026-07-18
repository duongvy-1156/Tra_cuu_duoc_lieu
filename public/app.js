import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let tatCaDuocLieu = [];
// HÀM ĐẾM VÀ HIỂN THỊ TỔNG LƯỢT TRUY CẬP TRANG WEB
async function xuLyLuotTruyCap() {
    const thongKeRef = doc(db, "thong_ke", "truy_cap");

    try {
        // 1. Lệnh cộng thêm 1 vào trường 'tong_luot' trên Firestore
        await updateDoc(thongKeRef, {
            tong_luot: increment(1)
        });

        // 2. Lấy con số mới nhất sau khi cộng để hiện ra màn hình
        const docSnap = await getDoc(thongKeRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Hiển thị con số thật lên giao diện (định dạng thêm dấu phẩy cho đẹp)
            document.getElementById("tong-luot-truy-cap").innerText = data.tong_luot.toLocaleString();
        }
    } catch (error) {
        console.error("Lỗi đếm lượt truy cập:", error);
        // Nếu lỗi thì hiện số mặc định để tránh trống trang
        document.getElementById("tong-luot-truy-cap").innerText = "1,000+";
    }
}
// 1. TẢI DỮ LIỆU & XỬ LÝ DƯỢC LIỆU PHỔ BIẾN
async function taiDuLieuTrangChu() {
    try {
        const querySnapshot = await getDocs(collection(db, "duoc_lieu"));
        let tongSoCay = 0;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            // Nếu cây chưa có trường luot_xem trong database, mặc định cho bằng 0
            data.luot_xem = data.luot_xem || 0; 
            tatCaDuocLieu.push(data);
            tongSoCay++;
        });

        // Lấy top 4 cây có lượt xem cao nhất để đưa vào mục Phổ biến
        const duocLieuPhoBien = [...tatCaDuocLieu].sort((a, b) => b.luot_xem - a.luot_xem).slice(0, 4);
        
        hienThiDanhSach(duocLieuPhoBien, "danh-sach-pho-bien");
        
        // Cập nhật Thống kê
        document.getElementById("tong-so-cay").innerText = tongSoCay;
        
        // Giả lập tổng lượt truy cập web (Thực tế Vy có thể lưu biến này trên Firestore)
        document.getElementById("tong-luot-truy-cap").innerText = "1,254"; 

    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// 2. HIỂN THỊ DANH SÁCH (Hỗ trợ hình ảnh)
function hienThiDanhSach(danhSach, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; 

    danhSach.forEach(cay => {
        const card = document.createElement("div");
        card.className = "card";
        card.onclick = () => { window.location.href = `chitiet.html?id=${cay.id}`; };
        
        // Dùng ảnh mặc định nếu cây chưa có link ảnh
        const anhHienThi = cay.hinh_anh || "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg";

        card.innerHTML = `
            <img src="${anhHienThi}" class="card-img" alt="${cay.ten_thuong_goi}">
            <h3>${cay.ten_thuong_goi}</h3>
            <p style="font-style: italic; color: #555;">${cay.ten_khoa_hoc}</p>
            <p style="font-size: 13px; color: #e65100;">👁️ ${cay.luot_xem} lượt xem</p>
        `;
        container.appendChild(card);
    });
}

// 3. TÌM KIẾM NHANH Ở TRANG CHỦ
// 3. TÌM KIẾM THEO TIÊU CHÍ (TÊN, CÔNG DỤNG, ĐỊA ĐIỂM)
const oTimKiem = document.getElementById("input-tim-kiem");
let tieuChiHienTai = "ten"; // Mặc định là tìm theo tên

// Hàm thực hiện lọc dữ liệu
function thucHienTimKiem() {
    const tuKhoa = oTimKiem.value.toLowerCase().trim();

    if(tuKhoa === "") {
        const duocLieuPhoBien = [...tatCaDuocLieu].sort((a, b) => b.luot_xem - a.luot_xem).slice(0, 4);
        hienThiDanhSach(duocLieuPhoBien, "danh-sach-pho-bien");
        return;
    }

    const ketQua = tatCaDuocLieu.filter(cay => {
        const tenCay = cay.ten_thuong_goi ? cay.ten_thuong_goi.toLowerCase() : "";
        const congDung = cay.cong_dung ? cay.cong_dung.toLowerCase() : "";
        const diaDiem = cay.tap_trung_trong_o ? cay.tap_trung_trong_o.toLowerCase() : "";

        if (tieuChiHienTai === "ten") return tenCay.includes(tuKhoa);
        if (tieuChiHienTai === "cong_dung") return congDung.includes(tuKhoa);
        if (tieuChiHienTai === "dia_diem") return diaDiem.includes(tuKhoa);
        
        return false;
    });

    hienThiDanhSach(ketQua, "danh-sach-pho-bien");
}

oTimKiem.addEventListener("input", thucHienTimKiem);

// --- LOGIC CHO MENU THẢ XUỐNG TỰ TẠO ---
const dropdown = document.getElementById("dropdown-tieu-chi");
const dropdownSelected = dropdown.querySelector(".dropdown-selected");
const dropdownOptions = dropdown.querySelector(".dropdown-options");
const dropdownItems = dropdown.querySelectorAll(".dropdown-item");

// Bấm vào ô để mở/đóng menu
dropdownSelected.addEventListener("click", (e) => {
    e.stopPropagation(); // Ngăn click lọt ra ngoài
    dropdownOptions.classList.toggle("show");
});

// Bấm ra chỗ trống bất kỳ trên web thì tự đóng menu
window.addEventListener("click", () => {
    dropdownOptions.classList.remove("show");
});

// Bấm chọn một mục trong menu
dropdownItems.forEach(item => {
    item.addEventListener("click", () => {
        // Cập nhật giá trị đang chọn (CSS đã tự lo mũi tên nên chỉ cần lấy text)
        tieuChiHienTai = item.getAttribute("data-value");
        dropdownSelected.innerHTML = item.innerHTML;
        // ... (phần dưới giữ nguyên)
        
        // Đổi câu gợi ý Placeholder
        if (tieuChiHienTai === "ten") oTimKiem.placeholder = "Nhập tên cây thuốc cần tìm...";
        else if (tieuChiHienTai === "cong_dung") oTimKiem.placeholder = "Nhập công dụng cần tìm...";
        else if (tieuChiHienTai === "dia_diem") oTimKiem.placeholder = "Nhập địa điểm phân bố...";

        // Tìm kiếm lại ngay
        thucHienTimKiem();
    });
});


// Khởi chạy hệ thống
xuLyLuotTruyCap(); // Chạy bộ đếm thật
taiDuLieuTrangChu(); // Tải danh sách cây thuốc

// ==========================================
// HIỂN THỊ TÊN NGƯỜI DÙNG LÊN THANH MENU
// ==========================================
onAuthStateChanged(auth, (user) => {
    const nutQuanTri = document.getElementById("nav-admin-link");
    
    if (nutQuanTri) {
        if (user) {
            // NẾU ĐÃ ĐĂNG NHẬP: Lấy tên hiển thị của tài khoản Google
            // (Nếu tài khoản lỡ không cài tên, nó sẽ lấy phần chữ trước dấu @ của email)
            const tenHienThi = user.displayName || user.email.split('@')[0];
            
            // Đổi chữ và có thể thêm icon vẫy tay cho thân thiện
            nutQuanTri.innerHTML = `👋 Chào, ${tenHienThi}`;
            
            // Tùy chọn: Làm nổi bật tên người dùng bằng màu vàng/cam
            nutQuanTri.style.color = "#ffb300"; 
            nutQuanTri.style.fontWeight = "bold";
        } else {
            // NẾU CHƯA ĐĂNG NHẬP (hoặc đã bấm đăng xuất): Trả về nguyên gốc
            nutQuanTri.innerText = "Quản trị";
            nutQuanTri.style.color = ""; // Trả về màu mặc định
            nutQuanTri.style.fontWeight = "";
        }
    }
});