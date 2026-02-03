import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveFormProps {
  children: React.ReactNode
  className?: string
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3
}

interface ResponsiveSectionProps {
  children: React.ReactNode
  title: string
  stepNumber?: number
  className?: string
}

const ResponsiveForm: React.FC<ResponsiveFormProps> = ({ children, className }) => {
  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {children}
    </div>
  )
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  className, 
  cols = 1 
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  return (
    <div className={cn(
      'grid gap-4 sm:gap-6',
      gridClasses[cols],
      className
    )}>
      {children}
    </div>
  )
}

const ResponsiveSection: React.FC<ResponsiveSectionProps> = ({ 
  children, 
  title, 
  stepNumber,
  className 
}) => {
  const stepColors = [
    'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25',
    'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25', 
    'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25',
    'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25',
    'bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25'
  ]

  const stepColor = stepNumber ? stepColors[(stepNumber - 1) % stepColors.length] : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'

  return (
    <div className={cn('space-y-6 sm:space-y-8', className)}>
      <div className="flex items-center">
        {stepNumber && (
          <div className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mr-4 sm:mr-4 transform hover:scale-110 transition-all duration-300',
            stepColor
          )}>
            <span className="text-sm sm:text-base font-medium text-white dark:text-gray-300">
              {stepNumber}
            </span>
          </div>
        )}
        <h2 className="text-xl sm:text-2xl font-normal text-gray-900 dark:text-gray-100 tracking-tight">
          {title}
        </h2>
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl"></div>
        <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ResponsiveActionsProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveActions: React.FC<ResponsiveActionsProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-200',
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline'
  loading?: boolean
  children: React.ReactNode
  asChild?: boolean
}

const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({ 
  variant = 'primary',
  loading = false,
  children,
  className,
  disabled,
  asChild = false,
  ...props 
}) => {
  const baseClasses = 'w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center gap-2 relative overflow-hidden group'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:translate-y-0',
    outline: 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-600/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0'
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(baseClasses, variantClasses[variant], className, children.props.className),
      disabled: disabled || loading
    })
  }

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

interface ResponsiveHelpProps {
  title: string
  items: string[]
  className?: string
}

const ResponsiveHelp: React.FC<ResponsiveHelpProps> = ({ 
  title, 
  items, 
  className 
}) => {
  return (
    <div className={cn(
      'mt-6 sm:mt-8 p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800',
      className
    )}>
      <div className="flex items-start space-x-3">
        <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
            {title}
          </h3>
          <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
            {items.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export {
  ResponsiveForm,
  ResponsiveGrid,
  ResponsiveSection,
  ResponsiveActions,
  ResponsiveButton,
  ResponsiveHelp
}
