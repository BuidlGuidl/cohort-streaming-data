"use client";

import { useDateStore } from "~~/services/store/dateStore";

interface DateRangeSelectorProps {
  className?: string;
}

export const DateRangeSelector = ({ className = "" }: DateRangeSelectorProps) => {
  const { startDate, endDate, setDateRange, setPreset } = useDateStore();

  const presets = [
    { id: "1m", label: "1M", tooltip: "Last 1 month" },
    { id: "2m", label: "2M", tooltip: "Last 2 months" },
    { id: "3m", label: "3M", tooltip: "Last 3 months" },
    { id: "6m", label: "6M", tooltip: "Last 6 months" },
    { id: "9m", label: "9M", tooltip: "Last 9 months" },
    { id: "1y", label: "1Y", tooltip: "Last 1 year" },
    { id: "2025", label: "2025", tooltip: "Year 2025" },
  ];

  return (
    <div className={`card bg-base-100 shadow-sm border border-base-300 ${className}`}>
      <div className="card-body p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">Start Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={startDate}
                onChange={e => setDateRange(e.target.value, endDate)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">End Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={endDate}
                onChange={e => setDateRange(startDate, e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <span className="text-xs font-medium opacity-70 whitespace-nowrap">Quick Select:</span>
            <div className="flex flex-wrap gap-1">
              {presets.map(preset => (
                <div key={preset.id} className="tooltip tooltip-bottom" data-tip={preset.tooltip}>
                  <button className="btn btn-xs btn-outline" onClick={() => setPreset(preset.id)}>
                    {preset.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
