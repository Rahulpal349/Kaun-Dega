export default function Chit({ children, className = '' }) {
  return (
    <div className={`chit rounded-sm px-5 py-4 my-3 ${className}`}>
      {children}
    </div>
  );
}
