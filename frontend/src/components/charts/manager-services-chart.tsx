"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ServiceStats } from '@/lib/api/analytics.api';

interface ManagerServicesChartProps {
  data: ServiceStats[];
  isLoading?: boolean;
}

const COLORS = ['#00BCD4', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#3F51B5', '#00BCD4', '#4CAF50'];

export function ManagerServicesChart({ data, isLoading }: ManagerServicesChartProps) {
  if (isLoading) {
    return (
      <div className="h-[250px] w-full animate-pulse rounded-lg bg-gray-100" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-gray-500">
        No service data available
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Truncate long names and show top 6
  const chartData = data.slice(0, 6).map((item) => ({
    ...item,
    displayName: item.serviceName.length > 18 
      ? item.serviceName.substring(0, 18) + '...' 
      : item.serviceName,
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            width={95}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
              return [value, 'Appointments'];
            }}
            labelFormatter={(label) => chartData.find(d => d.displayName === label)?.serviceName || label}
          />
          <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
