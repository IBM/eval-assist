import { v4 as uuid } from 'uuid'

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { ToastNotification, ToastNotificationProps } from '@carbon/react'

import classes from './ToastProvider.module.scss'

interface ToastContextValue {
  addToast: (toast: Toast) => void
}

export const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
})

interface Props {
  children: ReactNode
}

interface Toast {
  /**
   * Provide a description for "close" icon button that can be read by screen readers
   */
  ariaLabel?: string
  caption?: string
  children?: ReactNode
  hideCloseButton?: boolean
  kind?: 'error' | 'info' | 'info-square' | 'success' | 'warning' | 'warning-alt'
  lowContrast?: boolean
  role?: 'alert' | 'log' | 'status'
  /** Provide a description for "status" icon that can be read by screen readers */
  statusIconDescription?: string
  subtitle?: string
  /** Specify an optional duration the notification should be closed in */
  timeout?: number
  title?: string
  apiError?: string
}

interface ToastWithKey extends ToastNotificationProps {
  key: string
}

export const ToastProvider = ({ children }: Props) => {
  const [toasts, setToasts] = useState<ToastWithKey[]>([])
  const [delayedToasts, setDelayedToasts] = useState<ToastWithKey[]>([])

  const addToast = useCallback(
    (toast: Toast) => {
      const key = uuid()
      const newToast: ToastWithKey = { ...toast, key }
      if (document.hasFocus()) {
        setToasts((existing) => {
          return [newToast, ...existing]
        })
      } else {
        // wait for for triggering the toast when the document has focus
        // add the toast to the delayed toasts
        setDelayedToasts((existing) => {
          return [newToast, ...existing]
        })
      }
    },
    [setToasts],
  )

  const onVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      setToasts((existing) => [...delayedToasts, ...existing])
      setDelayedToasts([])
    }
  }, [delayedToasts])

  useEffect(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [onVisibilityChange])

  const contextValue = useMemo(() => ({ addToast }), [addToast])

  return (
    <ToastContext.Provider value={contextValue}>
      <div className={classes.toasts}>
        {toasts.map(({ key, ...toast }) => (
          <ToastNotification
            onClose={() => {
              setToasts((existing) => existing.filter((toast) => toast.key !== key))
            }}
            key={key}
            {...toast}
          />
        ))}
      </div>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext(): ToastContextValue {
  return useContext(ToastContext)
}
