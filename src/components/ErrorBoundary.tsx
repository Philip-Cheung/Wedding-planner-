import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
          <h1 className="text-xl font-semibold text-destructive mb-2">Something went wrong</h1>
          <pre className="text-sm text-muted-foreground overflow-auto max-w-2xl p-4 rounded-lg bg-muted">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
