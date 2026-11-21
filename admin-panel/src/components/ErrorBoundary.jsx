import React, { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button, Card } from './ui'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo?.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20 p-8 my-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
              <AlertTriangle className="size-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Something went wrong</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                This component encountered an unexpected error. You can attempt to reload it or refresh the browser.
              </p>
              {this.state.error?.message ? (
                <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-rose-300 font-mono">
                  {this.state.error.message}
                </pre>
              ) : null}
              <div className="pt-2">
                <Button type="button" variant="primary" onClick={this.handleReset} icon={RefreshCw}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}
