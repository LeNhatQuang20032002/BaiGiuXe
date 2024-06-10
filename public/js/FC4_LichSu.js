// Tìm kiếm SQL theo khoảng thời gian
function fn_SQL_By_Time()
{
    var startDateTime=document.getElementById('dtpk_Search_Start').value;
    var endDateTime=document.getElementById('dtpk_Search_End').value
    // Kiểm tra thông tin không rỗng
    if (startDateTime == ""|| endDateTime == "") {
        alert("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    var val = [startDateTime,endDateTime ];
    socket.emit('msg_SQL_ByTime', val);
}

//Hiển thị khi có kết quả
socket.on('SQL_ByTime', function(data){
    fn_table_01(data); // Show sdata
});

// Hiển thị dữ liệu ra bảng
function fn_table_01(data){
    if(data){
        $("#table_01 tbody").empty();
        var len = data.length;
        var txt = "<tbody>";
        if(len > 0){
            for(var i=0;i<len;i++){
                    txt += "<tr><td>"+data[i].plate_number
                        +"</td><td>"+data[i].time_in_formatted
                        +"</td><td>"+data[i].time_out_formatted
                        +"</td><td>"+data[i].cost
                        +"</td></tr>";
                    }
            if(txt != ""){
            txt +="</tbody>";
            $("#table_01").append(txt);
            }
        }
    }
}

// Hàm chức năng xuất dữ liệu Excel
function fn_excel(){
    var linktext = "";
    var bookname = "";
    socket.emit("msg_Excel_Report", true);
}

socket.on('send_Excel_Report',function(data){
    linktext = data[0];
    bookname = data[1];
    // Delay save as
    var delayInMilliseconds = 2000; //Delay 2 second
    setTimeout(function() {
        saveAs(linktext, bookname);
    }, delayInMilliseconds);
});