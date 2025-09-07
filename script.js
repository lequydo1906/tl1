

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

// Thêm tính năng resize
let isResizing = false;
let startX, startY, startWidth, startHeight;

const resizeHandle = document.createElement('div');
resizeHandle.id = 'resize-handle';
resizeHandle.style.cssText = `
  position: absolute;
  bottom: 0;
  right: 0;
  width: 15px;
  height: 15px;
  cursor: nw-resize;
  z-index: 1000;
`;

khungTimeline.appendChild(resizeHandle);

resizeHandle.addEventListener('mousedown', initResize);

function initResize(e) {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = khungTimeline.offsetWidth;
    startHeight = khungTimeline.offsetHeight;

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
    
    e.preventDefault(); // Ngăn chọn text khi resize
}

function resize(e) {
    if (!isResizing) return;

    // Tính toán kích thước mới
    const newWidth = startWidth + (e.clientX - startX);
    const newHeight = startHeight + (e.clientY - startY);

    // Cập nhật kích thước, có giới hạn min/max từ CSS
    khungTimeline.style.width = newWidth + 'px';
    khungTimeline.style.height = newHeight + 'px';
    
    // Cập nhật pixelMoiNgay dựa trên kích thước mới
    updatePixelMoiNgay();
    
    // Render lại timeline
    renderTimeline(window._lastEvents || []);
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}

function updatePixelMoiNgay() {
    // Cập nhật pixelMoiNgay dựa trên kích thước mới của container
    pixelMoiNgay = Math.floor(khungTimeline.clientWidth / 14);
}

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
  
  if (khoangCach <= 0) {
    // Tính thời gian đã kết thúc
    khoangCach = Math.abs(khoangCach);
    const ngay = Math.floor(khoangCach / (1000 * 60 * 60 * 24));
    const gio = Math.floor((khoangCach % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const phut = Math.floor((khoangCach % (1000 * 60 * 60)) / (1000 * 60));
    
    if (ngay > 0) {
      return `Đã kết thúc ${ngay} ngày trước`;
    } else if (gio > 0) {
      return `Đã kết thúc ${gio} giờ trước`;
    } else if (phut > 0) {
      return `Đã kết thúc ${phut} phút trước`;
    } else {
      return "Vừa kết thúc";
    }
  }
  
  // Tính thời gian còn lại
  const ngay = Math.floor(khoangCach / (1000 * 60 * 60 * 24));
  const gio = Math.floor((khoangCach % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const phut = Math.floor((khoangCach % (1000 * 60 * 60)) / (1000 * 60));
  const giay = Math.floor((khoangCach % (1000 * 60)) / 1000);
  
  if (ngay > 0) {
    return `Còn lại ${ngay} ngày ${gio}h`;
  }
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
    const duongKe = document.createElement('div');
    duongKe.className = "timeline-day-line";
    duongKe.style.position = "absolute";
    duongKe.style.left = (i * pixelMoiNgay) + "px";
    duongKe.style.top = "40px";
    duongKe.style.height = "460px";
    duongKe.style.width = "1px";
    timeline.appendChild(duongKe);

    // Số ngày nằm trên đầu đường kẻ
    const soNgayHienThi = document.createElement('div');
    soNgayHienThi.className = "date-col";
    soNgayHienThi.style.position = 'absolute';
    soNgayHienThi.style.left = (i * pixelMoiNgay - 15) + 'px'; // Canh giữa số với đường kẻ
    soNgayHienThi.style.top = "0px";
    soNgayHienThi.innerText = ngay.getDate();
    timeline.appendChild(soNgayHienThi);
  }

  // Đường chỉ thời gian hiện tại (24h format)
  function hienThiDongThoiGianHienTai() {
    const bayGio = new Date();
    const viTriTrai = tinhViTriPixel(bayGio, ngayBatDau);
    let dongThoiGian = timeline.querySelector('.current-time-row');
    if (!dongThoiGian) {
      dongThoiGian = document.createElement('div');
      dongThoiGian.className = "current-time-row";
      timeline.appendChild(dongThoiGian);
    }
    dongThoiGian.style.left = viTriTrai + "px";
    dongThoiGian.style.top = "40px";
    dongThoiGian.style.width = "2px";
    dongThoiGian.style.height = "460px";
    dongThoiGian.innerHTML = `<div class="current-time-line"></div>
      <div class="current-time-label" style="top:-32px;left:-40px;">${dinhDangGio24h(bayGio)}</div>`;
    cuonDenGioHienTai(ngayBatDau);
  }
  hienThiDongThoiGianHienTai();
  if (window.__timelineTimer) clearInterval(window.__timelineTimer);
  window.__timelineTimer = setInterval(hienThiDongThoiGianHienTai, 1000);

  // Event-bar
  timeline.querySelectorAll(".event-bar").forEach(e => e.remove());
  document.querySelectorAll('.event-tooltip').forEach(el => el.remove());
  events.forEach((ev, idx) => {

    // Chuyển đổi thời gian bắt đầu và kết thúc thành Date
    const thoiGianBatDau = ev.startTime ? new Date(ev.startTime) : new Date(ev.start);
    const thoiGianKetThuc = ev.endTime ? new Date(ev.endTime) : new Date(ev.end || ev.start);

    // Tính vị trí phần trăm timeline
    const chiSoNgayBatDau = layIndexTuNgay(thoiGianBatDau, ngayBatDau);
    const tyLeGioBatDau = (thoiGianBatDau.getHours() + thoiGianBatDau.getMinutes()/60 + thoiGianBatDau.getSeconds()/3600) / 24;
    const percentBatDau = ((chiSoNgayBatDau + tyLeGioBatDau) / soNgay) * 100;

    const chiSoNgayKetThuc = layIndexTuNgay(thoiGianKetThuc, ngayBatDau);
    const tyLeGioKetThuc = (thoiGianKetThuc.getHours() + thoiGianKetThuc.getMinutes()/60 + thoiGianKetThuc.getSeconds()/3600) / 24;
    const percentKetThuc = ((chiSoNgayKetThuc + tyLeGioKetThuc) / soNgay) * 100;

const leftPercent = Math.max(0, Math.min(percentBatDau, 100));
const rightPercent = Math.max(0, Math.min(percentKetThuc, 100));
const widthPercent = Math.max(rightPercent - leftPercent, (4 / (khungTimeline.clientWidth || window.innerWidth)) * 100);



    // Tính vị trí 0h của ngày bắt đầu và ngày kết thúc
    const viTri0hBatDau = Math.floor(chiSoNgayBatDau) * pixelMoiNgay;
    const viTri0hKetThuc = Math.floor(chiSoNgayKetThuc) * pixelMoiNgay;
    // Vị trí hiện tại (now)
    const bayGio = new Date();
    const viTriHienTai = tinhViTriPixel(bayGio, ngayBatDau);

    // Log tạm thời để debug
    console.log('[DEBUG EVENT]', {
      name: ev.name,
      start: thoiGianBatDau.toLocaleString(),
      end: thoiGianKetThuc.toLocaleString(),
      chiSoNgayBatDau,
      tyLeGioBatDau,
      percentBatDau,
      chiSoNgayKetThuc,
      tyLeGioKetThuc,
      percentKetThuc,
      leftPercent,
      rightPercent,
      widthPercent,
      viTri0hBatDau,
      viTri0hKetThuc,
      viTriHienTai
    });

    const thanh = document.createElement('div');
    thanh.className = `event-bar ${ev.color || ""}`;
    thanh.style.left = leftPercent + "%";
    thanh.style.top = (60 + idx * 44) + "px";
    thanh.style.width = widthPercent + "%";
    thanh.style.height = "36px";

    // Nội dung: tên + thời gian + nút xóa
    thanh.innerHTML = `<div class="event-title">${ev.name}</div>
      <span class="time-info" style="margin-left:8px;font-size:0.9em;">
        ${thoiGianBatDau.getDate()}/${thoiGianBatDau.getMonth()+1} ${dinhDangGio24h(thoiGianBatDau)}
        - ${thoiGianKetThuc.getDate()}/${thoiGianKetThuc.getMonth()+1} ${dinhDangGio24h(thoiGianKetThuc)}
      </span>
      <button class="delete-btn" onclick="(function(id){ return function(e){ e.stopPropagation(); if(confirm('Xóa sự kiện?')) deleteEvent(id); }} )('${ev.id}')(event)">Xóa</button>`;

    // Thêm sự kiện click để mở modal
    thanh.addEventListener('click', function() {
      showEventModal(ev, thoiGianBatDau, thoiGianKetThuc);
    });

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
  // Hàm phân loại trạng thái sự kiện
  function getEventStatus(event) {
    const now = new Date();
    const endTime = new Date(event.endTime || event.end || event.start);
    const timeLeft = endTime - now;
    
    if (timeLeft < 0) {
      // Đã kết thúc
      return {status: 'ended', timeAgo: Math.abs(timeLeft)};
    } else {
      // Chưa kết thúc
      return {status: 'active', timeLeft: timeLeft};
    }
  }

  // Sắp xếp sự kiện theo quy tắc mới
  events.sort((a, b) => {
    const statusA = getEventStatus(a);
    const statusB = getEventStatus(b);
    
    // Nếu cả hai đều đang hoạt động
    if (statusA.status === 'active' && statusB.status === 'active') {
      // Sắp xếp theo thời gian còn lại (ít -> nhiều)
      return statusA.timeLeft - statusB.timeLeft;
    }
    
    // Nếu cả hai đều đã kết thúc
    if (statusA.status === 'ended' && statusB.status === 'ended') {
      // Sắp xếp theo thời gian đã kết thúc (mới kết thúc -> kết thúc lâu)
      return statusA.timeAgo - statusB.timeAgo;
    }
    
    // Sự kiện đang hoạt động luôn ở trên sự kiện đã kết thúc
    return statusA.status === 'active' ? -1 : 1;
  });

  window._lastEvents = events; // Lưu events để dùng khi resize
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
  
  // Xử lý màu sắc
  const colorMap = {
    red: '#d32f2f',
    yellow: '#fbc02d',
    gray: '#757575',
    pink: '#e91e63',
    blue: '#1976d2',
    indigo: '#5c6bc0'
  };
  const eventColor = colorMap[ev.color] || ev.color || '#d32f2f';
  document.getElementById('color').value = eventColor;
  document.getElementById('colorCode').value = eventColor;
  
  // Đảm bảo giữ nguyên giá trị thời gian
  const startTime = ev.startTime || ev.start;
  const endTime = ev.endTime || ev.end;
  
  if (startTime) {
    const startInput = document.getElementById('startTime');
    startInput.value = toInputDatetimeLocal(startTime);
    // Lưu giá trị gốc để kiểm tra thay đổi
    startInput.setAttribute('data-original', startInput.value);
  }
  
  if (endTime) {
    const endInput = document.getElementById('endTime');
    endInput.value = toInputDatetimeLocal(endTime);
    // Lưu giá trị gốc để kiểm tra thay đổi
    endInput.setAttribute('data-original', endInput.value);
  }
  
  editIdInput.value = ev.id;
  document.querySelector('#eventForm button[type="submit"]').textContent = 'Lưu thay đổi';
  cancelBtn.style.display = 'inline-block';
  
  // Thêm kiểm tra khi input thay đổi
  ['startTime', 'endTime'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('change', function() {
      if (!this.value) {
        this.value = this.getAttribute('data-original');
      }
    });
  });
}

// Xử lý color picker trong form thêm sự kiện
const addEventColorPicker = document.getElementById('color');
const addEventColorCode = document.getElementById('colorCode');

addEventColorPicker.addEventListener('input', function(e) {
  addEventColorCode.value = e.target.value.toUpperCase();
});

addEventColorCode.addEventListener('input', function(e) {
  let value = e.target.value;
  if (!value.startsWith('#')) {
    value = '#' + value;
    e.target.value = value;
  }
  if (/^#[0-9A-F]{6}$/i.test(value)) {
    addEventColorPicker.value = value;
  }
});

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
    color: document.getElementById('colorCode').value,
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
      // Reset color picker to default
      addEventColorPicker.value = '#d32f2f';
      addEventColorCode.value = '#d32f2f';
    });
  } else {
    db.collection("events").add(data).then(() => {
      document.getElementById('eventForm').reset();
      // Reset color picker to default
      addEventColorPicker.value = '#d32f2f';
      addEventColorCode.value = '#d32f2f';
    });
  }
};

// Xóa event
function deleteEvent(id) {
  db.collection("events").doc(id).delete();
}

// Modal functions
function showEventModal(ev, thoiGianBatDau, thoiGianKetThuc) {
  const modal = document.getElementById('eventModal');
  const backdrop = document.getElementById('modalBackdrop');
  const title = document.getElementById('modalTitle');
  const details = document.getElementById('modalDetails');
  const timeRemaining = document.getElementById('modalTimeRemaining');
  const form = document.getElementById('modalForm');
  const editBtn = document.getElementById('modalEditBtn');

  // Set content for view mode
  title.textContent = ev.name;
  details.innerHTML = `
    <p><strong>Thời gian bắt đầu:</strong> ${thoiGianBatDau.toLocaleString('vi-VN')}</p>
    <p><strong>Thời gian kết thúc:</strong> ${thoiGianKetThuc.toLocaleString('vi-VN')}</p>
    <p><strong>Thời lượng:</strong> ${ev.duration} ngày</p>
    <p><strong>Màu sắc:</strong> <span style="display:inline-block;width:20px;height:20px;background:${ev.color};vertical-align:middle;border-radius:4px;margin-left:8px;"></span></p>
  `;

    // Set initial form values
  document.getElementById('modalEventId').value = ev.id;
  document.getElementById('modalName').value = ev.name;
  document.getElementById('modalStartTime').value = toInputDatetimeLocal(ev.startTime || ev.start);
  document.getElementById('modalEndTime').value = toInputDatetimeLocal(ev.endTime || ev.end);
  
  // Xử lý color picker
  const colorPicker = document.getElementById('modalColor');
  const colorCode = document.getElementById('modalColorCode');
  
  // Chuyển đổi tên màu thành mã hex nếu cần
  const colorMap = {
    red: '#d32f2f',
    yellow: '#fbc02d',
    gray: '#757575',
    pink: '#e91e63',
    blue: '#1976d2',
    indigo: '#5c6bc0'
  };
  
  const initialColor = colorMap[ev.color] || ev.color || '#d32f2f';
  colorPicker.value = initialColor;
  colorCode.value = initialColor;
  
  // Sync giữa color picker và input text
  colorPicker.addEventListener('input', function(e) {
    colorCode.value = e.target.value.toUpperCase();
  });
  
  colorCode.addEventListener('input', function(e) {
    let value = e.target.value;
    if (!value.startsWith('#')) {
      value = '#' + value;
      e.target.value = value;
    }
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      colorPicker.value = value;
    }
  });  // Update time remaining
  function updateTimeRemaining() {
    timeRemaining.textContent = tinhThoiGianConLai(thoiGianKetThuc);
  }
  updateTimeRemaining();
  const timer = setInterval(updateTimeRemaining, 1000);

  // Show modal
  modal.style.display = 'block';
  backdrop.style.display = 'block';
  details.style.display = 'block';
  form.classList.remove('active');
  editBtn.textContent = 'Sửa';

  // Handle edit button
  editBtn.onclick = function() {
    if (form.classList.contains('active')) {
      const modalStartTime = document.getElementById('modalStartTime').value;
      const modalEndTime = document.getElementById('modalEndTime').value;
      
      if (!modalStartTime || !modalEndTime) {
        alert('Vui lòng chọn thời gian bắt đầu và kết thúc');
        return;
      }

      const formData = {
        name: document.getElementById('modalName').value,
        startTime: new Date(modalStartTime).toISOString(),
        endTime: new Date(modalEndTime).toISOString(),
        color: document.getElementById('modalColorCode').value,
        duration: Math.max(1, Math.round((new Date(modalEndTime) - new Date(modalStartTime)) / (1000 * 60 * 60 * 24)))
      };

      db.collection("events").doc(ev.id).update(formData).then(() => {
        closeEventModal();
      });
    } else {
      // Switch to edit mode
      details.style.display = 'none';
      form.classList.add('active');
      editBtn.textContent = 'Lưu';
    }
  };

  // Close when clicking backdrop
  backdrop.onclick = function() {
    closeEventModal();
    clearInterval(timer);
  };

  // Store timer ID to clear when closing
  modal._timer = timer;
}

function closeEventModal() {
  const modal = document.getElementById('eventModal');
  const backdrop = document.getElementById('modalBackdrop');
  
  // Clear update timer if exists
  if (modal._timer) {
    clearInterval(modal._timer);
    modal._timer = null;
  }

  modal.style.display = 'none';
  backdrop.style.display = 'none';
}
