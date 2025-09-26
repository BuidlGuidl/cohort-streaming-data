"use client";

import { useState } from "react";
import { useDateStore } from "~~/services/store/dateStore";

export const DateRangeDropdown = () => {
  const { startDate, endDate, currentPreset, setPreset, setCustomRange } = useDateStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(startDate);
  const [customEndDate, setCustomEndDate] = useState(endDate);

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

  const openModal = () => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Dropdown Button */}
      <div className="dropdown dropdown-end">
        <button
          className="btn btn-outline btn-primary normal-case font-semibold text-base px-6 py-3 h-auto min-h-0"
          onClick={openModal}
        >
          <span className="text-xl mr-2">📅</span>
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-70">Date Range</span>
            <span className="text-sm font-bold">{getCurrentLabel()}</span>
          </div>
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <>
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl p-0 bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border-0">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-secondary text-primary-content p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">📅</div>
                    <div>
                      <h3 className="text-2xl font-bold">Select Date Range</h3>
                      <p className="text-sm opacity-90">Choose your data analysis period</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-circle text-white hover:bg-white/20"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Current Selection Display */}
                <div className="bg-gradient-to-r from-success/10 to-info/10 border border-success/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-success">📊 CURRENT SELECTION</div>
                      <div className="text-xl font-bold mt-1">
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
                    <div className="text-right">
                      <div className="text-sm text-base-content/70">Days</div>
                      <div className="text-2xl font-bold text-info">
                        {Math.ceil(
                          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <h4 className="text-lg font-bold mb-4 flex items-center">
                    <span className="mr-2">⚡</span>
                    Quick Select
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {presets.slice(0, 6).map(preset => (
                      <button
                        key={preset.id}
                        className={`group relative overflow-hidden rounded-xl p-4 text-center transition-all duration-200 transform hover:scale-105 ${
                          currentPreset === preset.id
                            ? "bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg"
                            : "bg-base-200 hover:bg-base-300 border-2 border-transparent hover:border-primary/30"
                        }`}
                        onClick={() => handlePresetSelect(preset.id)}
                      >
                        <div className="relative z-10">
                          <div className="text-lg font-bold">{preset.label}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {preset.id === "2025" ? "Full Year" : "Last " + preset.label.toLowerCase()}
                          </div>
                        </div>
                        {currentPreset === preset.id && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                        )}
                      </button>
                    ))}
                    {/* Year 2025 spans full width */}
                    <button
                      className={`group relative overflow-hidden rounded-xl p-4 text-center transition-all duration-200 transform hover:scale-105 col-span-3 ${
                        currentPreset === "2025"
                          ? "bg-gradient-to-r from-accent to-warning text-accent-content shadow-lg"
                          : "bg-base-200 hover:bg-base-300 border-2 border-transparent hover:border-accent/30"
                      }`}
                      onClick={() => handlePresetSelect("2025")}
                    >
                      <div className="relative z-10">
                        <div className="text-xl font-bold">🗓️ Year 2025</div>
                        <div className="text-sm opacity-70 mt-1">Complete year analysis</div>
                      </div>
                      {currentPreset === "2025" && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Custom Range */}
                <div>
                  <h4 className="text-lg font-bold mb-4 flex items-center">
                    <span className="mr-2">🎯</span>
                    Custom Range
                  </h4>
                  <div className="bg-gradient-to-br from-base-200 to-base-300 p-6 rounded-xl border border-base-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-base-content/80">🚀 Start Date</label>
                        <input
                          type="date"
                          className="input input-bordered w-full bg-base-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                          value={customStartDate}
                          onChange={e => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-base-content/80">🏁 End Date</label>
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
                      className="btn btn-primary w-full bg-gradient-to-r from-primary to-secondary border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      onClick={handleCustomApply}
                      disabled={!customStartDate || !customEndDate || customStartDate > customEndDate}
                    >
                      <span className="mr-2">✨</span>
                      Apply Custom Range
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
        </>
      )}
    </>
  );
};
