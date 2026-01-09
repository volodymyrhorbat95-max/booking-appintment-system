const SubscriptionInfoBox = () => {
  return (
    <div className="rounded-lg bg-blue-50 p-4 zoom-in-normal">
      <h3 className="text-sm font-medium text-blue-900 fade-down-fast">Información de Pagos</h3>
      <ul className="mt-2 text-sm text-blue-700 space-y-1">
        <li className="flex items-start gap-2 fade-right-fast">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
          <span>Los pagos se procesan de forma segura a través de Mercado Pago</span>
        </li>
        <li className="flex items-start gap-2 fade-left-fast">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
          <span>Puedes cancelar tu suscripción en cualquier momento</span>
        </li>
        <li className="flex items-start gap-2 fade-right-normal">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
          <span>Al cancelar, mantendrás el acceso hasta el final del período pagado</span>
        </li>
      </ul>
    </div>
  );
};

export default SubscriptionInfoBox;
