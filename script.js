import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventCol = collection(db, "events");

const eventForm = document.getElementById("event-form");
const eventList = document.getElementById("event-list");

// Lắng nghe sự kiện submit form để thêm sự kiện mới
eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eventName = document.getElementById("event-name").value;
    const eventTime = document.getElementById("event-time").value;
    const now = new Date();
    const [hours, minutes] = eventTime.split(":");
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    // Lưu sự kiện vào Firestore
    try {
        await addDoc(eventCol, {
            name: eventName,
            time: scheduledTime.toISOString(),
            createdAt: new Date().toISOString()
        });
        eventForm.reset();
        alert("Sự kiện đã được thêm thành công!");
    } catch (error) {
        console.error("Lỗi khi thêm sự kiện: ", error);
        alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
});

// Hiển thị sự kiện từ Firestore và cập nhật theo thời gian thực
onSnapshot(eventCol, (snapshot) => {
    const events = [];
    snapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
    });
    renderEvents(events);
});

function renderEvents(events) {
    eventList.innerHTML = "";
    const now = new Date();
    events.sort((a, b) => new Date(a.time) - new Date(b.time));

    events.forEach(event => {
        const scheduledTime = new Date(event.time);
        
        // Bỏ qua các sự kiện đã qua
        if (scheduledTime < now) return;

        const listItem = document.createElement("li");
        listItem.classList.add("event-item");

        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("event-details");
        detailsDiv.innerHTML = `
            <h3>${event.name}</h3>
            <p>Vào lúc: ${scheduledTime.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</p>
        `;
        listItem.appendChild(detailsDiv);

        // Hiển thị đồng hồ đếm ngược
        const countdownSpan = document.createElement("span");
        countdownSpan.classList.add("countdown");
        listItem.appendChild(countdownSpan);

        // Nút xóa sự kiện
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Xóa";
        deleteButton.onclick = () => deleteEvent(event.id);
        listItem.appendChild(deleteButton);
        
        eventList.appendChild(listItem);
        
        // Cập nhật đồng hồ đếm ngược mỗi giây
        const updateCountdown = setInterval(() => {
            const timeRemaining = scheduledTime - new Date();
            if (timeRemaining <= 0) {
                countdownSpan.textContent = "Đã diễn ra!";
                clearInterval(updateCountdown);
                listItem.style.opacity = 0.5; // Làm mờ sự kiện đã qua
            } else {
                const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
                const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                countdownSpan.textContent = `Còn lại: ${hours}h ${minutes}m ${seconds}s`;
            }
        }, 1000);
    });
}

// Xóa sự kiện khỏi Firestore
async function deleteEvent(id) {
    if (confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) {
        try {
            await deleteDoc(doc(db, "events", id));
            alert("Sự kiện đã được xóa.");
        } catch (error) {
            console.error("Lỗi khi xóa sự kiện: ", error);
            alert("Có lỗi xảy ra khi xóa.");
        }
    }
}