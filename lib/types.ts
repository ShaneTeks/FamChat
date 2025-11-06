export interface WeatherWidget {
  location: string
  background: string
  conditionImage: string
  conditionDescription: string
  temperature: string
}

export interface ForecastItem {
  conditionImage: string
  temperature: string
}

export interface ForecastWidget {
  background: string
  conditionImage: string
  lowTemperature: string
  highTemperature: string
  location: string
  conditionDescription: string
  forecast: ForecastItem[]
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  imageUrl?: string
  imageWidth?: number
  imageHeight?: number
  isGeneratingImage?: boolean
  weatherWidget?: WeatherWidget
  forecastWidget?: ForecastWidget
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  isFavorite?: boolean
  syncEnabled?: boolean
  lastSyncedAt?: number
}
