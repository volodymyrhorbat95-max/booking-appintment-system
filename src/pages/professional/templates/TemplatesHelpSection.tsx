const TemplatesHelpSection = () => {
  return (
    <div className="mt-6 rounded-lg bg-blue-50 p-4 fade-up-slow">
      <h3 className="text-sm font-medium text-blue-900 fade-down-fast">Importante</h3>
      <ul className="mt-2 space-y-1 text-sm text-blue-700">
        <li className="flex items-start gap-2 fade-right-fast">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
          <span>Los mensajes de WhatsApp tienen un límite de 1024 caracteres</span>
        </li>
        <li className="flex items-start gap-2 fade-left-fast">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
          <span>Las variables se reemplazan automáticamente con los datos de cada cita</span>
        </li>
        <li className="flex items-start gap-2 fade-right-normal">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
          <span>Mantén los mensajes claros y profesionales</span>
        </li>
      </ul>
    </div>
  );
};

export default TemplatesHelpSection;
