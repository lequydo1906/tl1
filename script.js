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

const pxPerDay = Math.floor(window.innerWidth / 14);

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}
function getStartEndDate() {
  const today = getToday();
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
function getTimeRemaining(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  let diff = end - now;
  if (diff <= 0) return "Đã kết thúc";
  let hrs = Math.floor(diff / (1000 * 60 * 60));
  let mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  let secs = Math.floor((diff % (1000 * 60)) / 1000);
  return `Còn lại ${hrs}h ${mins}m ${secs}s`;
}
function formatTime24h(date) {
  return date.getHours().toString().padStart(2, '0')
    + ':' + date.getMinutes().toString().padStart(2, '0')
    + ':' + date.getSeconds().toString().padStart(2, '0');
}
function scrollToCurrentTime(startDate) {
  const now = new Date();
  const left = calcLeftPx(now, startDate);
  timelineContainer.scrollLeft = left - timelineContainer.clientWidth / 2 + pxPerDay;
}

// Sửa lại điểm kết thúc event-bar nếu là 0h
function fixEndTime(end, start) {
  if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0 && end > start) {
    return new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
  }
  return end;
}

function renderEvent(ev, idx) {
  const start = ev.start.toDate();
  const end = ev.end.toDate();

  // Vị trí bắt đầu (tính số ngày, có thể thập phân)
  const left = ((start - startDate) / 86400000) * pxPerDay;
  // Vị trí kết thúc (tính số ngày, có thể thập phân)
  let right = ((end - startDate) / 86400000) * pxPerDay;

  // Nếu end chính xác là 0h, thì kết thúc sát cuối ngày trước
  if (
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end > start
  ) {
    right -= 2; // Trừ 2px để dừng sát đường kẻ ngày, không qua ngày tiếp theo
  }

  const width = Math.max(right - left, 4); // Không âm, tối thiểu 4px

  const div = document.createElement("div");
  div.className = "event";
  div.style.left = left + "px";
  div.style.top = 50 + idx * 40 + "px";
  div.style.width = width + "px";
  div.textContent = ev.title;

  div.addEventListener("mousemove", e => {
    const now = new Date();
    const diff = end - now;
    if (diff > 0) {
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      tooltip.textContent = `Còn lại ${hrs}h ${mins}m ${secs}s`;
    } else {
      tooltip.textContent = "Đã kết thúc";
    }
    tooltip.style.display = "block";
    tooltip.style.left = (e.pageX + 10) + "px";
    tooltip.style.top = (e.pageY - 20) + "px";
  });
  div.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
  });
  timeline.appendChild(div);
}

    // Số ngày nằm trên đầu đường kẻ
    const num = document.createElement('div');
    num.className = "date-col";
    num.style.position = 'absolute';
    num.style.left = (i * pxPerDay - 15) + 'px';
    num.style.top = "0px";
    num.innerText = date.getDate();
    timeline.appendChild(num);
  }

  // Đường chỉ thời gian hiện tại (24h format)
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
    currentTimeRow.style.top = "40px";
    currentTimeRow.style.width = "2px";
    currentTimeRow.style.height = "460px";
    currentTimeRow.innerHTML = `<div class="current-time-line"></div>
      <div class="current-time-label" style="top:-32px;left:-40px;">${formatTime24h(now)}</div>`;
    scrollToCurrentTime(startDate);
  }
  renderCurrentTimeBar();
  if (window.__timelineTimer) clearInterval(window.__timelineTimer);
  window.__timelineTimer = setInterval(renderCurrentTimeBar, 1000);

  // Event-bar
  timeline.querySelectorAll(".event-bar").forEach(e => e.remove());
  document.querySelectorAll('.event-tooltip').forEach(el => el.remove());
  function isZeroHour(date) {
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;
}

events.forEach((ev, idx) => {
  const start = ev.startTime ? new Date(ev.startTime) : new Date(ev.start);
  let end = ev.endTime ? new Date(ev.endTime) : new Date(ev.end || ev.start);

  // Nếu end là 0h, thì thực chất event kết thúc ở cuối ngày trước
  let right = calcLeftPx(end, startDate);
  const left = calcLeftPx(start, startDate);

  // Nếu end là 0h và lớn hơn start, width = right - left - 2
  let width = right - left;
  if (isZeroHour(end) && end > start) {
    width -= 2; // Trừ 2px để sát đường kẻ ngày, không lấn sang
  }
  width = Math.max(width, 4);
});
    const bar = document.createElement('div');
    bar.className = `event-bar ${ev.color || ""}`;
    bar.style.left = left + "px";
    bar.style.top = (60 + idx * 44) + "px";
    bar.style.width = width + "px";
    bar.style.height = "36px";
    bar.innerHTML = `${ev.name}
      <span style="margin-left:8px;">${ev.duration || ""}</span>
      <span style="margin-left:8px;font-size:0.9em;">
        ${start.getDate()}/${start.getMonth()+1} ${formatTime24h(start)}
        - ${end.getDate()}/${end.getMonth()+1} ${formatTime24h(end)}
      </span>
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
  const duration = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

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