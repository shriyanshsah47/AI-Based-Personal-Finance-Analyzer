import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/material/Icon';
import { 
  getTransactions, getSummary, getInsights, 
  getPrediction, getCategories 
} from './services/api';

// We will import components as we build them
import SummaryPanel from './components/SummaryPanel';
import ActionPanel from './components/ActionPanel';
import TransactionList from './components/TransactionList';
import SmartInsights from './components/SmartInsights';
import AIPrediction from './components/AIPrediction';
import SpendingChart from './components/SpendingChart';
import AuthScreen from './components/AuthScreen';
import LogoutIcon from '@mui/icons-material/Logout';
import { Button } from '@mui/material';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finance_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [txs, sum, ins, pred, cats] = await Promise.all([
        getTransactions(user.id),
        getSummary(user.id),
        getInsights(user.id),
        getPrediction(user.id),
        getCategories()
      ]);
      setTransactions(txs);
      setSummary(sum);
      setInsights(ins);
      setPrediction(pred);
      setCategories(cats);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleLogin = (userData) => {
    localStorage.setItem('finance_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('finance_user');
    setUser(null);
    setTransactions([]);
    setSummary(null);
    setInsights(null);
    setPrediction(null);
    setCategories([]);
    setSelectedMonth(null);
    setError('');
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (loading && !summary) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(45deg, #6C63FF 30%, #00E676 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0
            }}>
              Finance Analyzer
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              AI-Based Personal Finance & Expense Prediction
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body1" fontWeight="bold">
              Welcome, {user.name}
            </Typography>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<LogoutIcon />} 
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Dashboard Grid Layout */}
        <Grid container spacing={4}>
          
          {/* Left Column */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ActionPanel categories={categories} onTransactionAdded={fetchData} userId={user.id} />
            <SmartInsights insights={insights} />
            <AIPrediction prediction={prediction} />
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SummaryPanel summary={summary} prediction={prediction} />
            <TransactionList transactions={transactions} user={user} onTransactionDeleted={fetchData} selectedMonth={selectedMonth} onClearMonth={() => setSelectedMonth(null)} />
            <SpendingChart transactions={transactions} selectedMonth={selectedMonth} onMonthClick={setSelectedMonth} />
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}

export default App;