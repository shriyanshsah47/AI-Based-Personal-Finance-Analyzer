import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Chip, Divider, Grid } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';

const AIPrediction = ({ prediction }) => {
  if (!prediction) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Card>
    );
  }

  const { prediction: predAmount, trend, trend_pct, model_used, data_points, message, predicted_categories, current_top_categories } = prediction;

  return (
    <Card sx={{ background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(0, 230, 118, 0.05) 100%)' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <AutoAwesomeOutlinedIcon sx={{ color: '#6C63FF', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              AI Expense Forecast
            </Typography>
          </Box>
          <Chip label="Smart Extrapolation ML" size="small" sx={{ bgcolor: 'rgba(108, 99, 255, 0.2)', color: '#8B84FF', fontWeight: 'bold' }} />
        </Box>
        
        <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography color="text.secondary" variant="body2" gutterBottom>Predicted Next Month Expense</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary' }}>
              ₹{predAmount !== undefined ? predAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </Typography>
            <Box display="flex" alignItems="center" mt={1} mb={3}>
              <TimelineOutlinedIcon sx={{ 
                color: trend === 'increase' ? '#FF3D00' : trend === 'decrease' ? '#00E676' : 'text.secondary', 
                mr: 1 
              }} />
              <Typography variant="body2" sx={{ 
                color: trend === 'increase' ? '#FF3D00' : trend === 'decrease' ? '#00E676' : 'text.secondary',
                fontWeight: 'bold'
              }}>
                {trend === 'increase' ? '+' : trend === 'decrease' ? '-' : ''}{trend_pct}% {trend} expected
              </Typography>
            </Box>

            {predicted_categories && predicted_categories.length > 0 && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Predicted Top Categories:
                </Typography>
                {predicted_categories.map((cat, idx) => (
                  <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">{cat.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Box p={2} sx={{ bgcolor: 'background.paper', borderRadius: 2, mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Model Diagnostics</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}><b>Model Used:</b> {model_used}</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}><b>Data Points:</b> {data_points} transactions</Typography>
              <Typography variant="body2" sx={{ mb: 0.5, fontStyle: 'italic', color: '#9CA3AF' }}>{message}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box p={2} sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 2, height: '100%' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                Where you spent the most this month:
              </Typography>
              {current_top_categories && current_top_categories.length > 0 ? (
                current_top_categories.map((cat, idx) => (
                  <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" sx={{ color: '#FF3D00' }}>{cat.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">No data this month.</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AIPrediction;
