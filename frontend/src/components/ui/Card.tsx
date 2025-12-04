interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
  }
  
  export default function Card({ title, children, className = "" }: CardProps) {
    return (
      <div className={`bg-white shadow rounded-xl p-5 border border-gray-200 ${className}`}>
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        {children}
      </div>
    );
  }
  