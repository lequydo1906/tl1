

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

// Initialize to a default value, will be updated when DOM is ready
let pixelsPerDay = 100;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  // Initial setup
  updatePixelsPerDay();
  
  // Update on resize
  window.addEventListener('resize', () => {
    updatePixelsPerDay();
    if (window._lastEvents) {
      renderTimeline(window._lastEvents);
    }
  });
  
  // Start listening for Firestore updates
  console.log('Starting Firestore listener');
  startFirestoreListener();
});

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}
function getStartEndDates() {
  const today = getToday();
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 0, 0, 0, 0);
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6, 0, 0, 0, 0);
  return { startDate, endDate };
}
function countDays(startDate, endDate) {
  return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
}


const timeline = document.getElementById('timeline');
const timelineScrollArea = document.querySelector('.timeline-scroll-area');

// No more resize, just update pixelsPerDay on load/resize window
function updatePixelsPerDay() {
  const timeline = document.querySelector('.timeline');
  if (!timeline) {
    console.error('Timeline element not found');
    return;
  }
  const totalWidth = timeline.clientWidth;
  const totalDays = moment(timelineEnd).diff(timelineStart, 'days');
  console.log(`Updating pixelsPerDay: width=${totalWidth}, days=${totalDays}`);
  pixelsPerDay = totalWidth / totalDays;
}

// Khởi tạo lại pixelMoiNgay khi load
updatePixelMoiNgay();

function getDateByIndex(idx, startDate) {
  return new Date(startDate.getTime() + idx * 24 * 60 * 60 * 1000);
}
function getIndexFromDate(date, startDate) {
  if (!(date instanceof Date)) date = new Date(date);
  return Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
}
function calcPixelPosition(date, startDate) {
  if (!(date instanceof Date)) date = new Date(date);
  const dayIndex = getIndexFromDate(date, startDate);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  let pixel = dayIndex * pixelsPerDay;
  pixel += hour * pixelsPerDay / 24;
  pixel += minute * pixelsPerDay / 24 / 60;
  pixel += second * pixelsPerDay / 24 / 3600;
  return pixel;
}

// Helper: get start of day
function getStartOfDay(date) {
  const dt = (date instanceof Date) ? date : new Date(date);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0);
}

function getTimeRemaining(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  let diff = end - now;
  if (diff <= 0) {
    // Already ended
    diff = Math.abs(diff);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) {
      return `${days} days ago`;
    } else if (hours > 0) {
      return `${hours} hours ago`;
    } else if (minutes > 0) {
      return `${minutes} minutes ago`;
    } else {
      return "Just ended";
    }
  }
  // Still remaining
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  if (days > 0) {
    return `${days} days ${hours}h left`;
  }
  return `${hours}h ${minutes}m ${seconds}s left`;
}
function format24h(date) {
  return date.getHours().toString().padStart(2, '0')
    + ':' + date.getMinutes().toString().padStart(2, '0')
    + ':' + date.getSeconds().toString().padStart(2, '0');
}
function scrollToCurrentTime(startDate) {
  const now = new Date();
  const leftPos = calcPixelPosition(now, startDate);
  timelineScrollArea.scrollLeft = leftPos - timelineScrollArea.clientWidth / 2 + pixelsPerDay;
}

// Helper: Chuyển ISO/UTC về local string cho input datetime-local (yyyy-MM-ddTHH:mm)
function toInputDatetimeLocal(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
}
function renderTimeline(events) {
    const { startDate, endDate } = getStartEndDates();
    const numDays = countDays(startDate, endDate);

    timeline.innerHTML = "";
    timeline.style.width = (numDays * pixelsPerDay) + "px";

    // --- MONTH ROW ---
    let currentMonth = -1;
    let monthStartIdx = 0;
    for (let i = 0; i <= numDays; i++) {
      const date = getDateByIndex(i, startDate);
      if (i === numDays || date.getMonth() !== currentMonth) {
        if (currentMonth !== -1) {
          // Draw month box
          const monthBox = document.createElement('div');
          monthBox.className = 'month-label';
          monthBox.style.position = 'absolute';
          monthBox.style.left = (monthStartIdx * pixelsPerDay) + 'px';
          monthBox.style.top = '-32px';
          monthBox.style.width = ((i - monthStartIdx) * pixelsPerDay) + 'px';
          monthBox.style.height = '28px';
          monthBox.style.lineHeight = '28px';
          monthBox.style.textAlign = 'center';
          monthBox.style.fontWeight = 'bold';
          monthBox.style.fontSize = '1.1em';
          monthBox.style.background = 'rgba(255,255,255,0.07)';
          monthBox.style.borderRadius = '8px 8px 0 0';
          monthBox.style.color = '#FFD600';
          monthBox.innerText = `Month ${currentMonth+1}`;
          timeline.appendChild(monthBox);
        }
        currentMonth = date.getMonth();
        monthStartIdx = i;
      }
    }

    // --- WEEKDAY ROW ---
    const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (let i = 0; i < numDays; i++) {
      const date = getDateByIndex(i, startDate);
      const weekday = weekdayNames[date.getDay()];
      const weekdayDiv = document.createElement('div');
      weekdayDiv.className = 'weekday-label';
      weekdayDiv.style.position = 'absolute';
      weekdayDiv.style.left = (i * pixelsPerDay - 15) + 'px';
      weekdayDiv.style.top = '-4px';
      weekdayDiv.style.width = '30px';
      weekdayDiv.style.height = '20px';
      weekdayDiv.style.textAlign = 'center';
      weekdayDiv.style.color = '#FFD600';
      weekdayDiv.style.fontWeight = 'bold';
      weekdayDiv.style.fontSize = '0.95em';
      weekdayDiv.innerText = weekday;
      timeline.appendChild(weekdayDiv);
    }

    // --- DAY ROW ---
    for (let i = 0; i < numDays; i++) {
      const date = getDateByIndex(i, startDate);
      // Vertical day line at 0h
      const dayLine = document.createElement('div');
      dayLine.className = "timeline-day-line";
      dayLine.style.position = "absolute";
      dayLine.style.left = (i * pixelsPerDay) + "px";
      dayLine.style.top = "40px";
      dayLine.style.height = "460px";
      dayLine.style.width = "1px";
      timeline.appendChild(dayLine);

      // Day number above the line
      const dayNum = document.createElement('div');
      dayNum.className = "date-col";
      dayNum.style.position = 'absolute';
      dayNum.style.left = (i * pixelsPerDay - 15) + 'px';
      dayNum.style.top = "20px";
      dayNum.innerText = date.getDate();
      timeline.appendChild(dayNum);
    }

    // Current time line (24h format)
    function showCurrentTimeLine() {
      const now = new Date();
      const leftPos = calcPixelPosition(now, startDate);
      let currentTimeRow = timeline.querySelector('.current-time-row');
      if (!currentTimeRow) {
        currentTimeRow = document.createElement('div');
        currentTimeRow.className = "current-time-row";
        timeline.appendChild(currentTimeRow);
      }
      currentTimeRow.style.left = leftPos + "px";
      currentTimeRow.style.top = "40px";
      currentTimeRow.style.width = "2px";
      currentTimeRow.style.height = "460px";
      currentTimeRow.innerHTML = `<div class=\"current-time-line\"></div>
        <div class=\"current-time-label\" style=\"top:-32px;left:-40px;\">${format24h(now)}</div>`;
      scrollToCurrentTime(startDate);
    }
    showCurrentTimeLine();
    if (window.__timelineTimer) clearInterval(window.__timelineTimer);
    window.__timelineTimer = setInterval(showCurrentTimeLine, 1000);

    // Event-bar
    timeline.querySelectorAll(".event-bar").forEach(e => e.remove());
    document.querySelectorAll('.event-tooltip').forEach(el => el.remove());
    events.forEach((ev, idx) => {
      // Convert start and end times to Date
      const startTime = ev.startTime ? new Date(ev.startTime) : new Date(ev.start);
      const endTime = ev.endTime ? new Date(ev.endTime) : new Date(ev.end || ev.start);

      // Calculate percent positions
      const startDayIdx = getIndexFromDate(startTime, startDate);
      const startHourRatio = (startTime.getHours() + startTime.getMinutes()/60 + startTime.getSeconds()/3600) / 24;
      const percentStart = ((startDayIdx + startHourRatio) / numDays) * 100;

      const endDayIdx = getIndexFromDate(endTime, startDate);
      const endHourRatio = (endTime.getHours() + endTime.getMinutes()/60 + endTime.getSeconds()/3600) / 24;
      const percentEnd = ((endDayIdx + endHourRatio) / numDays) * 100;

      const leftPercent = Math.max(0, Math.min(percentStart, 100));
      const rightPercent = Math.max(0, Math.min(percentEnd, 100));
      const widthPercent = Math.max(rightPercent - leftPercent, (4 / (timelineScrollArea.clientWidth || window.innerWidth)) * 100);

      // For debug
      console.log('[DEBUG EVENT]', {
        name: ev.name,
        start: startTime.toLocaleString(),
        end: endTime.toLocaleString(),
        startDayIdx,
        startHourRatio,
        percentStart,
        endDayIdx,
        endHourRatio,
        percentEnd,
        leftPercent,
        rightPercent,
        widthPercent
      });

      const bar = document.createElement('div');
      // Handle event-bar color: prefer hex, else use old class
      let barColor = ev.color || '';
      let isHex = /^#[0-9A-F]{6}$/i.test(barColor);
      let barClass = '';
      if (!isHex) {
        barClass = barColor;
        barColor = '';
      }
      bar.className = `event-bar${barClass ? ' ' + barClass : ''}`;
      bar.style.left = leftPercent + "%";
      bar.style.top = (60 + idx * 44) + "px";
      bar.style.width = widthPercent + "%";
      bar.style.height = "36px";
      if (barColor) {
        bar.style.background = barColor;
        bar.style.color = '#fff';
      }

      // Content: name + time + delete button
      bar.innerHTML = `<div class=\"event-title\">${ev.name}</div>
        <span class=\"time-info\" style=\"margin-left:8px;font-size:0.9em;\">
          ${startTime.getDate()}/${startTime.getMonth()+1} ${format24h(startTime)}
          - ${endTime.getDate()}/${endTime.getMonth()+1} ${format24h(endTime)}
        </span>
        <button class=\"delete-btn\" onclick=\"(function(id){ return function(e){ e.stopPropagation(); if(confirm('Delete this event?')) deleteEvent(id); }} )('${ev.id}')(event)\">Delete</button>`;

      // Add click event to open modal
      bar.addEventListener('click', function() {
        showEventModal(ev, startTime, endTime);
      });

      // Tooltip
      const tooltip = document.createElement('div');
      tooltip.className = "event-tooltip";
      tooltip.style.display = "none";
      document.body.appendChild(tooltip);

      bar.onmousemove = function(e) {
        tooltip.innerText = getTimeRemaining(endTime);
        tooltip.style.left = (e.pageX + 12) + "px";
        tooltip.style.top = (e.pageY - 10) + "px";
        tooltip.style.display = "block";
      };
      bar.onmouseleave = function() {
        tooltip.style.display = "none";
}

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
      // If ended >24h ago, hide from UI only, DO NOT delete from Firestore
      if (now - end > 24 * 60 * 60 * 1000) {
        doc.ref.delete().catch(()=>{});
        return; // skip pushing this event
      }
    }
    events.push(data);
  });
  // Function to classify event status
  function getEventStatus(event) {
    const now = new Date();
    const endTime = new Date(event.endTime || event.end || event.start);
    const timeLeft = endTime - now;
    
    if (timeLeft < 0) {
      // Has ended
      return {status: 'ended', timeAgo: Math.abs(timeLeft)};
    } else {
      // Still active
      return {status: 'active', timeLeft: timeLeft};
    }
  }

  // Sort events by new rules
  events.sort((a, b) => {
    const statusA = getEventStatus(a);
    const statusB = getEventStatus(b);
    
    // If both are active
    if (statusA.status === 'active' && statusB.status === 'active') {
      // Sort by remaining time (less -> more)
      return statusA.timeLeft - statusB.timeLeft;
    }
    
    // If both have ended
    if (statusA.status === 'ended' && statusB.status === 'ended') {
      // Sort by end time (recently ended -> ended long ago)
      return statusA.timeAgo - statusB.timeAgo;
    }
    
    // Active events always above ended events
    return statusA.status === 'active' ? -1 : 1;
  });

  window._lastEvents = events; // Lưu events để dùng khi resize
  renderTimeline(events);
});

// Add edit/cancel support for form
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

// Helper to set form from event when editing
function startEditEvent(ev) {
  document.getElementById('name').value = ev.name || '';
  
  // Handle color
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
  
  // Preserve time values
  const startTime = ev.startTime || ev.start;
  const endTime = ev.endTime || ev.end;
  
  if (startTime) {
    const startInput = document.getElementById('startTime');
    startInput.value = toInputDatetimeLocal(startTime);
    // Save original value for change validation
    startInput.setAttribute('data-original', startInput.value);
  }
  
  if (endTime) {
    const endInput = document.getElementById('endTime');
    endInput.value = toInputDatetimeLocal(endTime);
    // Save original value for change validation
    endInput.setAttribute('data-original', endInput.value);
  }
  
  editIdInput.value = ev.id;
  document.querySelector('#eventForm button[type="submit"]').textContent = 'Lưu thay đổi';
  cancelBtn.style.display = 'inline-block';
  
  // Add input change validation
  ['startTime', 'endTime'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('change', function() {
      if (!this.value) {
        this.value = this.getAttribute('data-original');
      }
    });
  });
}

// Handle color picker in add event form
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
