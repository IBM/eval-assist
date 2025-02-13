import { ChangeEvent, ComponentProps, memo, useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import { TextArea } from '@carbon/react'

export const ResponsiveTextArea = memo(function ResponsiveTextArea({
  value,
  onChange,
  ...rest
}: ComponentProps<typeof TextArea>) {
  const ref = useRef<HTMLTextAreaElement>()

  const updateSize = () => {
    const e = ref.current
    if (e) {
      e.style.height = '0px'
      const scrollHeight = e.scrollHeight
      e.style.height = scrollHeight + 1 + 'px'
    }
  }

  useLayoutEffect(() => {
    // window.addEventListener('resize', updateSize)
    updateSize()
    // return () => window.removeEventListener('resize', updateSize)
  })

  const _onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    updateSize()
    onChange && onChange(e)
  }

  return <TextArea value={value} {...rest} onChange={_onChange} ref={ref} />
})
