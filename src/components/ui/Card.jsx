export default function Card({ className = "", children }) {
  return <div className={`vscode-card p-6 md:p-8 ${className}`}>{children}</div>;
}
