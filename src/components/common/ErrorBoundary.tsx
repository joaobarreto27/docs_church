import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-church-parchment flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-church-sand p-6 text-center shadow-sheet space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-title text-base font-bold uppercase tracking-wide text-church-charcoal">
              Aviso do Sistema
            </h1>
            <p className="text-xs font-sans text-church-muted leading-relaxed">
              Ocorreu uma falha temporária ao renderizar o painel no navegador deste dispositivo.
            </p>
            {this.state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] font-mono text-red-800 text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Recarregar Painel
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
