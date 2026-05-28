import React from "react";

const legendItems = [
  { label: "Available", colorClass: "bg-brand-cyan" },
  { label: "On Hold", colorClass: "bg-brand-yellow" },
  { label: "Sold", colorClass: "bg-brand-red" },
  { label: "Clubhouse", colorClass: "bg-brand-purple" },
  { label: "Landscaping", colorClass: "bg-brand-blue" },
];

export default function Legend() {
  return (
    <div className="fixed top-0 right-0 m-4 lg:m-6 p-3 bg-gray-900/40 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl">
      <div className="grid grid-cols-1 gap-2">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${item.colorClass}`}></div>
            <span className="text-gray-300 text-xs">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
