import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'

import { ToastNotification, ToastNotificationProps, usePrefix } from '@carbon/react'

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

  const addToast = useCallback(
    (toast: Toast) => {
      setToasts((existing) => {
        const key = uuid()

        return [{ ...toast, key }, ...existing]
      })
    },
    [setToasts],
  )

  const contextValue = useMemo(() => ({ addToast }), [addToast])
  return (
    <ToastContext.Provider value={contextValue}>
      <div className={cx(classes.toasts, classes.container)}>
        {toasts.map(({ key, ...toast }) => (
          <>
            {/* <ToastNotification
              key={key}
              {...toast}
              onClose={() => {
                setToasts((existing) => existing.filter((toast) => toast.key !== key))
              }}
            >
              <div className={`${toastPrefix}__subtitle`}>
                {subtitle && <div className={classes.subtitle}>{subtitle}</div>}
                {apiError && <div className={classes.apiError}>{apiError}</div>}
              </div>
              <div className={`${toastPrefix}__caption`}>{caption}</div>
            </ToastNotification> */}
            <ToastNotification
              onClose={() => {
                setToasts((existing) => existing.filter((toast) => toast.key !== key))
              }}
              key={key}
              {...toast}
            />
          </>
        ))}
      </div>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext(): ToastContextValue {
  return useContext(ToastContext)
}
