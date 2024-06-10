function fn_Gui_Lien_He() {
    var email = document.getElementById("tbx_email").value;

    // Kiểm tra thông tin không rỗng
    if (email.trim() === "") {
        alert("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    // Kiểm tra email hợp lệ
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Vui lòng nhập địa chỉ email hợp lệ.");
        return;
    }

    // Gửi thông tin lên server qua socket
    socket.emit('gui_lien_he', { email: email});
}

socket.on('luu_lien_he_thanh_cong', function(message) {
    alert(message);
});

socket.on('luu_lien_he_that_bai', function(message) {
    alert(message);
});