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

// Helper: Tính vị trí trên timeline
function getDateIndexFromDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return month === 8 ? day - 17 : 15 + (day - 1);
}
const daysCount = 15 + 23;
const months = ["Tháng 8", "Tháng 9"];
const weekdays = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];
const dates = [...Array(daysCount)].map((_, i) => (i < 15 ? 17 + i : i - 15 + 1));

// Tính thời gian còn lại đẹp
function getTimeRemaining(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  let diff = end - now;
  if (diff <= 0) return "Đã kết thúc";
  let months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  diff -= months * (1000 * 60 * 60 * 24 * 30);
  let days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  let hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  let minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);
  let seconds = Math.floor(diff / 1000);

  let parts = [];
  if (months > 0) parts.push(months + " tháng");
  if (days > 0) parts.push(days + " ngày");
  if (hours > 0) parts.push(hours + " giờ");
  if (minutes > 0) parts.push(minutes + " phút");
  parts.push(seconds + " giây");
  return parts.join(" ");
}

// Render timeline
function renderTimeline(events) {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = "";

  // Dòng 1: Tháng
  const monthRow = document.createElement('div');
  monthRow.className = "timeline-row";
  monthRow.style.position = "absolute";
  monthRow.style.top = "0px";
  monthRow.style.left = "0px";
  monthRow.style.width = "100%";
  monthRow.style.zIndex = "2";
  monthRow.innerHTML = `<div class="month">${months[0]}</div><div class="month">${months[1]}</div>`;
  timeline.appendChild(monthRow);

  // Dòng 2: Thứ
  const weekdayRow = document.createElement('div');
  weekdayRow.className = "timeline-row";
  weekdayRow.style.position = "absolute";
  weekdayRow.style.top = "32px";
  weekdayRow.style.left = "0px";
  weekdayRow.style.width = "100%";
  weekdayRow.style.zIndex = "2";
  for (let i = 0; i < daysCount; i++) {
    weekdayRow.innerHTML += `<div class="weekday">${weekdays[(i + 5) % 7]}</div>`;
  }
  timeline.appendChild(weekdayRow);

  // Dòng 3: Ngày
  const dateRow = document.createElement('div');
  dateRow.className = "timeline-row";
  dateRow.style.position = "absolute";
  dateRow.style.top = "64px";
  dateRow.style.left = "0px";
  dateRow.style.width = "100%";
  dateRow.style.zIndex = "2";
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
    const currentDateIdx = getDateIndexFromDate(now.toISOString());

    let currentTimeRow = timeline.querySelector('.current-time-row');
    if (!currentTimeRow) {
      currentTimeRow = document.createElement('div');
      currentTimeRow.className = "current-time-row";
      timeline.appendChild(currentTimeRow);
    }
    currentTimeRow.innerHTML = `<span class="current-time-label" style="left:${currentDateIdx * 40 - 15}px;top:0;">${currentTimeLabel}</span>
      <div class="current-time-line" style="left:${currentDateIdx * 40}px;top:26px;"></div>`;
  }
  renderCurrentTimeBar();
  if (window.__timelineTimer) clearInterval(window.__timelineTimer);
  window.__timelineTimer = setInterval(renderCurrentTimeBar, 1000);

  // Dòng 5+: Sự kiện
  const nowDate = new Date();
  events.forEach(ev => {
    ev.remaining = (new Date(ev.endTime) - nowDate) / (1000 * 60 * 60 * 24);
  });
  events.sort((a, b) => a.remaining - b.remaining);

  // Xóa tooltip cũ nếu có
  document.querySelectorAll('.event-tooltip').forEach(el => el.remove());

  events.forEach((ev, idx) => {
    const startIdx = getDateIndexFromDate(ev.startTime);
    const endIdx = getDateIndexFromDate(ev.endTime);
    const width = (endIdx - startIdx + 1) * 40;
    const bar = document.createElement('div');
    bar.className = `event-bar ${ev.color}`;
    bar.style.left = (startIdx * 40) + "px";
    bar.style.top = (140 + idx * 44) + "px"; // đồng bộ với dòng ngày bên trên
    bar.style.width = width + "px";
    bar.style.zIndex = "3";
    // Hiển thị ngày giờ
    const startTimeShow = new Date(ev.startTime).toLocaleString('vi-VN');
    const endTimeShow = new Date(ev.endTime).toLocaleString('vi-VN');
    bar.innerHTML = `${ev.name} <span style="margin-left:8px;">${ev.duration}d</span>
      <span style="margin-left:8px;font-size:0.9em;">${startTimeShow} - ${endTimeShow}</span>
      <button class="delete-btn" onclick="deleteEvent('${ev.id}')">Xóa</button>`;

    // Tạo tooltip
    const tooltip = document.createElement('div');
    tooltip.className = "event-tooltip";
    tooltip.style.display = "none";
    tooltip.innerText = "Còn lại: " + getTimeRemaining(ev.endTime);
    document.body.appendChild(tooltip);

    bar.onmousemove = function(e) {
      tooltip.innerText = "Còn lại: " + getTimeRemaining(ev.endTime);
      tooltip.style.left = (e.pageX + 12) + "px";
      tooltip.style.top = (e.pageY - 10) + "px";
      tooltip.style.display = "block";
    };
    bar.onmouseleave = function() {
      tooltip.style.display = "none";
    };

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