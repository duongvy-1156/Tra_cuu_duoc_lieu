import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db, capNhatMenuDangNhap } from "./firebase-config.js";

const ANH_MAC_DINH = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="350" viewBox="0 0 450 350">
    <rect width="450" height="350" fill="#e8f5e9"/>
    <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="48">🌿</text>
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#2e7d32">Chưa có hình ảnh tư liệu</text>
  </svg>`
);

function dinhDangDoanVan(vanBan) {
    if (!vanBan || vanBan.trim() === "") return "";
    return vanBan.split('\n')
        .filter(dong => dong.trim() !== "")
        .map(dong => `<p>${dong}</p>`)
        .join('');
}

function taoMucCon(nhan, noiDung) {
    if (!noiDung || noiDung.trim() === "") return "";
    return `
        <div class="sub-field">
            <div class="sub-field-label">${nhan}</div>
            <div class="sub-field-text">${dinhDangDoanVan(noiDung)}</div>
        </div>
    `;
}

window.doiAnhChinh = (imgElement, urlAnhMoi) => {
    const anhChinh = document.getElementById("anh-chinh-hien-thi");
    if (anhChinh) anhChinh.src = urlAnhMoi;
    document.querySelectorAll(".thumb-img").forEach(thumb => thumb.classList.remove("active"));
    imgElement.classList.add("active");
};

async function hienThiChiTiet() {
    const urlParams = new URLSearchParams(window.location.search);
    const duocLieuId = urlParams.get('id');

    if (!duocLieuId) {
        document.getElementById("chi-tiet-duoc-lieu").innerHTML = "<p style='text-align:center; padding:30px;'>Không tìm thấy mã dược liệu!</p>";
        return;
    }

    try {
        const docRef = doc(db, "duoc_lieu", duocLieuId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            document.getElementById("chi-tiet-duoc-lieu").innerHTML = "<p style='text-align:center; padding:30px;'>Dược liệu này không tồn tại trên hệ thống.</p>";
            return;
        }

        const data = docSnap.data();
        const luotXemMoi = (data.luot_xem || 0) + 1;

        updateDoc(docRef, { luot_xem: increment(1) }).catch(err => {
            console.warn("Không thể cập nhật lượt xem:", err);
        });

        const khungHienThi = document.getElementById("chi-tiet-duoc-lieu");
        document.title = `${data.ten_thuong_goi} - Chi tiết Dược liệu`;

        const listAnh = data.danh_sach_anh && data.danh_sach_anh.length > 0
            ? data.danh_sach_anh
            : [data.hinh_anh || ANH_MAC_DINH];

        let thumbnailsHtml = "";
        if (listAnh.length > 1) {
            thumbnailsHtml = `<div class="gallery-thumbs">` +
                listAnh.map((anhUrl, index) => `
                    <img src="${anhUrl}" class="thumb-img ${index === 0 ? 'active' : ''}" onerror="this.src='${ANH_MAC_DINH}'" onclick="doiAnhChinh(this, '${anhUrl}')">
                `).join('') +
            `</div>`;
        }

        const noiDungThucVat = [
            taoMucCon("Mô tả hình thái", data.mo_ta_hinh_thai || data.dac_tinh_sinh_hoc),
            taoMucCon("Đặc điểm sinh thái", data.dac_diem_sinh_thai),
            taoMucCon("Khu vực phân bố", data.tap_trung_trong_o)
        ].join('');

        const noiDungDuocLy = [
            taoMucCon("Bộ phận dùng", data.bo_phan_dung),
            taoMucCon("Thành phần hóa học", data.thanh_phan_hoa_hoc),
            taoMucCon("Tính vị, quy kinh", data.tinh_vi_quy_kinh),
            taoMucCon("Công dụng & Chỉ định", data.cong_dung),
            taoMucCon("Cách dùng & Liều lượng", data.cach_dung)
        ].join('');

        const noiDungLuuY = taoMucCon("Lưu ý & Kiêng kỵ", data.luu_y_kieng_ky);

        const noiDungTrongTrot = [
            taoMucCon("Kỹ thuật trồng và chăm sóc", data.ky_thuat_trong),
            taoMucCon("Thời điểm thu hái", data.thoi_diem_thu_hai),
            taoMucCon("Sơ chế & Bảo quản", data.so_che_bao_quan)
        ].join('');

        khungHienThi.innerHTML = `
            <div class="detail-card">
                <div class="detail-hero">
                    <div>
                        <img id="anh-chinh-hien-thi" src="${listAnh[0]}" alt="${data.ten_thuong_goi}" class="gallery-main" onerror="this.src='${ANH_MAC_DINH}'">
                        ${thumbnailsHtml}
                    </div>
                    <div>
                        ${data.ho_thuc_vat ? `<span class="plant-badge">🌿 ${data.ho_thuc_vat}</span>` : ""}
                        <h1 class="plant-title">${data.ten_thuong_goi}</h1>
                        <p class="plant-scientific">Tên khoa học: ${data.ten_khoa_hoc || "Đang cập nhật"}</p>
                        
                        <div class="quick-meta">
                            ${data.bo_phan_dung ? `<div class="meta-row"><strong>Bộ phận dùng:</strong> ${data.bo_phan_dung}</div>` : ""}
                            ${data.tap_trung_trong_o ? `<div class="meta-row"><strong>Phân bố:</strong> ${data.tap_trung_trong_o}</div>` : ""}
                            <div class="meta-row"><strong>Lượt tra cứu:</strong> ${luotXemMoi} lượt</div>
                        </div>
                    </div>
                </div>

                <div class="detail-body">
                    ${noiDungThucVat ? `
                    <section class="info-section">
                        <h3 class="info-section-title">🌱 Đặc điểm Thực vật học & Sinh thái</h3>
                        ${noiDungThucVat}
                    </section>` : ""}

                    ${noiDungDuocLy ? `
                    <section class="info-section">
                        <h3 class="info-section-title">💊 Thông tin Dược lý & Y học</h3>
                        ${noiDungDuocLy}
                    </section>` : ""}

                    ${noiDungLuuY ? `
                    <section class="info-section warning-section">
                        <h3 class="info-section-title">⚠️ Lưu ý & Kiêng kỵ</h3>
                        ${noiDungLuuY}
                    </section>` : ""}

                    ${noiDungTrongTrot ? `
                    <section class="info-section">
                        <h3 class="info-section-title">🌾 Kỹ thuật Trồng trọt, Thu hái & Bảo quản</h3>
                        ${noiDungTrongTrot}
                    </section>` : ""}
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Lỗi:", error);
        document.getElementById("chi-tiet-duoc-lieu").innerHTML = "<p style='text-align:center; padding:30px;'>Có lỗi xảy ra khi tải dữ liệu từ đám mây.</p>";
    }
}

hienThiChiTiet();
capNhatMenuDangNhap();

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