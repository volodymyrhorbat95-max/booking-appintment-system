import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import { getMyStatistics, clearError } from '../../../store/slices/statisticsSlice';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import StatisticsHeader from './StatisticsHeader';
import StatsSummaryCards from './StatsSummaryCards';
import StatsRateCards from './StatsRateCards';
import StatsCharts from './StatsCharts';
import StatsInfoBox from './StatsInfoBox';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const ProfessionalStatisticsPage = () => {
  const dispatch = useAppDispatch();
  const { statistics, error } = useAppSelector((state) => state.statistics);

  // Date range filter
  const [dateRange, setDateRange] = useState<'3m' | '6m' | '12m'>('12m');

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case '3m':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(start.getMonth() - 6);
        break;
      case '12m':
      default:
        start.setMonth(start.getMonth() - 12);
        break;
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // Load statistics
  useEffect(() => {
    const { startDate, endDate } = getDateRange();
    dispatch(getMyStatistics({ startDate, endDate }));
  }, [dispatch, dateRange]);

  // Cleanup
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Format month label
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
  };

  // Chart data for monthly trend
  const monthlyChartData = {
    labels: statistics?.byMonth.map((m) => formatMonth(m.month)) || [],
    datasets: [
      {
        label: 'Total',
        data: statistics?.byMonth.map((m) => m.total) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      },
      {
        label: 'Completadas',
        data: statistics?.byMonth.map((m) => m.completed) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2
      },
      {
        label: 'Canceladas',
        data: statistics?.byMonth.map((m) => m.cancelled) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2
      }
    ]
  };

  // Chart data for status distribution
  const statusChartData = {
    labels: ['Confirmadas', 'Completadas', 'Canceladas', 'No asistió'],
    datasets: [
      {
        data: [
          statistics?.appointments.confirmed || 0,
          statistics?.appointments.completed || 0,
          statistics?.appointments.cancelled || 0,
          statistics?.appointments.noShow || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(234, 179, 8, 0.7)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
          'rgb(234, 179, 8)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Line chart for trend
  const trendChartData = {
    labels: statistics?.byMonth.map((m) => formatMonth(m.month)) || [],
    datasets: [
      {
        label: 'Citas',
        data: statistics?.byMonth.map((m) => m.total) || [],
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.4
      }
    ]
  };

  return (
    <div className="mx-auto max-w-7xl zoom-in-normal">
      {/* Header with Date Range Filter */}
      <StatisticsHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        error={error}
      />

      {/* Summary Cards */}
      <StatsSummaryCards
        total={statistics?.appointments.total || 0}
        completed={statistics?.appointments.completed || 0}
        cancelled={statistics?.appointments.cancelled || 0}
        noShow={statistics?.appointments.noShow || 0}
      />

      {/* Rate Cards */}
      <StatsRateCards
        confirmationRate={statistics?.rates.confirmationRate || 0}
        completionRate={statistics?.rates.completionRate || 0}
        cancellationRate={statistics?.rates.cancellationRate || 0}
        noShowRate={statistics?.rates.noShowRate || 0}
      />

      {/* Charts */}
      <StatsCharts
        trendChartData={trendChartData}
        statusChartData={statusChartData}
        monthlyChartData={monthlyChartData}
      />

      {/* Info Box */}
      <StatsInfoBox />
    </div>
  );
};

export default ProfessionalStatisticsPage;
