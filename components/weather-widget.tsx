"use client"

import type { WeatherWidget as WeatherWidgetType } from "@/lib/types"

interface WeatherWidgetProps {
  data: WeatherWidgetType
}

export function WeatherWidget({ data }: WeatherWidgetProps) {
  return (
    <div
      className="rounded-2xl p-6 max-w-sm mx-auto mt-4 animate-scale-in"
      style={{
        background: data.background,
        backgroundImage: data.background,
      }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Weather icon and temperature */}
        <div className="flex items-center gap-4">
          <img
            src={data.conditionImage}
            alt="Weather condition"
            className="w-20 h-20 object-contain"
          />
          <h2 className="text-5xl font-normal text-white">
            {data.temperature}
          </h2>
        </div>

        {/* Location and description */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-white text-lg font-medium">
            {data.location}
          </p>
          <p className="text-white text-center text-sm opacity-90">
            {data.conditionDescription}
          </p>
        </div>
      </div>
    </div>
  )
}
