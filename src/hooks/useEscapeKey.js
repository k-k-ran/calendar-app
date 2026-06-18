import { useEffect } from 'react'

// Calls `handler` whenever the Escape key is pressed while mounted.
// Used by modals so they can be dismissed with the keyboard.
export default function useEscapeKey(handler) {
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') handler() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handler])
}
