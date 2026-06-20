import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, addDoc, updateDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyAYMLhxvoF3SY5VyaTUXhAwhX0xAoLaVJU",
  authDomain: "qlvatracuuduoclieu.firebaseapp.com",
  projectId: "qlvatracuuduoclieu",
  storageBucket: "qlvatracuuduoclieu.firebasestorage.app",
  messagingSenderId: "1064110527972",
  appId: "1:1064110527972:web:5e0f28e33840bcd67763f1",
  measurementId: "G-Z0VQQZ4FM3"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 1. KIỂM TRA BẢO MẬT: Bắt buộc đăng nhập VÀ phải có tên trong danh sách VIP
// 1. KIỂM TRA BẢO MẬT BẰNG FIREBASE DATABSE
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Tìm email trong bảng quan_tri_vien
        const q = query(collection(db, "quan_tri_vien"), where("email", "==", user.email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Hợp lệ: Tải dữ liệu bảng điều khiển
            taiDuLieuAdmin();
        } else {
            // Lách luật: Kích ra ngoài
            signOut(auth);
            window.location.href = "login.html";
        }
    } else {
        window.location.href = "login.html";
    }
});

// 2. HÀM TẢI DỮ LIỆU LÊN BẢNG
async function taiDuLieuAdmin() {
    try {
        const querySnapshot = await getDocs(collection(db, "duoc_lieu"));
        const tbody = document.getElementById("danh-sach-admin");
        let htmlContent = "";

        // Lặp qua từng cây thuốc lấy được
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id; // Lấy ID duy nhất của cây để sau này làm chức năng sửa/xóa
            
            htmlContent += `
                <tr>
                    <td><strong>${data.ten_thuong_goi || 'Chưa cập nhật'}</strong></td>
                    <td><i>${data.ten_khoa_hoc || 'Chưa cập nhật'}</i></td>
                    <td>${data.tap_trung_trong_o || 'Chưa cập nhật'}</td>
                    <td>
                        <button class="action-btn" style="background-color: #2196F3; color: white;" onclick="xemMaQR('${id}')">Mã QR</button>
                        
                        <button class="action-btn btn-edit" onclick="suaDuocLieu('${id}')">Sửa</button>
                        <button class="action-btn btn-delete" onclick="xoaDuocLieu('${id}')">Xóa</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = htmlContent;
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        document.getElementById("danh-sach-admin").innerHTML = "<tr><td colspan='4'>Có lỗi xảy ra khi tải dữ liệu.</td></tr>";
    }
}

// 3. XỬ LÝ NÚT ĐĂNG XUẤT
document.getElementById("btn-logout").addEventListener("click", () => {
    signOut(auth).then(() => {
        // Đăng xuất thành công, chuyển về trang đăng nhập
        window.location.href = "login.html";
    }).catch((error) => {
        alert("Lỗi đăng xuất: " + error.message);
    });
});

// ==========================================
// TÍNH NĂNG SỬA VÀ CẬP NHẬT DỮ LIỆU
// ==========================================
let idDangSua = null; // Biến nhớ xem đang thêm mới hay sửa

// Khi bấm nút Sửa trên bảng
window.suaDuocLieu = async (id) => {
    try {
        // Lấy dữ liệu cũ từ đám mây về
        const docSnap = await getDoc(doc(db, "duoc_lieu", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Đổ dữ liệu cũ vào các ô textbox
            document.getElementById("input-ten").value = data.ten_thuong_goi || "";
            document.getElementById("input-khoa-hoc").value = data.ten_khoa_hoc || "";
            document.getElementById("input-dac-tinh").value = data.dac_tinh_sinh_hoc || "";
            document.getElementById("input-cong-dung").value = data.cong_dung || "";
            document.getElementById("input-khu-vuc").value = data.tap_trung_trong_o || "";
            document.getElementById("input-hinh-anh").value = data.hinh_anh || "";

            // Đánh dấu ID đang sửa, đổi tên nút và hiện form
            idDangSua = id;
            const btnSave = document.getElementById("btn-save");
            btnSave.innerText = "Cập Nhật Lên Đám Mây";
            btnSave.style.backgroundColor = "#ff9800"; // Đổi màu cam cho dễ phân biệt
            
            formContainer.style.display = "block";
            window.scrollTo(0, 0); // Cuộn màn hình lên chỗ cái Form
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
    }
};

// Gắn lại chức năng dọn dẹp Form cho nút Hủy Bỏ
document.getElementById("btn-cancel").addEventListener("click", () => {
    idDangSua = null; // Reset lại biến
    const btnSave = document.getElementById("btn-save");
    btnSave.innerText = "Lưu Lên Đám Mây";
    btnSave.style.backgroundColor = "#2e7d32"; // Trả lại màu xanh
});

// Xử lý nút Lưu (Gánh cả 2 việc: Thêm mới hoặc Cập nhật)
document.getElementById("btn-save").addEventListener("click", async () => {
    const ten = document.getElementById("input-ten").value.trim();
    const khoaHoc = document.getElementById("input-khoa-hoc").value.trim();
    const dacTinh = document.getElementById("input-dac-tinh").value.trim();
    const congDung = document.getElementById("input-cong-dung").value.trim();
    const khuVuc = document.getElementById("input-khu-vuc").value.trim();
    const hinhAnh = document.getElementById("input-hinh-anh").value.trim();

    if (!ten || !khoaHoc) {
        alert("Vui lòng nhập Tên thường gọi và Tên khoa học!");
        return;
    }

    const btnSave = document.getElementById("btn-save");
    btnSave.innerText = "Đang xử lý...";
    btnSave.disabled = true;

    try {
        const duocLieuData = {
            ten_thuong_goi: ten,
            ten_khoa_hoc: khoaHoc,
            dac_tinh_sinh_hoc: dacTinh,
            cong_dung: congDung,
            tap_trung_trong_o: khuVuc,
            hinh_anh: hinhAnh
        };

        if (idDangSua) {
            // NẾU ĐANG SỬA: Cập nhật đè lên Document cũ
            await updateDoc(doc(db, "duoc_lieu", idDangSua), duocLieuData);
            alert("Đã cập nhật thành công!");
        } else {
            // NẾU THÊM MỚI: Tạo Document mới
            await addDoc(collection(db, "duoc_lieu"), duocLieuData);
            alert("Đã thêm dược liệu mới thành công!");
        }
        
        // Reset mọi thứ sau khi xong
        idDangSua = null;
        btnSave.innerText = "Lưu Lên Đám Mây";
        btnSave.style.backgroundColor = "#2e7d32";
        
        btnSave.disabled = false; // <--- THÊM DÒNG GIẢI CỨU NÀY VÀO ĐÂY NHÉ!
        
        formContainer.style.display = "none";
        xoaTrangForm();
        taiDuLieuAdmin();
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Có lỗi xảy ra: " + error.message);
        btnSave.innerText = idDangSua ? "Cập Nhật Lên Đám Mây" : "Lưu Lên Đám Mây";
        btnSave.disabled = false;
    }
});

window.xoaDuocLieu = async (id) => {
    // Hiện hộp thoại hỏi lại cho chắc chắn
    const xacNhan = confirm("Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa cây thuốc này khỏi hệ thống?");
    
    if (xacNhan) {
        try {
            // Lệnh bắn lên đám mây để xóa Document có ID tương ứng
            await deleteDoc(doc(db, "duoc_lieu", id));
            alert("Đã xóa thành công!");
            
            // Xóa xong thì gọi lại hàm tải dữ liệu để bảng tự động cập nhật
            taiDuLieuAdmin(); 
        } catch (error) {
            console.error("Lỗi khi xóa:", error);
            alert("Lỗi khi xóa: " + error.message);
        }
    }
};
// ==========================================
// XỬ LÝ ẨN/HIỆN FORM THÊM DỮ LIỆU
// ==========================================
const formContainer = document.getElementById("form-container");

// Bấm nút "Thêm Dược Liệu Mới" -> Hiện Form
document.getElementById("btn-show-add-form").addEventListener("click", () => {
    formContainer.style.display = "block"; 
});

// Bấm nút "Hủy Bỏ" -> Ẩn Form và xóa trắng dữ liệu đang nhập dở
document.getElementById("btn-cancel").addEventListener("click", () => {
    formContainer.style.display = "none"; 
    xoaTrangForm(); 
});

// Hàm phụ để làm sạch các ô nhập liệu
function xoaTrangForm() {
    document.getElementById("input-ten").value = "";
    document.getElementById("input-khoa-hoc").value = "";
    document.getElementById("input-dac-tinh").value = "";
    document.getElementById("input-cong-dung").value = "";
    document.getElementById("input-khu-vuc").value = "";
    document.getElementById("input-hinh-anh").value = "";
}

// 8. TÍNH NĂNG TỰ ĐỘNG TẠO MÃ QR
window.xemMaQR = (id) => {
    // 1. Tạo đường link thực tế trỏ thẳng vào trang chi tiết của cây thuốc này
    // (Bắt buộc dùng link web.app để quét bằng điện thoại sẽ chạy được bằng mạng 4G)
    const linkChiTiet = `https://qlvatracuuduoclieu.web.app/chitiet.html?id=${id}`;
    
    // 2. Gọi API để biến đường link trên thành một tấm ảnh QR kích thước 300x300
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(linkChiTiet)}`;
    
    // 3. Mở tấm ảnh QR đó sang một Tab mới để Ban chủ nhiệm dễ dàng nhấp chuột phải -> Lưu hình ảnh (Save image as...)
    window.open(qrApiUrl, "_blank");
};