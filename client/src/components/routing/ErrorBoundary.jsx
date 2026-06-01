import { Component } from 'react'
import { Button } from '@/components/ui/button'
import { COMMON_CONTENT, ERROR_BOUNDARY_CONTENT } from '@/constants/content'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-xl font-semibold">{ERROR_BOUNDARY_CONTENT.title}</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {ERROR_BOUNDARY_CONTENT.description}
          </p>
          <Button type="button" onClick={() => window.location.reload()}>
            {COMMON_CONTENT.refreshPage}
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
