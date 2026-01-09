const FormFieldsHelpSection = () => {
  return (
    <div className="rounded-lg bg-gray-50 p-4 fade-up-slow">
      <h3 className="text-sm font-medium text-gray-900 fade-down-fast">Consejos</h3>
      <ul className="mt-2 space-y-1 text-sm text-gray-600">
        <li className="fade-right-fast">• Los campos fijos (nombre, WhatsApp, email) siempre se mostrarán primero</li>
        <li className="fade-left-fast">• Puedes agregar campos personalizados como "Obra Social" o "Motivo de consulta"</li>
        <li className="fade-right-normal">• Usa campos de tipo "Lista desplegable" para ofrecer opciones predefinidas</li>
        <li className="fade-left-normal">• Los campos obligatorios deben ser completados para poder reservar</li>
      </ul>
    </div>
  );
};

export default FormFieldsHelpSection;
