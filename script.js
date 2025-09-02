// Số ngày/tháng demo
const months = [
  { name: "Tháng 8", days: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] },
  { name: "Tháng 9", days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] }
];

// Ngày trong tuần
const weekDays = ['CN', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7'];

// Sự kiện mẫu
const events = [
  {
    name: "Eternal Radiance on the Crown - Augusta Banner",
    color: "red",
    start: { month: 1, day: 2 },
    end: { month: 1, day: 17 },
    img: "https://static.wikia.nocookie.net/genshin-impact/images/6/68/Augusta.png",
    tag: "15d"
  },
  {
    name: "Thunderflare Dominion - Augusta Weapon Banner",
    color: "brown",
    start: { month: 1, day: 2 },
    end: { month: 1, day: 17 },
    img: "https://static.wikia.nocookie.net/genshin-impact/images/5/5c/Weapon_Augusta.png",
    tag: "15d"
  },
  {
    name: "When Silence Tolls - Carlotta Banner",
    color: "green",
    start: { month: 1, day: 2 },
    end: { month: 1, day: 17 },
    img: "https://static.wikia.nocookie.net/genshin-impact/images/2/22/Carlotta.png",
    tag: "15d"
  },
  {
    name: "The Last Dance: Carlotta Weapon Banner",
    color: "pink",
    start: { month: 1, day: 2 },
    end: { month: 1, day: 17 },
    img: "https://static.wikia.nocookie.net/genshin-impact/images/2/22/Carlotta.png",
    tag: "15d"
  },
  {
    name: "Till the Sea Turns Clear - Shorekeeper Banner",
    color: "blue",
    start: { month: 1, day: 2 },
    end: { month: 1, day: 17 },
    img: "https://static.wikia.nocookie.net/genshin-impact/images/1/1a/Shorekeeper.png",
    tag: "15d"
  },
  {
    name: "Stellar Symphony - Shorekeeper Weapon Banner",
    color: "purple",
    start: { month: 1, day: 2 },
    end: { month: 1, day: 17 },
    img: "https://static.wikia.nocookie.net/genshin-impact/images/1/1a/Shorekeeper.png",
    tag: "15d"
  },
];

// Render grid ngày
function renderDays() {
  const daysDiv = document.getElementById('timeline-days');
  daysDiv.innerHTML = '';
  months.forEach((m) => {
    m.days.forEach((day, idx) => {
      const weekDay = weekDays[(day + 2) % 7]; // Tạm gán ngày trong tuần
      daysDiv.innerHTML += `<div class="day-cell"><div>${weekDay}</div><strong>${day}</strong></div>`;
    });
  });
}
renderDays();

// Tính vị trí cho mỗi ngày
function getDayPos(monthIdx, dayIdx) {
  let pos = 0;
  for (let i = 0; i < monthIdx; i++) pos += months[i].days.length;
  pos += dayIdx;
  return pos;
}

// Render các event
function renderEvents() {
  const eventsDiv = document.getElementById('timeline-events');
  eventsDiv.innerHTML = '';
  events.forEach((event, i) => {
    // Tính vị trí
    const startMonthIdx = event.start.month - 1;
    const endMonthIdx = event.end.month - 1;
    const startDayIdx = months[startMonthIdx].days.indexOf(event.start.day);
    const endDayIdx = months[endMonthIdx].days.indexOf(event.end.day);
    const totalDays = months.reduce((sum, m) => sum + m.days.length, 0);
    const left = (getDayPos(startMonthIdx, startDayIdx) / totalDays) * 99.5;
    const width = ((getDayPos(endMonthIdx, endDayIdx) - getDayPos(startMonthIdx, startDayIdx) + 1) / totalDays) * 99.5;
    const top = 12 + i * 44;
    eventsDiv.innerHTML += `
      <div class="event-bar ${event.color}" style="left: ${left}%; width: ${width}%; top: ${top}px;">
        ${event.name}
        <span class="event-tag">${event.tag}</span>
        <img class="event-image" src="${event.img}" alt="">
      </div>
    `;
  });
}
renderEvents();

// Hiện dòng thời gian hiện tại
function renderCurrentTimeLine() {
  const eventsDiv = document.getElementById('timeline-events');
  const now = new Date();
  // Demo: giả sử ngày hiện tại là 2/9
  const curMonthIdx = 1;
  const curDayIdx = months[curMonthIdx].days.indexOf(2);
  const totalDays = months.reduce((sum, m) => sum + m.days.length, 0);
  const left = (getDayPos(curMonthIdx, curDayIdx) / totalDays) * 99.5;
  // Giờ demo
  const curTime = "20:23:47";
  const line = document.createElement('div');
  line.className = 'current-time-line';
  line.style.left = left + '%';
  line.innerHTML = `<div class="current-time-label" style="left: 50%;">${curTime}</div>`;
  eventsDiv.appendChild(line);
  // Gắn label
  const label = document.createElement('div');
  label.className = 'current-time-label';
  label.style.left = left + '%';
  label.innerText = curTime;
  eventsDiv.appendChild(label);
}
renderCurrentTimeLine();
