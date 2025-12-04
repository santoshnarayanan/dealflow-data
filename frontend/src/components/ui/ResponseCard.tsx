export default function ResponseCard({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
        <div className="text-sm">{children}</div>
      </div>
    );
  }
  