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

// Helper: Tính vị trí event trên timeline
function getDateIndex(month, day) { return month === 8 ? day - 17 : 15 + (day - 1); }
const daysCount = 15 + 23;

// Danh sách tháng, thứ, ngày
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

  // Dòng 4: Hiển thị giờ hiện tại + đường chỉ
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentSecond = now.getSeconds().toString().padStart(2, '0');
  const currentTimeLabel = `${currentHour}:${currentMinute}:${currentSecond}`;
  const currentDateIdx = getDateIndex(9, 2); // ví dụ: tháng 9 ngày 2

  const currentTimeRow = document.createElement('div');
  currentTimeRow.className = "current-time-row";
  currentTimeRow.innerHTML = `<span class="current-time-label" style="left:${currentDateIdx * 40 - 15}px">${currentTimeLabel}</span>
    <div class="current-time-line" style="left:${currentDateIdx * 40}px"></div>`;
  timeline.appendChild(currentTimeRow);

  // Dòng 5+: Sự kiện (sắp xếp theo thời gian còn lại tăng dần)
  // Tính thời gian còn lại (tính theo ngày kết thúc)
  const nowDate = new Date();
  events.forEach(ev => {
    ev.remaining = (
      new Date(nowDate.getFullYear(), ev.end.month - 1, ev.end.day) - nowDate
    ) / (1000 * 60 * 60 * 24);
  });
  events.sort((a, b) => a.remaining - b.remaining);

  events.forEach((ev, idx) => {
    const startIdx = getDateIndex(ev.start.month, ev.start.day);
    const endIdx = getDateIndex(ev.end.month, ev.end.day);
    const width = (endIdx - startIdx + 1) * 40;
    const bar = document.createElement('div');
    bar.className = `event-bar ${ev.color}`;
    bar.style.top = (90 + idx * 44) + "px";
    bar.style.left = (startIdx * 40) + "px";
    bar.style.width = width + "px";
    bar.innerHTML = `${ev.name} <span style="margin-left:8px;">${ev.duration}d</span>
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
  const data = {
    name: document.getElementById('name').value,
    color: document.getElementById('color').value,
    start: { month: Number(document.getElementById('startMonth').value), day: Number(document.getElementById('startDay').value) },
    end: { month: Number(document.getElementById('endMonth').value), day: Number(document.getElementById('endDay').value) },
    duration: Number(document.getElementById('duration').value)
  };
  db.collection("events").add(data).then(() => {
    document.getElementById('eventForm').reset();
  });
};

// Xóa event
function deleteEvent(id) {
  db.collection("events").doc(id).delete();
}