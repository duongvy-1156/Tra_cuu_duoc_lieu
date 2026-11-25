import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db, capNhatMenuDangNhap } from "./firebase-config.js";

const ANH_MAC_DINH = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
    <rect width="300" height="150" fill="#e8f5e9"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="36">🌿</text>
  </svg>`
);

let tatCaDuocLieu = [];

function boDauThanh(chuoi) {
    if (!chuoi) return "";
    return chuoi
        .normalize('NFD')
        .replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '')
        .normalize('NFC');
}

function taoBoLocChuCai() {
    const bangChuCaiViet = [
        "A", "Ă", "Â", "B", "C", "D", "Đ", "E", "Ê", "G", "H", "I", 
        "K", "L", "M", "N", "O", "Ô", "Ơ", "P", "Q", "R", "S", "T", 
        "U", "Ư", "V", "X", "Y"
    ];
    const boLocContainer = document.getElementById("bo-loc-chu-cai");
    
    bangChuCaiViet.forEach(chu => {
        const btn = document.createElement("button");
        btn.className = "btn-filter";
        btn.innerText = chu;
        btn.setAttribute("data-letter", chu);
        
        btn.addEventListener("click", () => {
            document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            sessionStorage.setItem("chuCaiDaChon", chu);
            locTheoChuCai(chu);
        });
        
        boLocContainer.appendChild(btn);
    });

    document.querySelector(".btn-filter[data-letter='ALL']").addEventListener("click", (e) => {
        document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        sessionStorage.setItem("chuCaiDaChon", "ALL");
        hienThiDanhSach(tatCaDuocLieu);
    });
}

async function taiDuLieuDanhMuc() {
    try {
        const querySnapshot = await getDocs(collection(db, "duoc_lieu"));
        tatCaDuocLieu = [];
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            data.id = docSnap.id;
            data.luot_xem = data.luot_xem || 0; 
            tatCaDuocLieu.push(data);
        });

        tatCaDuocLieu.sort((a, b) => (a.ten_thuong_goi || "").localeCompare(b.ten_thuong_goi || "", 'vi'));

        const tuChitietQuayVe = document.referrer.includes("chitiet.html");
        const chuCaiLuuTru = tuChitietQuayVe ? (sessionStorage.getItem("chuCaiDaChon") || "ALL") : "ALL";

        if (chuCaiLuuTru === "ALL") {
            const btnAll = document.querySelector(".btn-filter[data-letter='ALL']");
            if (btnAll) {
                document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
                btnAll.classList.add("active");
            }
            hienThiDanhSach(tatCaDuocLieu);
        } else {
            const nutMucTieu = document.querySelector(`.btn-filter[data-letter='${chuCaiLuuTru}']`);
            if (nutMucTieu) {
                document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
                nutMucTieu.classList.add("active");
            }
            locTheoChuCai(chuCaiLuuTru);
        }
    } catch (error) {
        console.error("Lỗi:", error);
        document.getElementById("danh-sach-duoc-lieu").innerHTML = "<p>Lỗi kết nối máy chủ!</p>";
    }
}

function hienThiDanhSach(danhSach) {
    const container = document.getElementById("danh-sach-duoc-lieu");
    container.innerHTML = ""; 

    if (danhSach.length === 0) {
        container.innerHTML = `<p class="empty-message">Không có dược liệu nào bắt đầu bằng chữ cái này.</p>`;
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
            <p style="font-style: italic; color: #555; margin-bottom: 5px;">${cay.ten_khoa_hoc}</p>
        `;
        container.appendChild(card);
    });
}

function locTheoChuCai(chuCai) {
    const ketQua = tatCaDuocLieu.filter(cay => {
        const tenKhongDauThanh = boDauThanh(cay.ten_thuong_goi).trim();
        const chuDauTien = tenKhongDauThanh.charAt(0).toUpperCase();
        return chuDauTien === chuCai;
    });
    hienThiDanhSach(ketQua);
}

taoBoLocChuCai();
taiDuLieuDanhMuc();
capNhatMenuDangNhap();