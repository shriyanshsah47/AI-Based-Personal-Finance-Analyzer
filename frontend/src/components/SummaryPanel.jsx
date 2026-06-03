import React from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';

const SummaryCard = ({ title, amount, icon, color }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{
      position: 'absolute',
      right: -20,
      top: -20,
      opacity: 0.1,
      color: color,
      transform: 'scale(3)'
    }}>
      {icon}
    </Box>
    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
      <Typography color="text.secondary" gutterBottom variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </Typography>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        ₹{amount !== undefined && amount !== null ? amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
      </Typography>
    </CardContent>
  </Card>
);

const SummaryPanel = ({ summary, prediction }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <SummaryCard 
          title="Net Balance" 
          amount={summary?.net_balance} 
          icon={<AccountBalanceWalletOutlinedIcon />} 
          color="#6C63FF" 
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <SummaryCard 
          title="Total Cash In" 
          amount={summary?.total_cash_in} 
          icon={<TrendingUpOutlinedIcon />} 
          color="#00E676" 
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <SummaryCard 
          title="Total Spend" 
          amount={summary?.total_spend} 
          icon={<TrendingDownOutlinedIcon />} 
          color="#FF3D00" 
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <SummaryCard 
          title="AI Forecast (Next Month)" 
          amount={prediction?.prediction} 
          icon={<AutoGraphOutlinedIcon />} 
          color="#FF9100" 
        />
      </Grid>
    </Grid>
  );
};

export default SummaryPanel;
