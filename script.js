// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Helper: Tính vị trí event trên timeline
function getDateIndex(month, day) { return month === 8 ? day - 17 : 15 + (day - 1); }
const daysCount = 15 + 23;

// Render timeline
function renderTimeline(events) {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = "";
  events.forEach((ev, idx) => {
    const startIdx = getDateIndex(ev.start.month, ev.start.day);
    const endIdx = getDateIndex(ev.end.month, ev.end.day);
    const width = (endIdx - startIdx + 1) * 40;
    const bar = document.createElement('div');
    bar.className = `event-bar ${ev.color}`;
    bar.style.top = (32 + idx * 44) + "px";
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