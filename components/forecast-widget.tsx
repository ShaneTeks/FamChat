"use client"

import type { ForecastWidget as ForecastWidgetType } from "@/lib/types"

interface ForecastWidgetProps {
  data: ForecastWidgetType
}

export function ForecastWidget({ data }: ForecastWidgetProps) {
  return (
    <div
      className="rounded-2xl p-6 max-w-md mx-auto mt-4 animate-scale-in"
      style={{
        background: data.background,
        backgroundImage: data.background,
      }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Current condition icon */}
        <img
          src={data.conditionImage}
          alt="Weather condition"
          className="w-16 h-16 object-contain"
        />

        {/* High and low temperatures */}
        <div className="flex items-center gap-3">
          <h2 className="text-4xl font-normal text-white/70">
            {data.lowTemperature}
          </h2>
          <h2 className="text-4xl font-normal text-white">
            {data.highTemperature}
          </h2>
        </div>

        {/* Location */}
        <p className="text-white text-lg font-medium">
          {data.location}
        </p>

        {/* Condition description */}
        <p className="text-white text-center text-sm opacity-90">
          {data.conditionDescription}
        </p>

        {/* 5-day forecast */}
        <div className="flex gap-6 mt-2">
          {data.forecast.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <img
                src={day.conditionImage}
                alt={`Day ${index + 1} weather`}
                className="w-10 h-10 object-contain"
              />
              <p className="text-white text-sm">{day.temperature}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
