export default function Card({ className = "", children }) {
  return (
    <div className={`vscode-card p-6 ${className}`}>
      {children}
    </div>
  );
}
