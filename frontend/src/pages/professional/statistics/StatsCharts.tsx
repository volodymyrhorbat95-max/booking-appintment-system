import { Bar, Doughnut, Line } from 'react-chartjs-2';
import type { ChartData } from 'chart.js';

interface StatsChartsProps {
  trendChartData: ChartData<'line'>;
  statusChartData: ChartData<'doughnut'>;
  monthlyChartData: ChartData<'bar'>;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  }
};

const StatsCharts = ({ trendChartData, statusChartData, monthlyChartData }: StatsChartsProps) => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Monthly Trend Line Chart */}
      <div className="rounded-lg bg-white p-6 shadow-sm zoom-in-normal">
        <h3 className="text-lg font-medium text-gray-900 mb-4 fade-down-fast">Tendencia Mensual</h3>
        <div className="h-64">
          <Line data={trendChartData} options={chartOptions} />
        </div>
      </div>

      {/* Status Distribution Doughnut */}
      <div className="rounded-lg bg-white p-6 shadow-sm zoom-in-normal">
        <h3 className="text-lg font-medium text-gray-900 mb-4 fade-down-fast">Distribución por Estado</h3>
        <div className="h-64">
          <Doughnut data={statusChartData} options={chartOptions} />
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow-sm fade-up-slow">
        <h3 className="text-lg font-medium text-gray-900 mb-4 fade-down-fast">Citas por Mes</h3>
        <div className="h-72">
          <Bar data={monthlyChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default StatsCharts;
