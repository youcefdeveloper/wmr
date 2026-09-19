import { useEffect, useState } from 'react'

export const useDynamicBackgroundClass = (color: string, theme: string) => {
  const [className, setClassName] = useState('')

  useEffect(() => {
    const dynamicClass = `bg-${theme}-${btoa(color).replace(/[^a-z0-9]/gi, '')}`
    const styleId = `style-${dynamicClass}`

    // Avoid duplicating style
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        .${dynamicClass} {
          background-color: ${color} !important;
        }
      `
      document.head.appendChild(style)
    }

    setClassName(dynamicClass)
  }, [color, theme])

  return className
}
