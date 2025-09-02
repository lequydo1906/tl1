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

// Timeline constants
const pxPerDay = 40; // pixel cho mỗi ngày
const startDate = new Date("2025-08-17");
const endDate = new Date("2025-09-23");
const daysCount = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
const months = ["Tháng 8", "Tháng 9"];
const weekdays = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];
const timeline = document.getElementById('timeline');

// Helper
function getDateByIndex(idx) {
  return new Date(startDate.getTime() + idx * 24 * 60 * 60 * 1000);
}
function getDateIndexFromDate(dateStr) {
  const date = new Date(dateStr);
  return Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
}
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
  timeline.innerHTML = "";

  // 1. Dòng tháng
  const monthRow = document.createElement('div');
  monthRow.className = "timeline-row";
  monthRow.style.display = 'flex';
  for (let i = 0; i < daysCount; i++) {
    const date = getDateByIndex(i);
    const monthDiv = document.createElement('div');
    monthDiv.style.width = pxPerDay + 'px';
    monthDiv.style.textAlign = 'center';
    monthDiv.style.fontWeight = (i === 0 || i === 15) ? 'bold' : '';
    monthDiv.style.color = (i === 0 || i === 15) ? '#FFD600' : '#aaa';
    monthDiv.style.fontSize = (i === 0 || i === 15) ? '1.2em' : '0.9em';
    monthDiv.innerText = (i === 0) ? months[0] : (i === 15) ? months[1] : '';
    monthRow.appendChild(monthDiv);
  }
  timeline.appendChild(monthRow);

  // 2. Dòng thứ
  const weekdayRow = document.createElement('div');
  weekdayRow.className = "timeline-row";
  weekdayRow.style.display = 'flex';
  for (let i = 0; i < daysCount; i++) {
    const date = getDateByIndex(i);
    const dayDiv = document.createElement('div');
    dayDiv.style.width = pxPerDay + 'px';
    dayDiv.style.textAlign = 'center';
    dayDiv.style.color = '#aaa';
    dayDiv.innerText = weekdays[date.getDay()];
    weekdayRow.appendChild(dayDiv);
  }
  timeline.appendChild(weekdayRow);

  // 3. Dòng ngày
  const dateRow = document.createElement('div');
  dateRow.className = "timeline-row";
  dateRow.style.display = 'flex';
  for (let i = 0; i < daysCount; i++) {
    const date = getDateByIndex(i);
    const dateDiv = document.createElement('div');
    dateDiv.style.width = pxPerDay + 'px';
    dateDiv.style.textAlign = 'center';
    dateDiv.style.color = '#aaa';
    dateDiv.innerText = date.getDate();
    dateRow.appendChild(dateDiv);
  }
  timeline.appendChild(dateRow);

  // 4. Dòng giờ hiện tại + đường chỉ
  function renderCurrentTimeBar() {
    const now = new Date();
    const idx = getDateIndexFromDate(now);
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentSecond = now.getSeconds().toString().padStart(2, '0');
    const currentTimeLabel = `${currentHour}:${currentMinute}:${currentSecond}`;
    let currentTimeRow = timeline.querySelector('.current-time-row');
    if (!currentTimeRow) {
      currentTimeRow = document.createElement('div');
      currentTimeRow.className = "current-time-row";
      timeline.appendChild(currentTimeRow);
    }
    currentTimeRow.style.position = 'absolute';
    currentTimeRow.style.left = '0px';
    currentTimeRow.style.top = (3 * 32) + 'px'; // sau 3 dòng
    currentTimeRow.style.height = '0px';
    currentTimeRow.style.width = (daysCount * pxPerDay) + 'px';
    currentTimeRow.style.zIndex = '10';
    currentTimeRow.innerHTML = `<span class="current-time-label" style="left:${idx * pxPerDay + pxPerDay / 2}px;top:-24px;position:absolute;">${currentTimeLabel}</span>
      <div class="current-time-line" style="left:${idx * pxPerDay + pxPerDay / 2}px;top:0px;position:absolute;"></div>`;
  }
  renderCurrentTimeBar();
  if (window.__timelineTimer) clearInterval(window.__timelineTimer);
  window.__timelineTimer = setInterval(renderCurrentTimeBar, 1000);

  // 5. Event-bar: tuyệt đối, left/top tính toán chuẩn
  timeline.querySelectorAll(".event-bar").forEach(e => e.remove());
  document.querySelectorAll('.event-tooltip').forEach(el => el.remove());
  events.forEach((ev, row) => {
    const start = ev.startTime ? new Date(ev.startTime) : new Date(ev.start);
    const end = ev.endTime ? new Date(ev.endTime) : new Date(ev.end || ev.start);

    const diffStart = Math.max(0, getDateIndexFromDate(start));
    const diffEnd = Math.min(daysCount - 1, getDateIndexFromDate(end));
    const left = diffStart * pxPerDay;
    const width = Math.max((diffEnd - diffStart + 1) * pxPerDay, pxPerDay / 2);

    const bar = document.createElement('div');
    bar.className = `event-bar ${ev.color || ""}`;
    bar.style.position = 'absolute';
    bar.style.left = left + "px";
    bar.style.top = (3 * 32 + 16 + row * 44) + "px"; // sau 3 dòng + margin + row
    bar.style.width = width + "px";
    bar.style.zIndex = "3";
    bar.style.height = "36px";
    // Thông tin sự kiện
    const startTimeShow = start.toLocaleString('vi-VN');
    const endTimeShow = end.toLocaleString('vi-VN');
    bar.innerHTML = `${ev.name} <span style="margin-left:8px;">${ev.duration || (diffEnd - diffStart + 1)}d</span>
      <span style="margin-left:8px;font-size:0.9em;">${startTimeShow} - ${endTimeShow}</span>
      <button class="delete-btn" onclick="deleteEvent('${ev.id}')">Xóa</button>`;

    // Tooltip thời gian còn lại
    const tooltip = document.createElement('div');
    tooltip.className = "event-tooltip";
    tooltip.style.display = "none";
    tooltip.innerText = "Còn lại: " + getTimeRemaining(end);
    document.body.appendChild(tooltip);

    bar.onmousemove = function(e) {
      tooltip.innerText = "Còn lại: " + getTimeRemaining(end);
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

// Firestore realtime
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