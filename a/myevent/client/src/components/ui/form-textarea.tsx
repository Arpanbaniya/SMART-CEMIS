import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  required?: boolean
  icon?: React.ReactNode
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, label, error, required, icon, id, ...props }, ref) => {
    const textareaId = id || `textarea-${React.useId()}`
    
    return (
      <div className="space-y-3">
        {label && (
          <Label 
            htmlFor={textareaId} 
            className={cn(
              "text-base font-normal text-gray-900 dark:text-gray-100",
              error && "text-destructive",
              "dark:text-white"
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
          
          <Textarea
            id={textareaId}
            className={cn(
              "relative transition-all duration-300 resize-none text-base font-normal",
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
            <div className="absolute left-4 top-4 text-gray-800 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-300">
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
FormTextarea.displayName = "FormTextarea"

export { FormTextarea }
