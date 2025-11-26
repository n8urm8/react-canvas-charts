import React from 'react';

type InteractiveChartCodePreviewProps = {
  code: string;
};

export const InteractiveChartCodePreview: React.FC<InteractiveChartCodePreviewProps> = ({
  code,
}) => {
  const handleCopy = async () => {
    try {
  await navigator.clipboard.writeText(code);
  alert('Code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="mt-4 bg-gray-900 text-gray-100 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Generated Code Preview</h3>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Copy
        </button>
      </div>
      <pre className="text-left font-mono text-xs md:text-sm whitespace-pre overflow-x-auto bg-gray-950 rounded p-3 border border-gray-800">
        <code className="text-left w-full">{code}</code>
      </pre>
    </div>
  );
};
