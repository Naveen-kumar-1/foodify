import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const PageWrapper = ({ title, children }) => {
  useDocumentTitle(title)
  return children
}

export default PageWrapper
