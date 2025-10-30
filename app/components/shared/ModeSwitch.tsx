import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeSwitch() {
    const { theme, setTheme } = useTheme()
  return (
    <div className="flex flex-col ">
      <Button variant="ghost" size="icon" className="rounded-full duration-500 relative"
        onClick={() => {
          setTheme(theme === "dark" ? "light" : "dark")
        }}>
        <Sun size={36} className="absolute rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
        <Moon size={36} className="absolute dark:rotate-0 dark:scale-100 rotate-90 scale-0 " />
      </Button>
    </div>
  )
}
