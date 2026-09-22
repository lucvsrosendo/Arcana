import { Component, type ErrorInfo, type ReactNode } from "react";
import { uiCopy } from "../data/i18n";
import { Button } from "./ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    const language =
      typeof document !== "undefined" && document.documentElement.lang.startsWith("en")
        ? "en"
        : typeof document !== "undefined" && document.documentElement.lang.startsWith("es")
          ? "es"
          : "pt";
    const copy = uiCopy[language];

    if (this.state.hasError) {
      return (
        <div className="theme-root">
          <div className="app-shell mx-auto flex min-h-screen w-full flex-col items-center justify-center">
            <div className="error-boundary-panel">
              <div
                className="zen-accent-bar error-boundary-accent"
                aria-hidden="true"
              />
              <p className="error-boundary-kicker">{copy.errorUnexpected}</p>
              <h1 className="error-boundary-title">{copy.errorRenderTitle}</h1>
              <p className="error-boundary-body">{copy.errorRenderBody}</p>
              {this.state.message && import.meta.env.DEV ? (
                <code className="error-boundary-detail">{this.state.message}</code>
              ) : null}
              <Button
                type="button"
                onClick={this.handleReload}
                className="mx-auto"
              >
                {copy.errorReload}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
