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

const pxPerDay = Math.floor(window.innerWidth / 14); // mỗi ngày chiếm 1/14 màn hình
const today = new Date();
function getToday() {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
}
function getStartEndDate() {
  const today = getToday();
  // hôm nay ở giữa, hiển thị 14 ngày (7 trước, 6 sau)
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 0, 0, 0, 0);
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6, 0, 0, 0, 0);
  return { startDate, endDate };
}
function getDaysCount(startDate, endDate) {
  return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
}

const timeline = document.getElementById('timeline');
const timelineContainer = document.getElementById('timeline-container');

function getDateByIndex(idx, startDate) {
  return new Date(startDate.getTime() + idx * 24 * 60 * 60 * 1000);
}
function getDateIndexFromDate(date, startDate) {
  if (!(date instanceof Date)) date = new Date(date);
  return Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
}
function calcLeftPx(date, startDate) {
  if (!(date instanceof Date)) date = new Date(date);
  const dayIdx = getDateIndexFromDate(date, startDate);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  let px = dayIdx * pxPerDay;
  px += hour * pxPerDay / 24;
  px += minute * pxPerDay / 24 / 60;
  px += second * pxPerDay / 24 / 3600;
  return px;
}
function scrollToCurrentTime(startDate) {
  const now = new Date();
  const left = calcLeftPx(now, startDate);
  timelineContainer.scrollLeft = left - timelineContainer.clientWidth / 2 + pxPerDay;
}

// Render timeline: chỉ cột ngày, event-bar, trục hiện tại
function renderTimeline(events) {
  const { startDate, endDate } = getStartEndDate();
  const daysCount = getDaysCount(startDate, endDate);

  timeline.innerHTML = "";
  timeline.style.width = (daysCount * pxPerDay) + "px";

  // 1. Cột ngày + đường kẻ dọc
  for (let i = 0; i < daysCount; i++) {
    const date = getDateByIndex(i, startDate);
    const cell = document.createElement('div');
    cell.className = "date-col";
    cell.style.position = 'absolute';
    cell.style.left = (i * pxPerDay) + 'px';
    cell.style.top = "0px";
    cell.style.width = pxPerDay + 'px';
    cell.style.height = "40px";
    cell.style.textAlign = 'center';
    cell.style.color = '#FFD600';
    cell.style.fontWeight = 'bold';
    cell.innerText = date.getDate();

    // Đường kẻ dọc
    const line = document.createElement('div');
    line.className = "timeline-day-line";
    line.style.left = "50%";
    line.style.top = "20px";
    line.style.height = "500px";
    line.style.width = "1px";
    cell.appendChild(line);

    timeline.appendChild(cell);
  }

  // 2. Đường chỉ thời gian hiện tại
  function renderCurrentTimeBar() {
    const now = new Date();
    const left = calcLeftPx(now, startDate);
    let currentTimeRow = timeline.querySelector('.current-time-row');
    if (!currentTimeRow) {
      currentTimeRow = document.createElement('div');
      currentTimeRow.className = "current-time-row";
      timeline.appendChild(currentTimeRow);
    }
    currentTimeRow.style.left = left + "px";
    currentTimeRow.style.top = "0px";
    currentTimeRow.style.width = "2px";
    currentTimeRow.style.height = "500px";
    currentTimeRow.innerHTML = `<div class="current-time-line"></div>
      <div class="current-time-label" style="top:0;left:-40px;">${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}</div>`;
    scrollToCurrentTime(startDate);
  }
  renderCurrentTimeBar();
  if (window.__timelineTimer) clearInterval(window.__timelineTimer);
  window.__timelineTimer = setInterval(renderCurrentTimeBar, 1000);

  // 3. Event-bar
  timeline.querySelectorAll(".event-bar").forEach(e => e.remove());
  document.querySelectorAll('.event-tooltip').forEach(el => el.remove());
  events.forEach((ev, idx) => {
    const start = ev.startTime ? new Date(ev.startTime) : new Date(ev.start);
    const end = ev.endTime ? new Date(ev.endTime) : new Date(ev.end || ev.start);
    const left = calcLeftPx(start, startDate);
    const width = Math.max(calcLeftPx(end, startDate) - left, 4);

    const bar = document.createElement('div');
    bar.className = `event-bar ${ev.color || ""}`;
    bar.style.position = 'absolute';
    bar.style.left = left + "px";
    bar.style.top = (60 + idx * 44) + "px";
    bar.style.width = width + "px";
    bar.style.height = "36px";
    bar.style.zIndex = "3";
    bar.innerHTML = `${ev.name} <span style="margin-left:8px;">${ev.duration || ""}</span>
      <span style="margin-left:8px;font-size:0.9em;">${start.toLocaleString('vi-VN')} - ${end.toLocaleString('vi-VN')}</span>
      <button class="delete-btn" onclick="deleteEvent('${ev.id}')">Xóa</button>`;

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = "event-tooltip";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    bar.onmousemove = function(e) {
      tooltip.innerText = getTimeRemaining(end);
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