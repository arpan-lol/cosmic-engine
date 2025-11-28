"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="ml-2 size-4 hover:cursor-pointer flex items-center justify-center"
      type="button"
    >
      {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" /> }
    </button>
  );
}