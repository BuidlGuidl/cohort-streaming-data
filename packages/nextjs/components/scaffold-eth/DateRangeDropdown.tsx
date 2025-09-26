"use client";

import { useEffect, useRef, useState } from "react";
import { useDateStore } from "~~/services/store/dateStore";

export const DateRangeDropdown = () => {
  const { startDate, endDate, currentPreset, setPreset, setCustomRange } = useDateStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(startDate);
  const [customEndDate, setCustomEndDate] = useState(endDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const presets = [
    { id: "1m", label: "1 Month" },
    { id: "2m", label: "2 Months" },
    { id: "3m", label: "3 Months" },
    { id: "6m", label: "6 Months" },
    { id: "9m", label: "9 Months" },
    { id: "1y", label: "1 Year" },
    { id: "2025", label: "Year 2025" },
  ];

  const getCurrentLabel = () => {
    if (currentPreset) {
      const preset = presets.find(p => p.id === currentPreset);
      return preset ? preset.label : "Custom Range";
    }
    return "Custom Range";
  };

  const handlePresetSelect = (presetId: string) => {
    setPreset(presetId);
    setIsModalOpen(false);
  };

  const handleCustomApply = () => {
    setCustomRange(customStartDate, customEndDate);
    setIsModalOpen(false);
  };

  const toggleModal = () => {
    if (isModalOpen) {
      setIsModalOpen(false);
    } else {
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
      setIsModalOpen(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  return (
    <>
      {/* Professional Date Range Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="group flex items-center gap-3 px-4 py-3 bg-base-100 hover:bg-base-200 border border-base-300 hover:border-primary/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          onClick={toggleModal}
        >
          {/* Calendar Icon */}
          <div className="flex-shrink-0 w-5 h-5 text-primary group-hover:text-primary/80 transition-colors">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Date Range</span>
            <span className="text-sm font-semibold text-base-content truncate">{getCurrentLabel()}</span>
          </div>

          {/* Dropdown Arrow */}
          <div className="flex-shrink-0 w-4 h-4 text-base-content/40 group-hover:text-base-content/60 transition-colors">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isModalOpen && (
          <div className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-base-100 border border-base-300 rounded-lg shadow-xl z-50">
            <div className="p-6 space-y-6">
              {/* Current Selection Display */}
              <div className="bg-base-200 border border-base-300 rounded-lg p-4">
                <div className="text-sm font-medium text-base-content/60 uppercase tracking-wide mb-2">
                  Current Selection (
                  {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))}{" "}
                  Days)
                </div>
                <div className="text-lg font-semibold text-base-content">
                  {new Date(startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  <span className="mx-2 text-base-content/50">→</span>
                  {new Date(endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-base-content">Quick Select</h4>
                <div className="grid grid-cols-3 gap-3">
                  {presets.slice(0, 6).map(preset => (
                    <button
                      key={preset.id}
                      className={`group relative rounded-lg p-4 text-center transition-all duration-200 border ${
                        currentPreset === preset.id
                          ? "bg-primary text-primary-content border-primary shadow-md"
                          : "bg-base-100 hover:bg-base-200 border-base-300 hover:border-primary/50"
                      }`}
                      onClick={() => handlePresetSelect(preset.id)}
                    >
                      <div className="text-sm font-semibold">{preset.label}</div>
                    </button>
                  ))}
                  {/* Year 2025 spans full width */}
                  <button
                    className={`group relative rounded-lg p-4 text-center transition-all duration-200 border col-span-3 ${
                      currentPreset === "2025"
                        ? "bg-accent text-accent-content border-accent shadow-md"
                        : "bg-base-100 hover:bg-base-200 border-base-300 hover:border-accent/50"
                    }`}
                    onClick={() => handlePresetSelect("2025")}
                  >
                    <div className="text-lg font-semibold">2025</div>
                  </button>
                </div>
              </div>

              {/* Custom Range */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-base-content">Custom Range</h4>
                <div className="bg-base-200 p-5 rounded-lg border border-base-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-base-content">Start Date</label>
                      <input
                        type="date"
                        className="input input-bordered w-full bg-base-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-base-content">End Date</label>
                      <input
                        type="date"
                        className="input input-bordered w-full bg-base-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        min={customStartDate}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleCustomApply}
                    disabled={!customStartDate || !customEndDate || customStartDate > customEndDate}
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
