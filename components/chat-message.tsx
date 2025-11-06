"use client"

import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ImagePreviewCard } from "@/components/image-preview-card"
import { ImageLoading } from "@/components/image-loading"
import { WeatherWidget } from "@/components/weather-widget"
import { ForecastWidget } from "@/components/forecast-widget"
import { SpotifyWidget } from "@/components/spotify-widget"
import { Button } from "@/components/ui/button"
import { Volume2, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/contexts/settings-context"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const { toast } = useToast()
  const { settings } = useSettings()

  return (
    <div className={cn("flex mb-4 sm:mb-6", isUser && "justify-end")}>
      <div
        className={cn(
          "px-4 py-3 sm:px-5 sm:py-4 rounded-2xl max-w-[95%]",
          isUser
            ? "bg-(--color-user-message) text-(--color-text-primary)"
            : "bg-(--color-ai-message) text-(--color-text-primary) border border-(--color-border)",
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{message.content}</p>
        ) : (
          <>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    // Safe encoding for Unicode characters
                    const safeEncode = (str: string) => {
                      try {
                        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
                          return String.fromCharCode(parseInt(p1, 16));
                        }));
                      } catch {
                        // Fallback: use a hash of the content
                        let hash = 0;
                        for (let i = 0; i < str.length; i++) {
                          const char = str.charCodeAt(i);
                          hash = ((hash << 5) - hash) + char;
                          hash = hash & hash;
                        }
                        return Math.abs(hash).toString(36);
                      }
                    };
                    
                    // Safe localStorage setter with quota management
                    const safeSetItem = (key: string, value: string) => {
                      try {
                        localStorage.setItem(key, value);
                      } catch (e) {
                        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                          // Storage quota exceeded - clear old TTS cache
                          console.warn('localStorage quota exceeded, clearing old TTS cache...');
                          const keys = Object.keys(localStorage);
                          const ttsKeys = keys.filter(k => k.startsWith('tts_')).sort();
                          
                          // Remove oldest 50% of TTS cache entries
                          const keysToRemove = Math.ceil(ttsKeys.length / 2);
                          for (let i = 0; i < keysToRemove; i++) {
                            localStorage.removeItem(ttsKeys[i]);
                          }
                          
                          // Try again
                          try {
                            localStorage.setItem(key, value);
                          } catch (retryError) {
                            console.warn('Still unable to cache TTS audio after cleanup');
                          }
                        } else {
                          console.error('Failed to cache TTS audio:', e);
                        }
                      }
                    };
                    
                    const cacheKey = `tts_${settings.ttsProvider}_${settings.ttsProvider === 'cartesia' ? settings.cartesiaMode : ''}_${safeEncode(message.content).slice(0, 50)}`;
                    const cachedAudioData = localStorage.getItem(cacheKey);

                    if (cachedAudioData) {
                      // Recreate blob from cached base64 data
                      const binaryString = atob(cachedAudioData);
                      const bytes = new Uint8Array(binaryString.length);
                      for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                      }
                      const blob = new Blob([bytes], { type: 'audio/wav' });
                      const audio = new Audio(URL.createObjectURL(blob));
                      audio.play();
                      return;
                    }

                    if (settings.ttsProvider === 'groq') {
                      const response = await fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: message.content }),
                      });
                      if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        const bytes = new Uint8Array(arrayBuffer);
                        let binary = '';
                        for (let i = 0; i < bytes.length; i++) {
                          binary += String.fromCharCode(bytes[i]);
                        }
                        const base64Audio = btoa(binary);
                        safeSetItem(cacheKey, base64Audio); // Cache base64 data
                        
                        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
                        const audio = new Audio(URL.createObjectURL(blob));
                        audio.play();
                      } else {
                        console.error('TTS failed');
                      }
                    } else if (settings.ttsProvider === 'cartesia') {
                      if (settings.cartesiaMode === 'http') {
                        const response = await fetch('/api/cartesia-tts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: message.content }),
                        });
                        if (response.ok) {
                          const arrayBuffer = await response.arrayBuffer();
                          const bytes = new Uint8Array(arrayBuffer);
                          let binary = '';
                          for (let i = 0; i < bytes.length; i++) {
                            binary += String.fromCharCode(bytes[i]);
                          }
                          const base64Audio = btoa(binary);
                          safeSetItem(cacheKey, base64Audio); // Cache base64 data
                          
                          const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
                          const audio = new Audio(URL.createObjectURL(blob));
                          audio.play();
                        } else {
                          console.error('Cartesia TTS failed');
                        }
                      } else if (settings.cartesiaMode === 'websocket') {
                        // Cartesia WebSocket TTS
                        console.log('Connecting to Cartesia WebSocket...');
                        const ws = new WebSocket(`wss://api.cartesia.ai/tts/websocket?api_key=${encodeURIComponent(process.env.NEXT_PUBLIC_CARTESIA_API_KEY || '')}&cartesia_version=2024-06-10`);

                        ws.onopen = () => {
                          console.log('WebSocket connected, sending request...');
                          const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                          ws.send(JSON.stringify({
                            context_id: contextId,
                            model_id: 'sonic-3',
                            transcript: message.content,
                            voice: {
                              mode: 'id',
                              id: 'a0e99841-438c-4a64-b679-ae501e7d6091', // Example voice ID
                            },
                            output_format: {
                              container: 'raw',
                              encoding: 'pcm_s16le',
                              sample_rate: 44100,
                            },
                          }));
                        };

                        const audioChunks: Uint8Array[] = [];

                        ws.onmessage = (event) => {
                          console.log('WebSocket message received:', event.data.substring(0, 100));
                          const data = JSON.parse(event.data);
                          console.log('Parsed data:', data);
                          
                          if (data.type === 'error') {
                            console.error('Cartesia API error:', data.error);
                            toast({ title: `TTS Error: ${data.error}`, variant: "destructive" });
                            ws.close();
                            return;
                          }
                          
                          if (data.type === 'chunk' && data.data) {
                            // Decode base64 audio data
                            const binaryString = atob(data.data);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                              bytes[i] = binaryString.charCodeAt(i);
                            }
                            audioChunks.push(bytes);
                            console.log('Audio chunk received, total chunks:', audioChunks.length);
                          } else if (data.type === 'done' && audioChunks.length > 0) {
                            console.log('Done signal received, processing audio...');
                            // Combine all chunks
                            const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
                            console.log('Total audio data length:', totalLength);
                            const combinedBuffer = new Uint8Array(totalLength);
                            let offset = 0;
                            for (const chunk of audioChunks) {
                              combinedBuffer.set(chunk, offset);
                              offset += chunk.length;
                            }

                            // Create WAV header
                            const wavHeader = new ArrayBuffer(44);
                            const view = new DataView(wavHeader);
                            view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46);
                            view.setUint32(4, 36 + combinedBuffer.length, true);
                            view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45);
                            view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20);
                            view.setUint32(16, 16, true);
                            view.setUint16(20, 1, true);
                            view.setUint16(22, 1, true); // mono
                            view.setUint32(24, 44100, true);
                            view.setUint32(28, 44100 * 1 * 2, true); // 44.1kHz * 1 channel * 2 bytes per sample
                            view.setUint16(32, 2, true);
                            view.setUint16(34, 16, true);
                            view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61);
                            view.setUint32(40, combinedBuffer.length, true);

                            // Combine header and data
                            const wavBuffer = new Uint8Array(wavHeader.byteLength + combinedBuffer.length);
                            wavBuffer.set(new Uint8Array(wavHeader), 0);
                            wavBuffer.set(combinedBuffer, wavHeader.byteLength);

                            // Cache base64 audio data
                            let binary = '';
                            for (let i = 0; i < wavBuffer.length; i++) {
                              binary += String.fromCharCode(wavBuffer[i]);
                            }
                            const base64Audio = btoa(binary);
                            safeSetItem(cacheKey, base64Audio);
                            
                            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
                            const audio = new Audio(URL.createObjectURL(blob));
                            audio.play();
                            ws.close();
                          }
                        };

                        ws.onerror = (error) => {
                          console.error('WebSocket error:', error);
                          toast({ title: "WebSocket connection failed", variant: "destructive" });
                        };

                        ws.onclose = (event) => {
                          console.log('WebSocket closed:', event.code, event.reason);
                        };
                      }
                    }
                  } catch (error) {
                    console.error('TTS error:', error);
                  }
                }}
                className="h-8 w-8 p-0"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(message.content);
                  toast({ title: "Copied to clipboard!" });
                }}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {message.imageUrl && (
              <div className="mt-4">
                <ImagePreviewCard
                  src={message.imageUrl}
                  alt="AI Generated Image"
                  fileName={`ai-generated-${Date.now()}.jpg`}
                  width={message.imageWidth}
                  height={message.imageHeight}
                />
              </div>
            )}
            {message.isGeneratingImage && (
              <div className="mt-4">
                <ImageLoading />
              </div>
            )}
            {message.weatherWidget && (
              <div className="mt-4">
                <WeatherWidget data={message.weatherWidget} />
              </div>
            )}
            {message.forecastWidget && (
              <div className="mt-4">
                <ForecastWidget data={message.forecastWidget} />
              </div>
            )}
            {message.spotifyWidget && (
              <div className="mt-4">
                <SpotifyWidget data={message.spotifyWidget} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
