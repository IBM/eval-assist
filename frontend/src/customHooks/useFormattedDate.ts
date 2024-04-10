import { useEffect, useState } from 'react'

export const useFormattedDate = (date: Date) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null)

  useEffect(
    () =>
      setFormattedDate(
        date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ),
    [date],
  )

  return formattedDate
}
