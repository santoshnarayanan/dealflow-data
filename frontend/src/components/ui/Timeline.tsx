interface TimelineStep {
  step?: string;
  route?: string;
  reason?: string;
  recordCount?: number;
  totalCount?: number;
  error?: string | null;
}

interface TimelineProps {
  steps: TimelineStep[];
}
  
  export default function Timeline({ steps }: TimelineProps) {
    return (
      <div className="border-l-2 border-gray-300 pl-4 space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="relative">
            {/* Dot */}
            <div className="w-3 h-3 bg-blue-600 rounded-full absolute -left-[9px] top-1"></div>
  
            <div className="bg-white shadow p-3 rounded border">
              <h4 className="font-semibold text-sm text-gray-800">
                {step.step}
              </h4>
  
              {step.route && (
                <p className="text-xs mt-1">
                  <strong>Route:</strong> {step.route}
                </p>
              )}
  
              {step.reason && (
                <p className="text-xs mt-1 text-gray-700">
                  <strong>Reason:</strong> {step.reason}
                </p>
              )}
  
              {step.recordCount !== undefined && (
                <p className="text-xs mt-1">
                  <strong>Records:</strong> {step.recordCount}
                </p>
              )}
  
              {step.totalCount !== undefined && (
                <p className="text-xs mt-1">
                  <strong>Vector Matches:</strong> {step.totalCount}
                </p>
              )}
  
              {step.error && (
                <p className="text-xs mt-1 text-red-600">
                  <strong>Error:</strong> {step.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  