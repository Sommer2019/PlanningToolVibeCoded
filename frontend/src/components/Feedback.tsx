export function Spinner({ label = "Loading…" }: { label?: string }) {
  return <p className="spinner">{label}</p>;
}

export function ErrorBanner({ message }: { message: string }) {
  return <p className="error-banner">{message}</p>;
}

export function Empty({ message }: { message: string }) {
  return <p className="empty">{message}</p>;
}
