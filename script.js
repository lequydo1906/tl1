

// Cấu hình Firebase của bạn
// Thay thế bằng cấu hình của dự án Firebase của bạn
const firebaseConfig = {
      apiKey: "AIzaSyDR8_kXFXR_oWGNptZX_infNrWTm3xbPAM",
      authDomain: "timeline-43aac.firebaseapp.com",
      projectId: "timeline-43aac",
      storageBucket: "timeline-43aac.firebasestorage.app",
      messagingSenderId: "732658035286",
      appId: "1:732658035286:web:40091d26eee343579aa9f7",
    };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const pixelMoiNgay = Math.floor(window.innerWidth / 14);

function layNgayHienTai() {
  const bayGio = new Date();
  return new Date(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate(), 0, 0, 0, 0);
}
function layNgayBatDauKetThuc() {
  const homNay = layNgayHienTai();
  const ngayBatDau = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() - 7, 0, 0, 0, 0);
  const ngayKetThuc = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() + 6, 0, 0, 0, 0);
  return { ngayBatDau, ngayKetThuc };
}
function demSoNgay(ngayBatDau, ngayKetThuc) {
  return Math.round((ngayKetThuc - ngayBatDau) / (1000 * 60 * 60 * 24)) + 1;
}

const timeline = document.getElementById('timeline');
const khungTimeline = document.getElementById('timeline-container');

function layNgayTheoIndex(idx, ngayBatDau) {
  return new Date(ngayBatDau.getTime() + idx * 24 * 60 * 60 * 1000);
}
function layIndexTuNgay(ngay, ngayBatDau) {
  if (!(ngay instanceof Date)) ngay = new Date(ngay);
  return Math.floor((ngay - ngayBatDau) / (1000 * 60 * 60 * 24));
}
function tinhViTriPixel(ngay, ngayBatDau) {
  if (!(ngay instanceof Date)) ngay = new Date(ngay);
  const chiSoNgay = layIndexTuNgay(ngay, ngayBatDau);
  const gio = ngay.getHours();
  const phut = ngay.getMinutes();
  const giay = ngay.getSeconds();
  let pixel = chiSoNgay * pixelMoiNgay;
  pixel += gio * pixelMoiNgay / 24;
  pixel += phut * pixelMoiNgay / 24 / 60;
  pixel += giay * pixelMoiNgay / 24 / 3600;
  return pixel;
}

// new helpers: lấy ranh giới ngày (bắt đầu của ngày)
function layDauNgay(ngay) {
  const dt = (ngay instanceof Date) ? ngay : new Date(ngay);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0);
}

function tinhThoiGianConLai(thoiDiemKetThuc) {
  const bayGio = new Date();
  const ketThuc = new Date(thoiDiemKetThuc);
  let khoangCach = ketThuc - bayGio;
  if (khoangCach <= 0) return "Đã kết thúc";
  let gio = Math.floor(khoangCach / (1000 * 60 * 60));
  let phut = Math.floor((khoangCach % (1000 * 60 * 60)) / (1000 * 60));
  let giay = Math.floor((khoangCach % (1000 * 60)) / 1000);
  return `Còn lại ${gio}h ${phut}m ${giay}s`;
}
function dinhDangGio24h(ngay) {
  return ngay.getHours().toString().padStart(2, '0')
    + ':' + ngay.getMinutes().toString().padStart(2, '0')
    + ':' + ngay.getSeconds().toString().padStart(2, '0');
}
function cuonDenGioHienTai(ngayBatDau) {
  const bayGio = new Date();
  const viTriTrai = tinhViTriPixel(bayGio, ngayBatDau);
  khungTimeline.scrollLeft = viTriTrai - khungTimeline.clientWidth / 2 + pixelMoiNgay;
}

// Thêm helper để format giá trị datetime-local từ ISO
function toInputDatetimeLocal(iso) {
	return new Date(iso).toISOString().slice(0,16);
}

function renderTimeline(events) {
  const { ngayBatDau, ngayKetThuc } = layNgayBatDauKetThuc();
  const soNgay = demSoNgay(ngayBatDau, ngayKetThuc);
  timeline.innerHTML = "";
  timeline.style.width = (soNgay * pixelMoiNgay) + "px";

  // Đường kẻ dọc + số ngày nằm trên đầu đường kẻ
  for (let i = 0; i < soNgay; i++) {
    const ngay = layNgayTheoIndex(i, ngayBatDau);

    // Đường kẻ dọc ngày tại đúng vị trí 0h
    const line = document.createElement('div');
    line.className = "timeline-day-line";
    line.style.position = "absolute";
    line.style.left = (i * pixelMoiNgay) + "px";
    line.style.top = "40px";
    line.style.height = "460px";
    line.style.width = "1px";
    timeline.appendChild(line);

    // Số ngày nằm trên đầu đường kẻ
    const num = document.createElement('div');
    num.className = "date-col";
    num.style.position = 'absolute';
    num.style.left = (i * pixelMoiNgay - 15) + 'px'; // Canh giữa số với đường kẻ
    num.style.top = "0px";
    num.innerText = ngay.getDate();
    timeline.appendChild(num);
  }

  // Đường chỉ thời gian hiện tại (24h format)
  function renderCurrentTimeBar() {
    const bayGio = new Date();
    const viTriTrai = tinhViTriPixel(bayGio, ngayBatDau);
    let dongThoiGianHienTai = timeline.querySelector('.current-time-row');
    if (!dongThoiGianHienTai) {
      dongThoiGianHienTai = document.createElement('div');
      dongThoiGianHienTai.className = "current-time-row";
      timeline.appendChild(dongThoiGianHienTai);
    }
    dongThoiGianHienTai.style.left = viTriTrai + "px";
    dongThoiGianHienTai.style.top = "40px";
    dongThoiGianHienTai.style.width = "2px";
    dongThoiGianHienTai.style.height = "460px";
    dongThoiGianHienTai.innerHTML = `<div class="current-time-line"></div>
      <div class="current-time-label" style="top:-32px;left:-40px;">${dinhDangGio24h(bayGio)}</div>`;
    cuonDenGioHienTai(ngayBatDau);
  }
  renderCurrentTimeBar();
  if (window.__timelineTimer) clearInterval(window.__timelineTimer);
  window.__timelineTimer = setInterval(renderCurrentTimeBar, 1000);

  // Event-bar
  timeline.querySelectorAll(".event-bar").forEach(e => e.remove());
  document.querySelectorAll('.event-tooltip').forEach(el => el.remove());
  events.forEach((ev, idx) => {
    // Chuyển đổi thời gian bắt đầu và kết thúc thành Date
    const thoiGianBatDau = ev.startTime ? new Date(ev.startTime) : new Date(ev.start);
    const thoiGianKetThuc = ev.endTime ? new Date(ev.endTime) : new Date(ev.end || ev.start);

    // 1. Tính chỉ số ngày và vị trí đường kẻ dọc cho cả điểm bắt đầu và kết thúc
    const chiSoNgayKetThuc = layIndexTuNgay(thoiGianKetThuc, ngayBatDau);
    const chiSoNgayBatDau = layIndexTuNgay(thoiGianBatDau, ngayBatDau);
    
    // 2. Lấy vị trí đường kẻ dọc của ngày hiện tại và ngày tiếp theo của điểm kết thúc
    const viTriKeDauNgay = Math.floor(chiSoNgayKetThuc) * pixelMoiNgay;
    const viTriKeCuoiNgay = (Math.floor(chiSoNgayKetThuc) + 1) * pixelMoiNgay;
    
    // 3. Tính tỷ lệ thời gian trong ngày (từ 0h đến 24h)
    const tyLeGioKetThuc = (
      thoiGianKetThuc.getHours() + 
      thoiGianKetThuc.getMinutes()/60 + 
      thoiGianKetThuc.getSeconds()/3600
    ) / 24;
    
    // 4. Nội suy tuyến tính giữa hai đường kẻ dọc
    const viTriKetThuc = viTriKeDauNgay + (viTriKeCuoiNgay - viTriKeDauNgay) * tyLeGioKetThuc;
    
    // 5. Tương tự cho điểm bắt đầu
    const viTriKeDauNgayBatDau = Math.floor(chiSoNgayBatDau) * pixelMoiNgay;
    const viTriKeCuoiNgayBatDau = (Math.floor(chiSoNgayBatDau) + 1) * pixelMoiNgay;
    const tyLeGioBatDau = (
      thoiGianBatDau.getHours() + 
      thoiGianBatDau.getMinutes()/60 + 
      thoiGianBatDau.getSeconds()/3600
    ) / 24;
    const viTriBatDau = viTriKeDauNgayBatDau + (viTriKeCuoiNgayBatDau - viTriKeDauNgayBatDau) * tyLeGioBatDau;
    
    // Đảm bảo vị trí nằm trong phạm vi timeline
    const viTriTrai = Math.max(0, Math.min(viTriBatDau, soNgay * pixelMoiNgay));
    const viTriPhai = Math.max(0, Math.min(viTriKetThuc, soNgay * pixelMoiNgay));
    
    // Chiều rộng chính xác theo thời gian thực, tối thiểu 4px
    const chieuRong = Math.max(viTriPhai - viTriTrai, 4);

    // Debug: Thêm thông tin để kiểm tra
    console.log('Thông tin event:', {
      ten: ev.name,
      thoiGianKetThuc: thoiGianKetThuc.toLocaleString(),
      chiSoNgayKetThuc,
      phanTramThoiGianTrongNgay,
      viTriKeDoc,
      viTriKetThuc,
      viTriPhai,
      chieuRong
    });


    const thanh = document.createElement('div');
    thanh.className = `event-bar ${ev.color || ""}`;
    thanh.style.left = viTriTrai + "px";
    thanh.style.top = (60 + idx * 44) + "px";
    thanh.style.width = chieuRong + "px";
    thanh.style.height = "36px";

    // Nội dung: tên + thời gian (ẩn mặc định) + nút sửa/xóa (ẩn mặc định, hiện khi hover)
    thanh.innerHTML = `<div class="event-title">${ev.name}</div>
      <span class="time-info" style="margin-left:8px;font-size:0.9em;">
        ${thoiGianBatDau.getDate()}/${thoiGianBatDau.getMonth()+1} ${dinhDangGio24h(thoiGianBatDau)}
        - ${thoiGianKetThuc.getDate()}/${thoiGianKetThuc.getMonth()+1} ${dinhDangGio24h(thoiGianKetThuc)}
      </span>
      <button class="edit-btn" title="Sửa" onclick="(function(ev){ return function(e){ e.stopPropagation(); startEditEvent(ev); }})(JSON.parse('${JSON.stringify({ id: ev.id, name: ev.name, color: ev.color, startTime: ev.startTime || ev.start, endTime: ev.endTime || ev.end })}'))(event)">Sửa</button>
      <button class="delete-btn" onclick="(function(id){ return function(e){ e.stopPropagation(); if(confirm('Xóa sự kiện?')) deleteEvent(id); }} )('${ev.id}')(event)">Xóa</button>`;

    // Tooltip
    const nutGiup = document.createElement('div');
    nutGiup.className = "event-tooltip";
    nutGiup.style.display = "none";
    document.body.appendChild(nutGiup);

    thanh.onmousemove = function(e) {
      nutGiup.innerText = tinhThoiGianConLai(thoiGianKetThuc);
      nutGiup.style.left = (e.pageX + 12) + "px";
      nutGiup.style.top = (e.pageY - 10) + "px";
      nutGiup.style.display = "block";
    };
    thanh.onmouseleave = function() {
      nutGiup.style.display = "none";
    };

    timeline.appendChild(thanh);
  });
}

// Firestore realtime
db.collection("events").onSnapshot(snap => {
  const events = [];
  const now = new Date();
  snap.forEach(doc => {
    const data = { id: doc.id, ...doc.data() };
    const endTime = data.endTime || data.end || data.start;
    if (endTime) {
      const end = new Date(endTime);
      // Nếu đã kết thúc >24h thì xóa tự động
      if (now - end > 24 * 60 * 60 * 1000) {
        doc.ref.delete().catch(()=>{});
        return; // skip pushing this event
      }
    }
    events.push(data);
  });
  // Sắp xếp theo thời gian còn lại (nhỏ -> lớn)
  events.sort((a,b) => {
    const na = new Date(a.endTime || a.end || a.start) - new Date();
    const nb = new Date(b.endTime || b.end || b.start) - new Date();
    return na - nb;
  });
  renderTimeline(events);
});

// Thêm hỗ trợ sửa/cancel cho form
const editIdInput = document.createElement('input');
editIdInput.type = 'hidden';
editIdInput.id = 'editId';
document.getElementById('eventForm').appendChild(editIdInput);

const cancelBtn = document.createElement('button');
cancelBtn.type = 'button';
cancelBtn.id = 'cancelEdit';
cancelBtn.style.display = 'none';
cancelBtn.textContent = 'Hủy';
document.getElementById('eventForm').appendChild(cancelBtn);

cancelBtn.onclick = () => {
  document.getElementById('eventForm').reset();
  editIdInput.value = '';
  cancelBtn.style.display = 'none';
  document.querySelector('#eventForm button[type="submit"]').textContent = 'Thêm sự kiện';
};

// Thêm helper để set form từ event khi edit
function startEditEvent(ev) {
  document.getElementById('name').value = ev.name || '';
  document.getElementById('color').value = ev.color || 'red';
  if (ev.startTime || ev.start) document.getElementById('startTime').value = toInputDatetimeLocal(ev.startTime || ev.start);
  if (ev.endTime || ev.end) document.getElementById('endTime').value = toInputDatetimeLocal(ev.endTime || ev.end);
  editIdInput.value = ev.id;
  document.querySelector('#eventForm button[type="submit"]').textContent = 'Lưu thay đổi';
  cancelBtn.style.display = 'inline-block';
}

// Thêm event
document.getElementById('eventForm').onsubmit = function(e) {
  e.preventDefault();
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  const data = {
    name: document.getElementById('name').value,
    color: document.getElementById('color').value,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    duration
  };

  const editId = document.getElementById('editId').value;
  if (editId) {
    db.collection("events").doc(editId).update(data).then(() => {
      document.getElementById('eventForm').reset();
      document.getElementById('editId').value = '';
      document.querySelector('#eventForm button[type="submit"]').textContent = 'Thêm sự kiện';
      cancelBtn.style.display = 'none';
    });
  } else {
    db.collection("events").add(data).then(() => {
      document.getElementById('eventForm').reset();
    });
  }
};

// Xóa event
function deleteEvent(id) {
  db.collection("events").doc(id).delete();
}
// Xóa event
function deleteEvent(id) {
  db.collection("events").doc(id).delete();
}
