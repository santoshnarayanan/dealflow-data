interface Props {
  data: any;
}

export default function JsonViewer({ data }: Props) {
  return (
    <pre className="bg-gray-900 text-green-300 text-sm p-4 rounded-lg overflow-x-auto shadow-inner border border-gray-700">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
