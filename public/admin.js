import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const formContainer = document.getElementById("form-container");
const btnSave = document.getElementById("btn-save");
let idDangSua = null;

// 1. Kiểm tra quyền quản trị viên
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const q = query(collection(db, "quan_tri_vien"), where("email", "==", user.email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            taiDuLieuAdmin();
        } else {
            signOut(auth);
            window.location.href = "login.html";
        }
    } else {
        window.location.href = "login.html";
    }
});

// 2. Tải danh sách lên bảng (sắp xếp theo tiếng Việt)
async function taiDuLieuAdmin() {
    try {
        const querySnapshot = await getDocs(collection(db, "duoc_lieu"));
        const tbody = document.getElementById("danh-sach-admin");
        const danhSach = [];

        querySnapshot.forEach((docSnap) => {
            danhSach.push({ id: docSnap.id, ...docSnap.data() });
        });

        danhSach.sort((a, b) => (a.ten_thuong_goi || "").localeCompare(b.ten_thuong_goi || "", 'vi'));

        if (danhSach.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Chưa có dược liệu nào trong hệ thống.</td></tr>";
            return;
        }

        tbody.innerHTML = danhSach.map(data => `
            <tr>
                <td><strong>${data.ten_thuong_goi || 'Chưa cập nhật'}</strong></td>
                <td><i>${data.ten_khoa_hoc || 'Chưa cập nhật'}</i></td>
                <td>${data.tap_trung_trong_o || 'Chưa cập nhật'}</td>
                <td>
                    <button class="action-btn" style="background-color: #2196F3; color: white;" onclick="xemMaQR('${data.id}')">Mã QR</button>
                    <button class="action-btn btn-edit" onclick="suaDuocLieu('${data.id}')">Sửa</button>
                    <button class="action-btn btn-delete" onclick="xoaDuocLieu('${data.id}')">Xóa</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        document.getElementById("danh-sach-admin").innerHTML = "<tr><td colspan='4'>Có lỗi xảy ra khi tải dữ liệu.</td></tr>";
    }
}

// 3. Đăng xuất
document.getElementById("btn-logout").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        alert("Lỗi đăng xuất: " + error.message);
    });
});

// 4. Mở / Hủy form
document.getElementById("btn-show-add-form").addEventListener("click", () => {
    datLaiTrangThaiForm();
    formContainer.style.display = "block";
});

document.getElementById("btn-cancel").addEventListener("click", () => {
    datLaiTrangThaiForm();
    formContainer.style.display = "none";
});

function datLaiTrangThaiForm() {
    idDangSua = null;
    btnSave.innerText = "Lưu Lên Đám Mây";
    btnSave.style.backgroundColor = "#2e7d32";
    btnSave.disabled = false;
    xoaTrangForm();
}

// 5. Nạp dữ liệu khi bấm Sửa
window.suaDuocLieu = async (id) => {
    try {
        const docSnap = await getDoc(doc(db, "duoc_lieu", id));
        if (docSnap.exists()) {
            const data = docSnap.data();

            document.getElementById("input-ten").value = data.ten_thuong_goi || "";
            document.getElementById("input-khoa-hoc").value = data.ten_khoa_hoc || "";
            document.getElementById("input-ho-thuc-vat").value = data.ho_thuc_vat || "";

            document.getElementById("input-mo-ta-hinh-thai").value = data.mo_ta_hinh_thai || data.dac_tinh_sinh_hoc || "";
            document.getElementById("input-khu-vuc").value = data.tap_trung_trong_o || "";
            document.getElementById("input-dac-diem-sinh-thai").value = data.dac_diem_sinh_thai || "";

            document.getElementById("input-bo-phan-dung").value = data.bo_phan_dung || "";
            document.getElementById("input-thanh-phan-hoa-hoc").value = data.thanh_phan_hoa_hoc || "";
            document.getElementById("input-tinh-vi").value = data.tinh_vi_quy_kinh || "";
            document.getElementById("input-cong-dung").value = data.cong_dung || "";
            document.getElementById("input-cach-dung").value = data.cach_dung || "";
            document.getElementById("input-luu-y").value = data.luu_y_kieng_ky || "";

            document.getElementById("input-ky-thuat-trong").value = data.ky_thuat_trong || "";
            document.getElementById("input-thoi-diem-thu-hai").value = data.thoi_diem_thu_hai || "";
            document.getElementById("input-so-che").value = data.so_che_bao_quan || "";

            document.getElementById("input-hinh-anh").value = data.danh_sach_anh ? data.danh_sach_anh.join('\n') : (data.hinh_anh || "");

            idDangSua = id;
            btnSave.innerText = "Cập Nhật Lên Đám Mây";
            btnSave.style.backgroundColor = "#ff9800";

            formContainer.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
    }
};

// 6. Lưu mới hoặc cập nhật
btnSave.addEventListener("click", async () => {
    const ten = document.getElementById("input-ten").value.trim();
    const khoaHoc = document.getElementById("input-khoa-hoc").value.trim();

    if (!ten || !khoaHoc) {
        alert("Vui lòng nhập Tên phổ thông và Tên khoa học!");
        return;
    }

    const hinhAnhText = document.getElementById("input-hinh-anh").value.trim();
    const danhSachAnh = hinhAnhText.split('\n').map(url => url.trim()).filter(url => url !== "");

    const linkKhongHopLe = danhSachAnh.find(url => !/^https?:\/\/.+/i.test(url));
    if (linkKhongHopLe) {
        alert(`Đường link hình ảnh không hợp lệ (phải bắt đầu bằng http:// hoặc https://):\n${linkKhongHopLe}`);
        return;
    }

    const anhChinh = danhSachAnh.length > 0 ? danhSachAnh[0] : "";

    btnSave.innerText = "Đang xử lý...";
    btnSave.disabled = true;

    try {
        const duocLieuData = {
            ten_thuong_goi: ten,
            ten_khoa_hoc: khoaHoc,
            ho_thuc_vat: document.getElementById("input-ho-thuc-vat").value.trim(),

            mo_ta_hinh_thai: document.getElementById("input-mo-ta-hinh-thai").value.trim(),
            tap_trung_trong_o: document.getElementById("input-khu-vuc").value.trim(),
            dac_diem_sinh_thai: document.getElementById("input-dac-diem-sinh-thai").value.trim(),

            bo_phan_dung: document.getElementById("input-bo-phan-dung").value.trim(),
            thanh_phan_hoa_hoc: document.getElementById("input-thanh-phan-hoa-hoc").value.trim(),
            tinh_vi_quy_kinh: document.getElementById("input-tinh-vi").value.trim(),
            cong_dung: document.getElementById("input-cong-dung").value.trim(),
            cach_dung: document.getElementById("input-cach-dung").value.trim(),
            luu_y_kieng_ky: document.getElementById("input-luu-y").value.trim(),

            ky_thuat_trong: document.getElementById("input-ky-thuat-trong").value.trim(),
            thoi_diem_thu_hai: document.getElementById("input-thoi-diem-thu-hai").value.trim(),
            so_che_bao_quan: document.getElementById("input-so-che").value.trim(),

            hinh_anh: anhChinh,
            danh_sach_anh: danhSachAnh
        };

        if (idDangSua) {
            await updateDoc(doc(db, "duoc_lieu", idDangSua), duocLieuData);
            alert("Đã cập nhật thành công!");
        } else {
            duocLieuData.luot_xem = 0;
            await addDoc(collection(db, "duoc_lieu"), duocLieuData);
            alert("Đã thêm dược liệu mới thành công!");
        }

        datLaiTrangThaiForm();
        formContainer.style.display = "none";
        taiDuLieuAdmin();
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Có lỗi xảy ra: " + error.message);
        btnSave.innerText = idDangSua ? "Cập Nhật Lên Đám Mây" : "Lưu Lên Đám Mây";
        btnSave.disabled = false;
    }
});

// 7. Xóa dược liệu
window.xoaDuocLieu = async (id) => {
    const xacNhan = confirm("Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa cây thuốc này khỏi hệ thống?");
    if (xacNhan) {
        try {
            await deleteDoc(doc(db, "duoc_lieu", id));
            if (idDangSua === id) {
                datLaiTrangThaiForm();
                formContainer.style.display = "none";
            }
            alert("Đã xóa thành công!");
            taiDuLieuAdmin();
        } catch (error) {
            console.error("Lỗi khi xóa:", error);
            alert("Lỗi khi xóa: " + error.message);
        }
    }
};

function xoaTrangForm() {
    const ids = [
        "input-ten", "input-khoa-hoc", "input-ho-thuc-vat",
        "input-mo-ta-hinh-thai", "input-khu-vuc", "input-dac-diem-sinh-thai",
        "input-bo-phan-dung", "input-thanh-phan-hoa-hoc", "input-tinh-vi",
        "input-cong-dung", "input-cach-dung", "input-luu-y",
        "input-ky-thuat-trong", "input-thoi-diem-thu-hai", "input-so-che",
        "input-hinh-anh"
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

// 8. Tạo mã QR
window.xemMaQR = (id) => {
    const linkChiTiet = `https://qlvatracuuduoclieu.web.app/chitiet.html?id=${id}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(linkChiTiet)}`;
    window.open(qrApiUrl, "_blank");
};