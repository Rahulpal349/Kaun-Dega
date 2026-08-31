export default function Chit({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 my-3 ${className}`}>
      {children}
    </div>
  );
}
