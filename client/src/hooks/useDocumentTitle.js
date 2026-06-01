import { useEffect } from 'react'

export const useDocumentTitle = (title) => {
  useEffect(() => {
    const base = 'Foodify'
    document.title = title ? `${title} | ${base}` : base
  }, [title])
}
