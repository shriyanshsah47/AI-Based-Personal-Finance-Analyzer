import React from 'react';
import { Card, CardContent, Typography, Box, Divider, Avatar } from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';

const SmartInsights = ({ insights }) => {
  return (
    <Card sx={{ minHeight: 300, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(108, 99, 255, 0.05) 0%, rgba(17, 24, 39, 1) 100%)' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <LightbulbOutlinedIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Smart Insights
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

        {!insights ? (
          <Typography color="text.secondary">Generating insights...</Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            
            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <Avatar sx={{ bgcolor: 'rgba(255, 61, 0, 0.1)', color: '#FF3D00', width: 32, height: 32 }}>
                <TrendingDownOutlinedIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">Highest Spend Category</Typography>
                <Typography variant="subtitle1" fontWeight="bold">{insights.highest_spending_category}</Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <Avatar sx={{ 
                bgcolor: insights.financial_health === 'Good' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 145, 0, 0.1)', 
                color: insights.financial_health === 'Good' ? '#00E676' : '#FF9100', 
                width: 32, height: 32 
              }}>
                <CheckCircleOutlineOutlinedIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">Financial Health</Typography>
                <Typography variant="subtitle1" fontWeight="bold">{insights.financial_health}</Typography>
              </Box>
            </Box>

            {insights.overspending_alert && (
              <Box display="flex" alignItems="flex-start" gap={1.5}>
                <Avatar sx={{ bgcolor: 'rgba(255, 61, 0, 0.1)', color: '#FF3D00', width: 32, height: 32 }}>
                  <WarningAmberOutlinedIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Alert</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="error">High spending detected this month!</Typography>
                </Box>
              </Box>
            )}

            <Box mt={1} p={1.5} sx={{ backgroundColor: 'rgba(108, 99, 255, 0.1)', borderRadius: 2, borderLeft: '4px solid #6C63FF' }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#F3F4F6' }}>
                " {insights.recommendation} "
              </Typography>
            </Box>

          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartInsights;
