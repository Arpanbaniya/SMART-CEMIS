import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  icon?: React.ReactNode
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, required, icon, id, ...props }, ref) => {
    const inputId = id || `input-${React.useId()}`
    
    return (
      <div className="space-y-3">
        {label && (
          <Label 
            htmlFor={inputId} 
            className={cn(
              "text-base font-medium text-gray-900 dark:text-gray-100",
              error && "text-destructive",
              "dark:text-white"
            )}
          >
            {icon && <span className="h-5 w-5 mr-2 text-gray-800 dark:text-white">{icon}</span>}
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <Input
            id={inputId}
            className={cn(
              "relative transition-all duration-300 text-base font-medium",
              "focus:ring-2 focus:ring-primary/20",
              error && "border-destructive focus:ring-destructive/20",
              icon && "pl-12",
              "bg-white dark:bg-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400",
              className
            )}
            ref={ref}
            {...props}
          />
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-300">
              {icon}
            </div>
          )}
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
FormInput.displayName = "FormInput"

export { FormInput }
