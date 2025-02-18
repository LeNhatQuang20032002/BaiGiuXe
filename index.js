// /////////////////////////++THIẾT LẬP KẾT NỐI WEB++/////////////////////////
const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const session = require('express-session');
const crypto = require('crypto');


// Cấu hình body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Cấu hình EJS
app.set("view engine", "ejs");
app.set("views", "./views");

// Cấu hình thư mục public cho các tệp tĩnh
app.use(express.static("public"));

// Tạo secret key ngẫu nhiên
const secretKey = crypto.randomBytes(32).toString('hex');

// Cấu hình session
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Để dùng cookie với http (không phải https)
}));

// Cấu hình server và socket
var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(3000);

// Tạo kết nối đến MySQL
const sqlcon = mysql.createConnection({
    host: 'localhost',  // Thay 'localhost' bằng địa chỉ máy chủ MySQL của bạn nếu cần
    user: 'root',       // Thay 'root' bằng tên người dùng MySQL của bạn
    password: '123456', // Thay 'password' bằng mật khẩu của bạn
    database: 'data_bienso'  // Thay 'data_bienso' bằng tên cơ sở dữ liệu của bạn
});

sqlcon.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối: ' + err.stack);
        return;
    }
    console.log('Đã kết nối với id ' + sqlcon.threadId);
});

// Tạo bảng user nếu chưa có
function fn_create_user_table_if_not_exists(){
    // Tạo bảng user
    const createUserTable = `
    CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(50) NOT NULL,
        email VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `;

    sqlcon.query(createUserTable, (err, results, fields) => {
        if (err) {
            console.error('Lỗi khi tạo bảng: ' + err.stack);
            return;
        }
        console.log('Bảng user đã được tạo thành công!');
    });
}

fn_create_user_table_if_not_exists();

// Tạo tài khoản admin nếu chưa có
function createAdminUser() {
    const query = 'INSERT IGNORE INTO user (username, password, email) VALUES (?, ?, ?)';
    const adminData = ['admin', '123456', 'lenquang1808@gmail.com'];
    sqlcon.query(query, adminData, (err, results) => {
        if (err) {
        console.error('Lỗi khi tạo admin user: ' + err.stack);
        return;
        }
        console.log('Admin user đã được tạo hoặc đã tồn tại.');
    });
};
    
createAdminUser();

// Tạo bảng lien_he nếu chưa có
function fn_create_lien_he_if_not_exists(){
    // Tạo bảng lien_he
    const createLienHeTable = `
    CREATE TABLE IF NOT EXISTS lien_he (
        email VARCHAR(50) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `;

    sqlcon.query(createLienHeTable, (err, results, fields) => {
        if (err) {
            console.error('Lỗi khi tạo bảng: ' + err.stack);
            return;
        }
        console.log('Bảng lien_he đã được tạo thành công!');
    });
}

fn_create_lien_he_if_not_exists();

// Route để hiển thị trang home
app.get('/', (req, res) => {
    res.render('home', { username: req.session.username, isLoggedIn: req.session.isLoggedIn, isAdmin: req.session.isAdmin });
});

// Route để xử lý đăng nhập
app.post('/', (req, res) => {
    const { username, password } = req.body;
  
    const query = 'SELECT * FROM user WHERE username = ? AND password = ?';
    sqlcon.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Lỗi khi truy vấn: ' + err.stack);
            res.status(500).send('Đã xảy ra lỗi');
            return;
        }
    
        if (results.length > 0) {
            req.session.username = username;
            req.session.isLoggedIn = true;
            req.session.isAdmin = (username=='admin');
            res.redirect('/');
        } else {
            res.send('Tên người dùng hoặc mật khẩu không đúng.');
        }
    });
});
  

// Route để xử lý đăng xuất
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

//API để lấy thông tin vị trí trống
app.get('/api/packing-spots', (req, res) => {
    const parkingSpots=[
        { id:1, isAvailable: !obj_tag_value['VT_1']},
        { id:2, isAvailable: !obj_tag_value['VT_2']},
        { id:3, isAvailable: !obj_tag_value['VT_3']},
        { id:4, isAvailable: !obj_tag_value['VT_4']},
        { id:5, isAvailable: !obj_tag_value['VT_5']},
        { id:6, isAvailable: !obj_tag_value['VT_6']},
        { id:7, isAvailable: !obj_tag_value['VT_7']},
        { id:8, isAvailable: !obj_tag_value['VT_8']}
    ];
    res.json(parkingSpots);
});



//IO SOCKET==================================================
io.on('connection', (socket) => {
    console.log('A user connected');

    // Lắng nghe sự kiện khi có thông tin liên hệ được gửi từ client
    socket.on('gui_lien_he', (data) => {
        const { email, name } = data;
        
        // Lưu thông tin vào cơ sở dữ liệu
        const sql = 'INSERT IGNORE INTO lien_he (email) VALUES (?)';
        sqlcon.query(sql, [email], (err, result) => {
            if (err) {
                console.error(err);
                socket.emit('luu_lien_he_that_bai', 'Đã xảy ra lỗi khi lưu thông tin liên hệ.');
            } else {
                console.log('Thông tin liên hệ đã được lưu.');
                socket.emit('luu_lien_he_thanh_cong', 'Thông tin liên hệ đã được gửi thành công.');
            }
        });
    });
});

// Mảng xuất dữ liệu Excel
var SQL_Excel = [];  // Dữ liệu Excel
// Tìm kiếm dữ liệu SQL theo khoảng thời gian
io.on("connection", function(socket){
    socket.on("msg_SQL_ByTime", function(data)
    {
        var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset time Việt Nam (GMT7+)
        // Lấy thời gian tìm kiếm từ date time piker
        var timeS = new Date(data[0]); // Thời gian bắt đầu
        var timeE = new Date(data[1]); // Thời gian kết thúc
        // Quy đổi thời gian ra định dạng cua MySQL
        var timeS1 = "'" + (new Date(timeS - tzoffset)).toISOString().slice(0, -1).replace("T"," ") + "'";
        var timeE1 = "'" + (new Date(timeE - tzoffset)).toISOString().slice(0, -1).replace("T"," ") + "'";
        var timeR = timeS1 + "AND" + timeE1; // Khoảng thời gian tìm kiếm (Time Range)

        var sqltable_Name = "number_plate_records"; // Tên bảng
        var dt_col_Name = "time_in";  // Tên cột thời gian

        var Query1 = "SELECT *, DATE_FORMAT(time_in, '%Y-%m-%d %H:%i:%s') AS time_in_formatted, DATE_FORMAT(time_out, '%Y-%m-%d %H:%i:%s') AS time_out_formatted FROM " + sqltable_Name + " WHERE "+ dt_col_Name + " BETWEEN ";
        var Query = Query1 + timeR + ";";

        sqlcon.query(Query, function(err, results, fields) {
            if (err) {
                console.log(err);
            } else {
                const objectifyRawPacket = row => ({...row});
                const convertedResponse = results.map(objectifyRawPacket);
                SQL_Excel = convertedResponse; // Lưu cho Xuất báo cáo Excel
                socket.emit('SQL_ByTime', convertedResponse);
            }
        });
    });
});

// =====================TRUYỀN NHẬN DỮ LIỆU VỚI TRÌNH DUYỆT=====================
// Truyền nhận dữ liệu với trình duyệt
io.on("connection", function(socket){
    socket.on("msg_Excel_Report", function(data)
    {
        const [SaveAslink1, Bookname] = fn_excelExport();
        var data = [SaveAslink1, Bookname];
        socket.emit('send_Excel_Report', data);
    });
});

// /////////////////////////////// BÁO CÁO EXCEL ///////////////////////////////
const Excel = require('exceljs');
const { CONNREFUSED } = require('dns');
function fn_excelExport(){
    // =====================CÁC THUỘC TÍNH CHUNG=====================
        // Lấy ngày tháng hiện tại
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        let day = date_ob.getDay();
        var dayName = '';
        if(day == 0){dayName = 'Chủ nhật,'}
        else if(day == 1){dayName = 'Thứ hai,'}
        else if(day == 2){dayName = 'Thứ ba,'}
        else if(day == 3){dayName = 'Thứ tư,'}
        else if(day == 4){dayName = 'Thứ năm,'}
        else if(day == 5){dayName = 'Thứ sáu,'}
        else if(day == 6){dayName = 'Thứ bảy,'}
        else{};
    // Tạo và khai báo Excel
    let workbook = new Excel.Workbook()
    let worksheet =  workbook.addWorksheet('Báo cáo', {
      pageSetup:{paperSize: 9, orientation:'portrait'},
      properties:{tabColor:{argb:'FFC0000'}},
    });
    // Page setup (cài đặt trang)
    worksheet.properties.defaultRowHeight = 20;
    worksheet.pageSetup.margins = {
      left: 0.3, right: 0.25,
      top: 0.75, bottom: 0.75,
      header: 0.3, footer: 0.3
    };
    // =====================THẾT KẾ HEADER=====================
    // Logo công ty
    const imageId1 = workbook.addImage({
        filename: 'public/images/Logo.png',
        extension: 'png',
      });
    worksheet.addImage(imageId1, 'A1:A3');
    // Thông tin công ty
    worksheet.getCell('B1').value = 'Bãi giữ xe ô tô ở Thành Phố Thủ Đức';
    worksheet.getCell('B1').style = { font:{bold: true,size: 14},alignment: {vertical: 'middle'}} ;
    worksheet.getCell('B2').value = 'Địa chỉ: Phường Trường Thọ, Quận Thủ Đức';
    worksheet.getCell('B3').value = 'Hotline: 0347978096. Email: lenquang1808@gmail.com';
    // Tên báo cáo
    worksheet.getCell('A5').value = 'BÁO CÁO XE VÀO RA';
    worksheet.mergeCells('A5:F5');
    worksheet.getCell('A5').style = { font:{name: 'Times New Roman', bold: true,size: 16},alignment: {horizontal:'center',vertical: 'middle'}} ;
    // Ngày in biểu
    worksheet.getCell('F6').value = "Ngày in biểu: " + dayName + date + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
    worksheet.getCell('F6').style = { font:{bold: false, italic: true},alignment: {horizontal:'right',vertical: 'bottom',wrapText: false}} ;

    // Tên nhãn các cột
    var rowpos = 7;
    var collumName = ["STT","Biển số", "Thời gian vào", "Thời gian ra", "Chi phí (VNĐ)", "Ghi chú"]
    worksheet.spliceRows(rowpos, 1, collumName);

    // =====================XUẤT DỮ LIỆU EXCEL SQL=====================
    // Dump all the data into Excel
    var rowIndex = 0;
    SQL_Excel.forEach((e, index) => {
    // row 1 is the header.
    rowIndex =  index + rowpos;
    // worksheet1 collum
    worksheet.columns = [
          {key: 'STT'},
          {key: 'plate_number'},
          {key: 'time_in_formatted'},
          {key: 'time_out_formatted'},
          {key: 'cost'},
        ]
    worksheet.addRow({
          STT: {
            formula: index + 1
          },
          ...e
        })
    })
    // Lấy tổng số hàng
    const totalNumberOfRows = worksheet.rowCount;
    // Tính tổng
    if(totalNumberOfRows>8){
        worksheet.addRow([
            'Tổng cộng:',
            '',
            '',
            '',
            {formula: `=sum(E${rowpos + 1}:E${totalNumberOfRows})`},
        ])
    }else{
        
    }
    // Style cho hàng total (Tổng cộng)
    worksheet.getCell(`A${totalNumberOfRows+1}`).style = { font:{bold: true,size: 12},alignment: {horizontal:'center',}} ;
    // Tô màu cho hàng total (Tổng cộng)
    const total_row = ['A','B', 'C', 'D', 'E','F']
    total_row.forEach((v) => {
        worksheet.getCell(`${v}${totalNumberOfRows+1}`).fill = {type: 'pattern',pattern:'solid',fgColor:{ argb:'f2ff00' }}
})

    // =====================STYLE CHO CÁC CỘT/HÀNG=====================
    // Style các cột nhãn
    const HeaderStyle = ['A','B', 'C', 'D', 'E','F']
    HeaderStyle.forEach((v) => {
        worksheet.getCell(`${v}${rowpos}`).style = { font:{bold: true},alignment: {horizontal:'center',vertical: 'middle',wrapText: true}} ;
        worksheet.getCell(`${v}${rowpos}`).border = {
          top: {style:'thin'},
          left: {style:'thin'},
          bottom: {style:'thin'},
          right: {style:'thin'}
        }
    })
    // Cài đặt độ rộng cột
    worksheet.columns.forEach((column, index) => {
        column.width = 15;
    })
    // Set width header
    worksheet.getColumn(1).width = 12;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 18;
    worksheet.getColumn(4).width = 18;

    // ++++++++++++Style cho các hàng dữ liệu++++++++++++
    worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
      var datastartrow = rowpos;
      var rowindex = rowNumber + datastartrow;
      const rowlength = datastartrow + SQL_Excel.length
      if(rowindex >= rowlength+1){rowindex = rowlength+1}
      const insideColumns = ['A','B', 'C', 'D', 'E','F']
    // Tạo border
      insideColumns.forEach((v) => {
          // Border
        worksheet.getCell(`${v}${rowindex}`).border = {
          top: {style: 'thin'},
          bottom: {style: 'thin'},
          left: {style: 'thin'},
          right: {style: 'thin'}
        },
        // Alignment
        worksheet.getCell(`${v}${rowindex}`).alignment = {horizontal:'center',vertical: 'middle',wrapText: true}
      })
    })


    // =====================THẾT KẾ FOOTER=====================
    worksheet.getCell(`F${totalNumberOfRows+2}`).value = 'Ngày …………tháng ……………năm 20………';
    worksheet.getCell(`F${totalNumberOfRows+2}`).style = { font:{bold: true, italic: false},alignment: {horizontal:'right',vertical: 'middle',wrapText: false}} ;

    worksheet.getCell(`B${totalNumberOfRows+3}`).value = 'Giám đốc';
    worksheet.getCell(`B${totalNumberOfRows+4}`).value = '(Ký, ghi rõ họ tên)';
    worksheet.getCell(`B${totalNumberOfRows+3}`).style = { font:{bold: true, italic: false},alignment: {horizontal:'center',vertical: 'bottom',wrapText: false}} ;
    worksheet.getCell(`B${totalNumberOfRows+4}`).style = { font:{bold: false, italic: true},alignment: {horizontal:'center',vertical: 'top',wrapText: false}} ;

    worksheet.getCell(`D${totalNumberOfRows+3}`).value = 'Trưởng ca';
    worksheet.getCell(`D${totalNumberOfRows+4}`).value = '(Ký, ghi rõ họ tên)';
    worksheet.getCell(`D${totalNumberOfRows+3}`).style = { font:{bold: true, italic: false},alignment: {horizontal:'center',vertical: 'bottom',wrapText: false}} ;
    worksheet.getCell(`D${totalNumberOfRows+4}`).style = { font:{bold: false, italic: true},alignment: {horizontal:'center',vertical: 'top',wrapText: false}} ;

    worksheet.getCell(`F${totalNumberOfRows+3}`).value = 'Người in biểu';
    worksheet.getCell(`F${totalNumberOfRows+4}`).value = '(Ký, ghi rõ họ tên)';
    worksheet.getCell(`F${totalNumberOfRows+3}`).style = { font:{bold: true, italic: false},alignment: {horizontal:'center',vertical: 'bottom',wrapText: false}} ;
    worksheet.getCell(`F${totalNumberOfRows+4}`).style = { font:{bold: false, italic: true},alignment: {horizontal:'center',vertical: 'top',wrapText: false}} ;

    // =====================THỰC HIỆN XUẤT DỮ LIỆU EXCEL=====================
    // Export Link
    var currentTime = year + "_" + month + "_" + date + "_" + hours + "h" + minutes + "m" + seconds + "s";
    var saveasDirect = "Report/Report_" + currentTime + ".xlsx";
    SaveAslink = saveasDirect; // Send to client
    var booknameLink = "public/" + saveasDirect;

    var Bookname = "Report_" + currentTime + ".xlsx";
    // Write book name
    workbook.xlsx.writeFile(booknameLink)

    // Return
    return [SaveAslink, Bookname]
} // Đóng fn_excelExport


// /////////////////////////////// PLC /////////////////////////////////////
// KHỞI TẠO KẾT NỐI PLC
var nodes7 = require('nodes7');
var conn_plc = new nodes7; //PLC1
// Tạo địa chỉ kết nối (slot = 2 nếu là 300/400, slot = 1 nếu là 1200/1500)
conn_plc.initiateConnection({port: 102, host: '192.168.1.41', rack: 0, slot: 1}, PLC_connected);

// Bảng tag trong Visual studio code
var tags_list = {
    //Static
    vt1: 'M500.2',     //0
    vt2: 'M500.3',     //1
    vt3: 'M500.4',     //2
    vt4: 'M500.5',     //3
    vt5: 'M500.6',     //4
    vt6: 'M500.7',     //5
    vt7: 'M501.0',     //6
    vt8: 'M501.1'     //7
};
    
// GỬI DỮ LIỆu TAG CHO PLC
function PLC_connected(err) {
    if (typeof(err) !== "undefined") {
        console.log(err); // Hiển thị lỗi nếu không kết nối đƯỢc với PLC
    }
    conn_plc.setTranslationCB(function(tag) {return tags_list[tag];});  // Đưa giá trị đọc lên từ PLC và mảng
    conn_plc.addItems([
        //Static
        'vt1',     //0
        'vt2',     //1
        'vt3',     //2
        'vt4',     //3
        'vt5',     //4
        'vt6',     //5
        'vt7',     //6
        'vt8'     //7
       
    ]); 
}
// Đọc dữ liệu từ PLC và đưa vào array tags
var obj_tag_value = {}; // Tạo một list lưu giá trị tag đọc về
function valuesReady(anythingBad, values) {
    if (anythingBad) { console.log("Lỗi khi đọc dữ liệu tag"); } // Cảnh báo lỗi
    obj_tag_value=values;
    console.log(values); // Hiển thị giá trị để kiểm tra
}
// Hàm chức năng scan giá trị
function fn_read_data_scan(){
    conn_plc.readAllItems(valuesReady);
}
// Time cập nhật mỗi 1s
setInterval(
    () => fn_read_data_scan(),
    1000 // 1s = 1000ms
);

// ///////////LẬP BẢNG TAG ĐỂ GỬI QUA CLIENT (TRÌNH DUYỆT)///////////
function fn_tag(socket) {
    socket.emit('vt1',obj_tag_value['vt1']);
    socket.emit('vt2',obj_tag_value['vt2']);
    socket.emit('vt3',obj_tag_value['vt3']);
    socket.emit('vt4',obj_tag_value['vt4']);
    socket.emit('vt5',obj_tag_value['vt5']);
    socket.emit('vt6',obj_tag_value['vt6']);
    socket.emit('vt7',obj_tag_value['vt7']);
    socket.emit('vt8',obj_tag_value['vt8']);
}
    
// ///////////GỬI DỮ LIỆU BẢNG TAG ĐẾN CLIENT (TRÌNH DUYỆT)///////////
io.on("connection", function(socket){
    socket.on("Client-send-data", function(data){
    fn_tag(socket);
});});



