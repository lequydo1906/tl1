// Firebase config
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

// Helper
function getDateIndexFromDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // Tháng 8: từ ngày 17-31, Tháng 9: từ 1-23
  return month === 8 ? day - 17 : 15 + (day - 1);
}
const daysCount = 15 + 23;
const months = ["Tháng 8", "Tháng 9"];
const weekdays = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];
const dates = [...Array(daysCount)].map((_, i) => (i < 15 ? 17 + i : i - 15 + 1));

// Hiển thị timeline
function renderTimeline(events) {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = "";

  // Dòng 1: Tháng
  const monthRow = document.createElement('div');
  monthRow.className = "timeline-row";
  monthRow.innerHTML = `<div class="month">${months[0]}</div><div class="month">${months[1]}</div>`;
  timeline.appendChild(monthRow);

  // Dòng 2: Thứ
  const weekdayRow = document.createElement('div');
  weekdayRow.className = "timeline-row";
  for (let i = 0; i < daysCount; i++) {
    weekdayRow.innerHTML += `<div class="weekday">${weekdays[(i + 5) % 7]}</div>`;
  }
  timeline.appendChild(weekdayRow);

  // Dòng 3: Ngày
  const dateRow = document.createElement('div');
  dateRow.className = "timeline-row";
  dates.forEach(date => {
    dateRow.innerHTML += `<div class="date">${date}</div>`;
  });
  timeline.appendChild(dateRow);

  // Dòng 4: Giờ hiện tại + đường chỉ
  function renderCurrentTimeBar() {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentSecond = now.getSeconds().toString().padStart(2, '0');
    const currentTimeLabel = `${currentHour}:${currentMinute}:${currentSecond}`;

    // Đường chỉ tại ngày hiện tại
    const todayMonth = now.getMonth() + 1;
    const todayDate = now.getDate();
    let currentDateIdx = getDateIndexFromDate(now.toISOString());
    // Nếu ngoài phạm vi timeline thì để ở đầu/cuối
    if (currentDateIdx < 0) currentDateIdx = 0;
    if (currentDateIdx >= daysCount) currentDateIdx = daysCount - 1;

    // Row chứa label và đường chỉ dọc
    const currentTimeRow = document.createElement('div');
    currentTimeRow.className = "current-time-row";
    currentTimeRow.innerHTML = `<span class="current-time-label" style="left:${currentDateIdx * 40 - 15}px">${currentTimeLabel}</span>
      <div class="current-time-line" style="left:${currentDateIdx * 40}px"></div>`;
    // xóa dòng 4 cũ nếu đã có
    const oldRow = document.querySelector('.current-time-row');
    if (oldRow) timeline.removeChild(oldRow);
    timeline.appendChild(currentTimeRow);
  }
  renderCurrentTimeBar();
  // Tự động cập nhật giờ mỗi giây
  if (window.__timelineTimer) clearInterval(window.__timelineTimer);
  window.__timelineTimer = setInterval(renderCurrentTimeBar, 1000);

  // Dòng 5+: Sự kiện (sắp xếp theo thời gian còn lại tăng dần)
  const nowDate = new Date();
  events.forEach(ev => {
    ev.remaining = (
      new Date(ev.endTime) - nowDate
    ) / (1000 * 60 * 60 * 24);
  });
  events.sort((a, b) => a.remaining - b.remaining);

  events.forEach((ev, idx) => {
    const startIdx = getDateIndexFromDate(ev.startTime);
    const endIdx = getDateIndexFromDate(ev.endTime);
    const width = (endIdx - startIdx + 1) * 40;
    const bar = document.createElement('div');
    bar.className = `event-bar ${ev.color}`;
    bar.style.top = (130 + idx * 44) + "px";
    bar.style.left = (startIdx * 40) + "px";
    bar.style.width = width + "px";
    // Hiển thị ngày giờ
    const startTimeShow = new Date(ev.startTime).toLocaleString('vi-VN');
    const endTimeShow = new Date(ev.endTime).toLocaleString('vi-VN');
    bar.innerHTML = `${ev.name} <span style="margin-left:8px;">${ev.duration}d</span>
      <span style="margin-left:8px;font-size:0.9em;">${startTimeShow} - ${endTimeShow}</span>
      <button class="delete-btn" onclick="deleteEvent('${ev.id}')">Xóa</button>`;
    timeline.appendChild(bar);
  });
}

// Đọc event Firestore realtime
db.collection("events").onSnapshot(snap => {
  const events = [];
  snap.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
  renderTimeline(events);
});

// Thêm event
document.getElementById('eventForm').onsubmit = function(e) {
  e.preventDefault();
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24))); // số ngày

  const data = {
    name: document.getElementById('name').value,
    color: document.getElementById('color').value,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    duration
  };
  db.collection("events").add(data).then(() => {
    document.getElementById('eventForm').reset();
  });
};

// Xóa event
function deleteEvent(id) {
  db.collection("events").doc(id).delete();
}