// Cây Gia Phả - Family Tree Application
// Lưu trữ dữ liệu trên localStorage

class FamilyTree {
  constructor() {
    this.members = this.loadFromStorage();
    this.init();
  }

  loadFromStorage() {
    const stored = localStorage.getItem('familyTree');
    return stored ? JSON.parse(stored) : [];
  }

  saveToStorage() {
    localStorage.setItem('familyTree', JSON.stringify(this.members));
  }

  addMember(name, birthYear, gender, parentId) {
    const member = {
      id: Date.now().toString(),
      name,
      birthYear: birthYear ? parseInt(birthYear) : null,
      gender,
      parentId: parentId || null,
      children: []
    };
    this.members.push(member);
    if (parentId) {
      const parent = this.members.find(m => m.id === parentId);
      if (parent && !parent.children.includes(member.id)) {
        parent.children.push(member.id);
      }
    }
    this.saveToStorage();
    return member;
  }

  deleteMember(id) {
    // Remove from parent's children
    const member = this.members.find(m => m.id === id);
    if (member && member.parentId) {
      const parent = this.members.find(m => m.id === member.parentId);
      if (parent) {
        parent.children = parent.children.filter(cId => cId !== id);
      }
    }
    // Remove member and its children
    this.members = this.members.filter(m => m.id !== id && m.parentId !== id);
    this.saveToStorage();
  }

  getMemberById(id) {
    return this.members.find(m => m.id === id);
  }

  getParents(memberId) {
    const member = this.members.find(m => m.id === memberId);
    return member && member.parentId ? [this.getMemberById(member.parentId)] : [];
  }

  getChildren(memberId) {
    const member = this.members.find(m => m.id === memberId);
    return member ? member.children.map(cId => this.getMemberById(cId)).filter(m => m) : [];
  }

  getSiblings(memberId) {
    const member = this.members.find(m => m.id === memberId);
    if (!member || !member.parentId) return [];
    const parent = this.getMemberById(member.parentId);
    return parent.children
      .map(cId => this.getMemberById(cId))
      .filter(m => m && m.id !== memberId);
  }

  getRootMembers() {
    return this.members.filter(m => !m.parentId);
  }

  init() {
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    document.getElementById('addMemberForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('memberName').value.trim();
      const birthYear = document.getElementById('birthYear').value;
      const gender = document.getElementById('gender').value;
      const parentId = document.getElementById('parentSelect').value;

      if (name) {
        this.addMember(name, birthYear, gender, parentId || null);
        document.getElementById('addMemberForm').reset();
        this.render();
      }
    });

    // Modal close
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  updateParentSelectOptions() {
    const parentSelect = document.getElementById('parentSelect');
    const currentOptions = parentSelect.innerHTML;
    const newOptions = '<option value="">-- Không có --</option>' +
      this.members
        .map(m => `<option value="${m.id}">${m.name}</option>`)
        .join('');
    if (currentOptions !== newOptions) {
      parentSelect.innerHTML = newOptions;
    }
  }

  renderMembersList() {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = this.members
      .map(m => `
        <div class="member-item" onclick="familyTree.showMemberDetails('${m.id}')">
          <div class="member-item-name">${m.name}</div>
          <div class="member-item-info">
            ${m.gender} ${m.birthYear ? '• ' + m.birthYear : ''}
          </div>
          <button class="member-item-delete" onclick="event.stopPropagation(); familyTree.deleteMember('${m.id}'); familyTree.render();">Xóa</button>
        </div>
      `)
      .join('');
  }

  renderTree() {
    const treeContainer = document.getElementById('treeContainer');
    const emptyState = document.getElementById('emptyState');

    if (this.members.length === 0) {
      treeContainer.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    const rootMembers = this.getRootMembers();
    let html = '';

    // Nhóm các thế hệ
    html += this.renderGenerationGroup(rootMembers, 'Tổ Tiên / Ông Bà');

    // Nhóm bố mẹ
    const parentsGeneration = new Set();
    this.members.forEach(m => {
      if (m.parentId) {
        const parent = this.getMemberById(m.parentId);
        if (parent && !parent.parentId) {
          parentsGeneration.add(parent);
        }
      }
    });

    if (parentsGeneration.size > 0) {
      html += this.renderGenerationGroup(Array.from(parentsGeneration), 'Bố Mẹ');
    }

    // Nhóm con em / cháu
    const childrenGeneration = new Set();
    this.members.forEach(m => {
      this.getChildren(m.id).forEach(child => childrenGeneration.add(child));
    });

    if (childrenGeneration.size > 0) {
      html += this.renderGenerationGroup(Array.from(childrenGeneration), 'Con / Cháu');
    }

    treeContainer.innerHTML = html;
  }

  renderGenerationGroup(members, title) {
    if (members.length === 0) return '';

    const membersHtml = members
      .map(m => `
        <div class="member-card" onclick="familyTree.showMemberDetails('${m.id}')">
          <div class="member-card-name">${m.name}</div>
          ${m.birthYear ? `<div class="member-card-info">Sinh: ${m.birthYear}</div>` : ''}
          <span class="member-card-gender ${m.gender === 'Nam' ? 'male' : 'female'}">${m.gender}</span>
        </div>
      `)
      .join('');

    return `
      <div class="family-group">
        <div class="family-group-title">${title}</div>
        <div class="members-grid">${membersHtml}</div>
      </div>
    `;
  }

  showMemberDetails(memberId) {
    const member = this.getMemberById(memberId);
    if (!member) return;

    const parents = this.getParents(memberId);
    const children = this.getChildren(memberId);
    const siblings = this.getSiblings(memberId);

    let parentsSectionHtml = '<strong>Cha/Mẹ:</strong> ';
    if (parents.length > 0) {
      parentsSectionHtml += parents.map(p => p.name).join(', ');
    } else {
      parentsSectionHtml += 'Chưa có';
    }

    let childrenSectionHtml = '<strong>Con:</strong> ';
    if (children.length > 0) {
      childrenSectionHtml += children.map(c => c.name).join(', ');
    } else {
      childrenSectionHtml += 'Chưa có';
    }

    let siblingsSectionHtml = '<strong>Anh/Chị/Em:</strong> ';
    if (siblings.length > 0) {
      siblingsSectionHtml += siblings.map(s => s.name).join(', ');
    } else {
      siblingsSectionHtml += 'Chưa có';
    }

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h2>${member.name}</h2>
      <div class="modal-field">
        <div class="modal-field-label">Giới tính</div>
        <div class="modal-field-value">${member.gender}</div>
      </div>
      ${member.birthYear ? `
        <div class="modal-field">
          <div class="modal-field-label">Năm sinh</div>
          <div class="modal-field-value">${member.birthYear}</div>
        </div>
      ` : ''}
      <div class="modal-field">
        <div class="modal-field-label">Quan hệ</div>
        <div class="modal-field-value">
          <p>${parentsSectionHtml}</p>
          <p>${childrenSectionHtml}</p>
          <p>${siblingsSectionHtml}</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-delete" onclick="familyTree.deleteMember('${memberId}'); familyTree.render(); document.getElementById('modal').style.display = 'none';">Xóa Thành Viên</button>
      </div>
    `;

    document.getElementById('modal').style.display = 'block';
  }

  render() {
    this.updateParentSelectOptions();
    this.renderMembersList();
    this.renderTree();
  }
}

// Khởi tạo ứng dụng
const familyTree = new FamilyTree();
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
  const d = new Date(iso);
  const pad = n => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  // Không lấy giây để tránh nhảy giây khi edit
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

function renderTimeline(events) {
    const { startDate, endDate } = getStartEndDates();
    const numDays = countDays(startDate, endDate);

    timeline.innerHTML = "";
    timeline.style.width = (numDays * pixelsPerDay) + "px";

    // --- MONTH HEADER ---
    let currentMonth = -1;
    let monthStartIdx = 0;
    const monthHeaders = [];
    for (let i = 0; i <= numDays; i++) {
      const date = getDateByIndex(i, startDate);
      if (i === numDays || date.getMonth() !== currentMonth) {
        if (currentMonth !== -1) {
          // Tiêu đề tháng mới
          const monthHeader = document.createElement('div');
          monthHeader.className = 'month-header';
          monthHeader.style.left = (monthStartIdx * pixelsPerDay) + 'px';
          monthHeader.style.width = ((i - monthStartIdx) * pixelsPerDay) + 'px';
          monthHeader.innerText = `Tháng ${currentMonth+1} / ${date.getFullYear()}`;
          monthHeaders.push(monthHeader);
        }
        currentMonth = date.getMonth();
        monthStartIdx = i;
      }
    }

    // --- DAY MARKERS & LABELS ---
    const weekdayNames = ['CN','T2','T3','T4','T5','T6','T7'];
    for (let i = 0; i < numDays; i++) {
      const date = getDateByIndex(i, startDate);
      // Đường kẻ dọc cho mỗi ngày
      const dayMarker = document.createElement('div');
      dayMarker.className = 'day-marker';
      dayMarker.style.left = (i * pixelsPerDay) + 'px';
      timeline.appendChild(dayMarker);

      // Nhãn thứ/ngày
      const dayLabel = document.createElement('div');
      dayLabel.className = 'day-label';
      dayLabel.style.left = (i * pixelsPerDay - 20) + 'px';
      dayLabel.innerHTML = `<span class=\"day-of-week\">${weekdayNames[date.getDay()]}<\/span><span class=\"day-number\">${date.getDate()}<\/span>`;
      timeline.appendChild(dayLabel);
    }

    // Thêm tiêu đề tháng lên trên cùng (appendChild sau cùng để nằm trên các label khác)
    monthHeaders.forEach(header => timeline.appendChild(header));

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
      // Xử lý màu event-bar: ưu tiên mã hex, nếu không có thì dùng class màu cũ
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

      // Nội dung: tên + thời gian + nút xóa
      bar.innerHTML = `<div class="event-title">${ev.name}</div>
        <span class="time-info" style="margin-left:8px;font-size:0.9em;">
          ${startTime.getDate()}/${startTime.getMonth()+1} ${format24h(startTime)}
          - ${endTime.getDate()}/${endTime.getMonth()+1} ${format24h(endTime)}
        </span>
        <button class="delete-btn" onclick="(function(id){ return function(e){ e.stopPropagation(); if(confirm('Xóa sự kiện?')) deleteEvent(id); }} )('${ev.id}')(event)">Xóa</button>`;

      // Thêm sự kiện click để mở modal
      bar.addEventListener('click', function() {
        showEventModal(ev, startTime, endTime);
      });

      // Tooltip chuẩn
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
      };

      timeline.appendChild(bar);
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
      // Nếu đã kết thúc >24h thì chỉ ẩn khỏi giao diện, KHÔNG xóa khỏi Firestore
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
