import type { MessageTemplateVariable } from '../../../types';

interface VariablesReferenceProps {
  variables: MessageTemplateVariable[];
}

const VariablesReference = ({ variables }: VariablesReferenceProps) => {
  return (
    <div className="mt-6 rounded-lg bg-gray-50 p-4 zoom-in-normal">
      <h3 className="text-sm font-medium text-gray-900 fade-down-fast">Variables disponibles</h3>
      <div className="mt-3 space-y-2">
        {variables.map((variable, index) => (
          <div
            key={variable.key}
            className={`flex items-start gap-2 text-sm ${
              index % 2 === 0 ? 'fade-right-fast' : 'fade-left-fast'
            }`}
          >
            <code className="rounded bg-gray-200 px-2 py-0.5 font-mono text-xs zoom-in-fast">
              {variable.key}
            </code>
            <span className="text-gray-600">{variable.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariablesReference;
