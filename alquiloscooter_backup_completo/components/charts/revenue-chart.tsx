
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface RevenueChartProps {
  data?: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Mock data if none provided
  const mockData = [
    { month: 'Ene', revenue: 12000, expenses: 3000 },
    { month: 'Feb', revenue: 15000, expenses: 4000 },
    { month: 'Mar', revenue: 13000, expenses: 3500 },
    { month: 'Apr', revenue: 18000, expenses: 5000 },
    { month: 'May', revenue: 16000, expenses: 4500 },
    { month: 'Jun', revenue: 20000, expenses: 6000 },
  ];

  const chartData = data || mockData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Ingresos vs Gastos</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-sm"
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              className="text-sm"
              tickLine={false}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `€${value?.toLocaleString?.()}`}
            />
            <Tooltip
              formatter={(value: any, name: string) => [
                `€${value?.toLocaleString?.()}`,
                name === 'revenue' ? 'Ingresos' : 'Gastos'
              ]}
              labelFormatter={(label) => `Mes: ${label}`}
              contentStyle={{ fontSize: '11px' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
