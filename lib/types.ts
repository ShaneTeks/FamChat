export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  imageUrl?: string
  imageWidth?: number
  imageHeight?: number
  isGeneratingImage?: boolean
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  isFavorite?: boolean
}
