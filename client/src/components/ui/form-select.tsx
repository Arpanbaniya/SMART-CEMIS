import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface FormSelectProps {
  label?: string
  error?: string
  required?: boolean
  icon?: React.ReactNode
  placeholder?: string
  options: { value: string; label: string; icon?: React.ReactNode }[]
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  id?: string
}

const FormSelect = React.forwardRef<HTMLDivElement, FormSelectProps>(
  ({ 
    label, 
    error, 
    required, 
    icon, 
    placeholder = "Select an option", 
    options, 
    value, 
    onValueChange, 
    className,
    id 
  }, ref) => {
    const selectId = id || `select-${React.useId()}`
    
    return (
      <div className="space-y-3" ref={ref}>
        {label && (
          <Label 
            htmlFor={selectId}
            className={cn(
              "text-base font-normal flex items-center gap-3 tracking-tight",
              error && "text-destructive",
              "text-black dark:text-white"
            )}
          >
            {icon && <span className="h-5 w-5">{icon}</span>}
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger 
              id={selectId}
              className={cn(
                "relative transition-all duration-300 text-base font-medium",
                "focus:ring-2 focus:ring-primary/20",
                icon && "pl-12",
                error && "border-destructive focus:ring-destructive/20",
                "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 focus:-translate-y-1 focus:shadow-2xl focus:shadow-purple-500/20 text-black dark:text-white",
                className
              )}
            >
              {icon && (
                <div className="absolute left-4 text-gray-800 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-300">
                  {icon}
                </div>
              )}
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl">
              {options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="text-base font-medium text-black dark:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-200"
                >
                  {option.icon && <span className="h-4 w-4 mr-3">{option.icon}</span>}
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>
    )
  }
)
FormSelect.displayName = "FormSelect"

export { FormSelect }
