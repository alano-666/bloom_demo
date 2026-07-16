import { useState } from "react";

export function WheelTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [hour, minute] = value.split(":");
  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="grid grid-cols-2 gap-3">
      <select value={hour} onChange={(event) => onChange(`${event.target.value}:${minute}`)} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]">
        {hours.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <select value={minute} onChange={(event) => onChange(`${hour}:${event.target.value}`)} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]">
        {minutes.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}
