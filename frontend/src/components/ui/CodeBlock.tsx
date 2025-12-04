export default function CodeBlock({ content }: { content: string }) {
    return (
      <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-auto border border-gray-700">
        {content}
      </pre>
    );
  }
  