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
import { DoctorPerformance } from '@/lib/api/analytics.api';

interface ManagerDoctorChartProps {
  data: DoctorPerformance[];
  isLoading?: boolean;
}

const COLORS = ['#00BCD4', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#3F51B5', '#00BCD4', '#4CAF50'];

export function ManagerDoctorChart({ data, isLoading }: ManagerDoctorChartProps) {
  if (isLoading) {
    return (
      <div className="h-[250px] w-full animate-pulse rounded-lg bg-gray-100" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-gray-500">
        No doctor data available
      </div>
    );
  }

  // Show top 6 doctors by appointments
  const chartData = data.slice(0, 6).map((item) => ({
    ...item,
    displayName: `Dr. ${item.doctorFirstName.charAt(0)}. ${item.doctorLastName}`,
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="displayName"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'completionRate') return [`${value}%`, 'Completion Rate'];
              return [value, name === 'totalAppointments' ? 'Appointments' : name];
            }}
          />
          <Bar dataKey="totalAppointments" name="Appointments" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
