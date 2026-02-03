import { z } from 'zod'
import { EVENT_CATEGORIES } from './constants'

export const createEventSchema = z.object({
  title: z.string()
    .min(1, 'Event title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?&()]+$/, 'Title contains invalid characters'),
  
  description: z.string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .min(20, 'Please provide a more detailed description (at least 20 characters)')
    .max(2000, 'Description must be less than 2000 characters'),
  
  category: z.enum(EVENT_CATEGORIES, { 
    message: 'Please select a valid event category' 
  }),
  
  date: z.string()
    .min(1, 'Event date is required')
    .refine((date) => {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }, 'Event date cannot be in the past'),
  
  time: z.string()
    .min(1, 'Event time is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)')
    .refine((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours >= 6 && hours <= 22 // Reasonable event hours
    }, 'Event time should be between 6:00 AM and 10:00 PM'),
  
  location: z.string()
    .min(1, 'Location is required')
    .min(3, 'Location must be at least 3 characters')
    .max(200, 'Location must be less than 200 characters'),
  
  capacity: z.number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity cannot exceed 10,000'),
  
  imageUrl: z.string()
    .url('Please enter a valid URL')
    .regex(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i, 'Image URL must end with .jpg, .jpeg, .png, .gif, or .webp')
    .optional()
    .or(z.literal('')),
  
  mapUrl: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  
  isPaid: z.boolean().default(false),
  
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(999999, 'Price is too high')
    .refine((price) => {
      return Number.isInteger(price * 100) // Allow 2 decimal places
    }, 'Price can have maximum 2 decimal places')
    .optional()
    .default(0),
}).refine((data) => {
  // If event is paid, price must be greater than 0
  if (data.isPaid) {
    return data.price > 0
  }
  return true
}, {
  message: 'Paid events must have a price greater than 0',
  path: ['price']
}).refine((data) => {
  // Validate date/time combination is not in the past
  if (data.date && data.time) {
    const selectedDateTime = new Date(`${data.date}T${data.time}`)
    const now = new Date()
    return selectedDateTime > now
  }
  return true
}, {
  message: 'Event date and time cannot be in the past',
  path: ['date']
})

export type CreateEventFormData = z.infer<typeof createEventSchema>
