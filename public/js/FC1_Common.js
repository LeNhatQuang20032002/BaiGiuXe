var myVar = setInterval(myTimer, 1000);
function myTimer() {
    socket.emit("Client-send-data", "Request data client");
}

// Chương trình con chuyển trang
function fn_ScreenChange(scr_1, scr_2, scr_3, scr_4, scr_5, scr_6) {
    document.getElementById(scr_1).style.display = 'block';   // Hiển thị trang được chọn
    document.getElementById(scr_2).style.display = 'none';    // Ẩn trang 1
    document.getElementById(scr_3).style.display = 'none';    // Ẩn trang 2
    document.getElementById(scr_4).style.display = 'none';    // Ẩn trang 3
    document.getElementById(scr_5).style.display = 'none';    // Ẩn trang 4
    document.getElementById(scr_6).style.display = 'none';    // Ẩn trang 4
}   

// Chương trình con đọc dữ liệu lên IO Field
function fn_IOFieldDataShow(tag, IOField, tofix){
    socket.on(tag,function(data){
        if(tofix == 0){
            document.getElementById(IOField).value = data;
        } else{
        document.getElementById(IOField).value = data.toFixed(tofix);
        }
    });
}

// Chương trình con đổi màu Symbol
function fn_SymbolStatus(ObjectID, SymName, Tag){
    var imglink_0 = "images/Symbol/" + SymName + "_0.png"; // Trạng thái tag = 0
    var imglink_1 = "images/Symbol/" + SymName + "_1.png"; // Trạng thái tag = 1
    var imglink_2 = "images/Symbol/" + SymName + "_2.png"; // Trạng thái tag = 2
    var imglink_3 = "images/Symbol/" + SymName + "_3.png"; // Trạng thái tag = 3
    var imglink_4 = "images/Symbol/" + SymName + "_4.png"; // Trạng thái tag = 4
    var imglink_5 = "images/Symbol/" + SymName + "_5.png"; // Trạng thái tag = 5
    socket.on(Tag,function(data){
        if(data == 0){
            document.getElementById(ObjectID).src = imglink_0;
        }
        else if(data == 1){
            document.getElementById(ObjectID).src = imglink_1;
        }
        else if(data == 2){
            document.getElementById(ObjectID).src = imglink_2;
        }
        else if(data == 3){
            document.getElementById(ObjectID).src = imglink_3;
        }
        else if(data == 4){
            document.getElementById(ObjectID).src = imglink_4;
        }
        else{
            document.getElementById(ObjectID).src = imglink_5;
        }
    });
}

// Chương trình con đổi màu Symbol
function fn_Show_Hide(ObjectID, Tag){
    socket.on(Tag,function(data){
        if(data == 1||data == true){
            document.getElementById(ObjectID).style.display='block';
        }
        else{
            document.getElementById(ObjectID).style.display='none';
        }
    });
}
