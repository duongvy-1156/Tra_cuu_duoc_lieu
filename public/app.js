import { collection, getDocs, doc, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db, capNhatMenuDangNhap } from "./firebase-config.js";

const ANH_MAC_DINH = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
    <rect width="300" height="150" fill="#e8f5e9"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="36">🌿</text>
  </svg>`
);

let tatCaDuocLieu = [];

function chuanHoaTimKiem(chuoi) {
    if (!chuoi) return "";
    return chuoi
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

// 1. Đếm và hiển thị tổng lượt truy cập
async function xuLyLuotTruyCap() {
    const thongKeRef = doc(db, "thong_ke", "truy_cap");

    try {
        if (!sessionStorage.getItem("daDemLuotTruyCap")) {
            await updateDoc(thongKeRef, { tong_luot: increment(1) });
            sessionStorage.setItem("daDemLuotTruyCap", "1");
        }

        const docSnap = await getDoc(thongKeRef);
        if (docSnap.exists()) {
            document.getElementById("tong-luot-truy-cap").innerText = docSnap.data().tong_luot.toLocaleString("vi-VN");
        }
    } catch (error) {
        console.error("Lỗi đếm lượt truy cập:", error);
        document.getElementById("tong-luot-truy-cap").innerText = "1.000+";
    }
}

// 2. Tải dữ liệu trang chủ
async function taiDuLieuTrangChu() {
    try {
        const querySnapshot = await getDocs(collection(db, "duoc_lieu"));
        let tongSoCay = 0;
        tatCaDuocLieu = [];
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            data.id = docSnap.id;
            data.luot_xem = data.luot_xem || 0; 
            tatCaDuocLieu.push(data);
            tongSoCay++;
        });

        const inputSearch = document.getElementById("input-tim-kiem");
        if (inputSearch && inputSearch.value.trim() !== "") {
            thucHienTimKiem();
        } else {
            const duocLieuPhoBien = [...tatCaDuocLieu].sort((a, b) => b.luot_xem - a.luot_xem).slice(0, 4);
            hienThiDanhSach(duocLieuPhoBien, "danh-sach-pho-bien");
        }

        document.getElementById("tong-so-cay").innerText = tongSoCay;
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// 3. Hiển thị danh sách thẻ cây thuốc
function hienThiDanhSach(danhSach, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; 

    if (danhSach.length === 0) {
        container.innerHTML = `<p class="empty-message">Không tìm thấy dược liệu nào phù hợp với từ khóa.</p>`;
        return;
    }

    danhSach.forEach(cay => {
        const card = document.createElement("div");
        card.className = "card";
        card.onclick = () => { window.location.href = `chitiet.html?id=${cay.id}`; };
        
        const anhHienThi = cay.hinh_anh || ANH_MAC_DINH;

        card.innerHTML = `
            <img src="${anhHienThi}" class="card-img" alt="${cay.ten_thuong_goi}" onerror="this.src='${ANH_MAC_DINH}'">
            <h3>${cay.ten_thuong_goi}</h3>
            <p style="font-style: italic; color: #555;">${cay.ten_khoa_hoc}</p>
            <p style="font-size: 13px; color: #e65100;">👁️ ${cay.luot_xem} lượt xem</p>
        `;
        container.appendChild(card);
    });
}

// 4. Tìm kiếm theo tiêu chí
const oTimKiem = document.getElementById("input-tim-kiem");
const tieuDeDanhSach = document.querySelector(".popular-section .section-title");
let tieuChiHienTai = "ten";

function khopTheoTu(chuoiDaChuanHoa, tuKhoa) {
    if (!tuKhoa.includes(" ")) {
        return chuoiDaChuanHoa.split(/\s+/).some(tu => tu.startsWith(tuKhoa));
    }
    return chuoiDaChuanHoa.includes(tuKhoa);
}

function thucHienTimKiem() {
    const tuKhoa = chuanHoaTimKiem(oTimKiem.value.trim());

    if (tuKhoa === "") {
        if (tieuDeDanhSach) tieuDeDanhSach.innerText = "🔥 Dược Liệu Phổ Biến";
        const duocLieuPhoBien = [...tatCaDuocLieu].sort((a, b) => b.luot_xem - a.luot_xem).slice(0, 4);
        hienThiDanhSach(duocLieuPhoBien, "danh-sach-pho-bien");
        return;
    }

    const ketQua = tatCaDuocLieu.filter(cay => {
        const tenCay = chuanHoaTimKiem(cay.ten_thuong_goi);
        const tenKhoaHoc = chuanHoaTimKiem(cay.ten_khoa_hoc);
        const congDung = chuanHoaTimKiem(cay.cong_dung);
        const diaDiem = chuanHoaTimKiem(cay.tap_trung_trong_o);

        if (tieuChiHienTai === "ten") return khopTheoTu(tenCay, tuKhoa);
        if (tieuChiHienTai === "khoa_hoc") return khopTheoTu(tenKhoaHoc, tuKhoa);
        if (tieuChiHienTai === "cong_dung") return congDung.includes(tuKhoa);
        if (tieuChiHienTai === "dia_diem") return diaDiem.includes(tuKhoa);
        return false;
    });

    if (tieuDeDanhSach) tieuDeDanhSach.innerText = `🔍 Kết quả tìm kiếm (${ketQua.length} dược liệu)`;
    hienThiDanhSach(ketQua, "danh-sach-pho-bien");
}

oTimKiem.addEventListener("input", thucHienTimKiem);

const dropdown = document.getElementById("dropdown-tieu-chi");
const dropdownSelected = dropdown.querySelector(".dropdown-selected");
const dropdownOptions = dropdown.querySelector(".dropdown-options");
const dropdownItems = dropdown.querySelectorAll(".dropdown-item");

dropdownSelected.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownOptions.classList.toggle("show");
});

window.addEventListener("click", () => {
    dropdownOptions.classList.remove("show");
});

dropdownItems.forEach(item => {
    item.addEventListener("click", () => {
        tieuChiHienTai = item.getAttribute("data-value");
        dropdownSelected.innerHTML = item.innerHTML;
        
        if (tieuChiHienTai === "ten") oTimKiem.placeholder = "Nhập tên cây thuốc cần tìm...";
        else if (tieuChiHienTai === "khoa_hoc") oTimKiem.placeholder = "Nhập tên khoa học cần tìm...";
        else if (tieuChiHienTai === "cong_dung") oTimKiem.placeholder = "Nhập công dụng cần tìm...";
        else if (tieuChiHienTai === "dia_diem") oTimKiem.placeholder = "Nhập địa điểm phân bố...";

        thucHienTimKiem();
    });
});

// Khởi chạy
xuLyLuotTruyCap();
taiDuLieuTrangChu();
capNhatMenuDangNhap();

window.addEventListener("pageshow", (event) => {
    if (event.persisted) taiDuLieuTrangChu();
});