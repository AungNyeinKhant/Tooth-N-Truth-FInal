"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AppointmentStatusChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  isLoading?: boolean;
}

const COLORS = {
  completed: '#22C55E',  // green
  confirmed: '#3B82F6',   // blue
  pending: '#F59E0B',    // amber
  cancelled: '#EF4444',  // red
  noShow: '#6B7280',     // gray
};

export function AppointmentStatusChart({ data, isLoading }: AppointmentStatusChartProps) {
  if (isLoading) {
    return (
      <div className="h-[250px] w-full animate-pulse rounded-lg bg-gray-100" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-gray-500">
        No appointment data available
      </div>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    color: item.color || COLORS[item.name.toLowerCase() as keyof typeof COLORS] || '#6B7280',
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => {
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return [`${value} (${percentage}%)`, name];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>
    </div>
  );
}
