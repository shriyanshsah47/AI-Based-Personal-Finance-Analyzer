import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend
} from 'recharts';

const COLORS = ['#6C63FF', '#00E676', '#FF3D00', '#FF9100', '#00B0FF', '#E040FB', '#1DE9B6', '#FFC400'];

const SpendingChart = ({ transactions, selectedMonth, onMonthClick }) => {
  // Process data for Pie Chart (Expenses by Category)
  const expenses = transactions.filter(t => t.type === 'out');
  const pieExpenses = selectedMonth ? expenses.filter(t => t.date.startsWith(selectedMonth)) : expenses;
  const catMap = {};
  pieExpenses.forEach(t => {
    const cat = t.category === 'Other Transaction' ? t.custom_category : t.category;
    catMap[cat] = (catMap[cat] || 0) + parseFloat(t.amount);
  });
  
  const pieData = Object.keys(catMap).map(key => ({
    name: key,
    value: catMap[key]
  })).sort((a, b) => b.value - a.value);

  // Process data for Line Chart (Total Spend per Month)
  const monthMap = {};
  expenses.forEach(t => {
    const dateObj = new Date(t.date);
    const monthYear = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
    const sortKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthMap[sortKey]) {
      monthMap[sortKey] = { name: monthYear, sortKey: sortKey, spend: 0 };
    }
    monthMap[sortKey].spend += parseFloat(t.amount);
  });

  const lineData = Object.keys(monthMap)
    .sort() // Sort chronologically by 'YYYY-MM'
    .map(key => monthMap[key]);

  const pieTitle = selectedMonth 
    ? `Spending by Category (${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })})` 
    : "Spending by Category";

  return (
    <Grid container spacing={4}>
      {/* Pie Chart Card */}
      <Grid item xs={12}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              {pieTitle}
            </Typography>
            
            {pieData.length === 0 ? (
              <Box height={280} display="flex" alignItems="center" justifyContent="center">
                <Typography color="text.secondary">No expense data available.</Typography>
              </Box>
            ) : (
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="#000000"
                      strokeWidth={0.5}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => `₹${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#F3F4F6' }}
                      itemStyle={{ color: '#F3F4F6' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Line Chart Card */}
      <Grid item xs={12}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Monthly Spend Trend
            </Typography>
            
            {lineData.length === 0 ? (
              <Box height={280} display="flex" alignItems="center" justifyContent="center">
                <Typography color="text.secondary">No expense data available.</Typography>
              </Box>
            ) : (
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={lineData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(e) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        onMonthClick(e.activePayload[0].payload.sortKey);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                    <LineTooltip 
                      formatter={(value) => [`₹${value.toFixed(2)}`, 'Total Spend']}
                      contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#F3F4F6' }}
                    />
                    <Line type="monotone" dataKey="spend" stroke="#FF3D00" strokeWidth={3} dot={{ r: 4, fill: '#FF3D00' }} activeDot={{ r: 8, cursor: 'pointer' }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SpendingChart;
