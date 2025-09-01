import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const daysOfWeek = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];
const months = ["Tháng 8", "Tháng 9"];
const regions = [
  { value: "asia", label: "Châu Á, Đông Nam Á, Đài Loan/ Hồng Kông/ Ma..." },
];

function getDateIndex(month: number, day: number) {
  if (month === 8) return day - 17;
  return 15 + (day - 1);
}

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState(regions[0].value);
  const [useLocalTime, setUseLocalTime] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    name: "",
    color: "bg-red-600",
    startMonth: 9,
    startDay: 2,
    endMonth: 9,
    endDay: 17,
    duration: 15,
  });

  useEffect(() => {
    const q = query(collection(db, "events"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  // CRUD
  const handleAddEvent = async () => {
    await addDoc(collection(db, "events"), {
      name: newEvent.name,
      color: newEvent.color,
      start: { month: Number(newEvent.startMonth), day: Number(newEvent.startDay) },
      end: { month: Number(newEvent.endMonth), day: Number(newEvent.endDay) },
      duration: Number(newEvent.duration),
      image: "",
    });
    setNewEvent({ ...newEvent, name: "" });
  };
  const handleUpdate = async (id: string) => {
    await updateDoc(doc(db, "events", id), { name: "Đã sửa!" });
  };
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "events", id));
  };

  // Timeline constants
  const daysCount = 15 + 23; // Tháng 8: 17-31, Tháng 9: 1-23
  const currentDateIdx = getDateIndex(9, 2);

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      <header className="p-6">
        <h1 className="text-4xl font-bold">Dòng thời gian sự kiện</h1>
        <p className="mt-2">
          Xem các sự kiện của Wuthering Waves theo giờ địa phương hoặc <a className="underline" href="#">giờ của máy chủ</a> khác.
        </p>
        <div className="flex items-center mt-4 gap-4">
          <select
            className="bg-gray-900 text-white p-2 rounded"
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
          >
            {regions.map(region => (
              <option key={region.value} value={region.value}>{region.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useLocalTime}
              onChange={e => setUseLocalTime(e.target.checked)}
            />
            <span>Hiện thời gian được điều chỉnh dựa trên giờ địa phương (Asia/Bangkok)</span>
          </label>
        </div>
        {/* Add event form */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <input
            className="bg-gray-800 text-white px-2 py-1 rounded"
            placeholder="Tên sự kiện"
            value={newEvent.name}
            onChange={e => setNewEvent(ev => ({ ...ev, name: e.target.value }))}
          />
          <select
            className="bg-gray-800 text-white px-2 py-1 rounded"
            value={newEvent.color}
            onChange={e => setNewEvent(ev => ({ ...ev, color: e.target.value }))}
          >
            <option value="bg-red-600">Đỏ</option>
            <option value="bg-yellow-700">Vàng</option>
            <option value="bg-gray-500">Xám</option>
            <option value="bg-pink-600">Hồng</option>
            <option value="bg-blue-700">Xanh dương</option>
            <option value="bg-indigo-500">Xanh tím</option>
          </select>
          <input
            type="number"
            className="bg-gray-800 text-white px-2 py-1 rounded w-20"
            value={newEvent.startMonth}
            onChange={e => setNewEvent(ev => ({ ...ev, startMonth: e.target.value }))}
            min={8} max={9}
            placeholder="Tháng bắt đầu"
          />
          <input
            type="number"
            className="bg-gray-800 text-white px-2 py-1 rounded w-20"
            value={newEvent.startDay}
            onChange={e => setNewEvent(ev => ({ ...ev, startDay: e.target.value }))}
            min={1} max={31}
            placeholder="Ngày bắt đầu"
          />
          <input
            type="number"
            className="bg-gray-800 text-white px-2 py-1 rounded w-20"
            value={newEvent.endMonth}
            onChange={e => setNewEvent(ev => ({ ...ev, endMonth: e.target.value }))}
            min={8} max={9}
            placeholder="Tháng kết thúc"
          />
          <input
            type="number"
            className="bg-gray-800 text-white px-2 py-1 rounded w-20"
            value={newEvent.endDay}
            onChange={e => setNewEvent(ev => ({ ...ev, endDay: e.target.value }))}
            min={1} max={31}
            placeholder="Ngày kết thúc"
          />
          <input
            type="number"
            className="bg-gray-800 text-white px-2 py-1 rounded w-16"
            value={newEvent.duration}
            onChange={e => setNewEvent(ev => ({ ...ev, duration: e.target.value }))}
            min={1}
            placeholder="Số ngày"
          />
          <button onClick={handleAddEvent} className="bg-green-600 px-4 py-2 rounded">Thêm sự kiện</button>
        </div>
      </header>
      {/* Timeline */}
      <div className="bg-gray-900 rounded-lg p-6 mx-6 my-4">
        <div className="flex gap-16 text-yellow-400 text-2xl font-bold mb-2">
          <span>Tháng 8</span>
          <span>Tháng 9</span>
        </div>
        <div className="flex mb-1">
          {[...Array(daysCount)].map((_, i) => {
            const dayIdx = (i + 5) % 7;
            return (
              <span key={i} className="w-10 text-center text-gray-400 text-xs">{daysOfWeek[dayIdx]}</span>
            );
          })}
        </div>
        <div className="flex mb-4">
          {[...Array(daysCount)].map((_, i) => {
            const date = i < 15 ? 17 + i : i - 15 + 1;
            return (
              <span key={i} className="w-10 text-center text-gray-300 text-sm">{date}</span>
            );
          })}
        </div>
        <div className="relative h-72">
          {/* Current time vertical line */}
          <div
            style={{ left: `${currentDateIdx * 40}px` }}
            className="absolute top-0 h-full w-0.5 bg-white z-10"
          >
            <span className="absolute -top-6 left-[-20px] bg-white text-black rounded px-2 py-1 text-xs font-semibold">
              20:23:47
            </span>
          </div>
          {/* Event bars */}
          {events.map((ev, idx) => {
            const startIdx = getDateIndex(ev.start.month, ev.start.day);
            const endIdx = getDateIndex(ev.end.month, ev.end.day);
            const width = (endIdx - startIdx + 1) * 40;
            return (
              <div
                key={ev.id}
                className={`absolute flex items-center ${ev.color} rounded-lg pl-4 pr-8 py-2`}
                style={{
                  top: 32 + idx * 48,
                  left: `${startIdx * 40}px`,
                  width: `${width}px`,
                  height: "40px",
                }}
              >
                <span className="font-bold">{ev.name}</span>
                <span className="ml-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
                  {ev.duration}d
                </span>
                <button
                  onClick={() => handleUpdate(ev.id)}
                  className="ml-2 px-2 py-1 bg-yellow-600 text-black rounded"
                >Sửa</button>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="ml-2 px-2 py-1 bg-red-600 text-white rounded"
                >Xóa</button>
              </div>
            );
          })}
        </div>
      </div>
      {loading && <div className="p-6">Đang tải sự kiện...</div>}
    </div>
  );
}