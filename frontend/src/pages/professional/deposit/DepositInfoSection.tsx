const DepositInfoSection = () => {
  return (
    <div className="mt-6 rounded-lg bg-gray-50 p-4 fade-left-normal">
      <h3 className="text-sm font-medium text-gray-900 fade-down-fast">¿Cómo funciona el depósito?</h3>
      <ul className="mt-2 space-y-2 text-sm text-gray-600">
        <li className="flex items-start gap-2 fade-right-fast">
          <span className="text-blue-500 mt-0.5">1.</span>
          <span>Cuando un paciente reserva una cita, se le solicitará el pago del depósito</span>
        </li>
        <li className="flex items-start gap-2 fade-left-fast">
          <span className="text-blue-500 mt-0.5">2.</span>
          <span>El pago se realiza a través de Mercado Pago o tarjeta de crédito</span>
        </li>
        <li className="flex items-start gap-2 fade-right-fast">
          <span className="text-blue-500 mt-0.5">3.</span>
          <span>Si el paciente no paga dentro del tiempo límite, el horario se libera automáticamente</span>
        </li>
        <li className="flex items-start gap-2 fade-left-fast">
          <span className="text-blue-500 mt-0.5">4.</span>
          <span>Una vez confirmado el pago, la cita queda reservada</span>
        </li>
      </ul>
    </div>
  );
};

export default DepositInfoSection;
