"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex items-center justify-center p-2 rounded-lg hover:bg-(--color-surface-hover) transition-colors touch-manipulation active:scale-[0.95]"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-(--color-text-secondary)" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-(--color-text-secondary)" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
