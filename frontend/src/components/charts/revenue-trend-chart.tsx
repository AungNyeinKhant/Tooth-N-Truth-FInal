"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RevenueTrend } from '@/lib/api/analytics.api';

interface RevenueTrendChartProps {
  data: RevenueTrend[];
  isLoading?: boolean;
}

export function RevenueTrendChart({ data, isLoading }: RevenueTrendChartProps) {
  if (isLoading) {
    return (
      <div className="h-[300px] w-full animate-pulse rounded-lg bg-gray-100" />
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

  const formatLabel = (value: string, index: number) => {
    // Show every other month label to prevent crowding
    return index % 2 === 0 ? value : '';
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value, index) => formatLabel(value, index)}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#00BCD4"
            strokeWidth={2}
            dot={{ fill: '#00BCD4', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#00BCD4' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
