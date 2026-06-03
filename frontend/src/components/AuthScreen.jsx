import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  CircularProgress, Alert, Link, Divider 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import { loginUser, registerUser, resetPassword } from '../services/api';

const AuthScreen = ({ onLogin }) => {
  // 'login', 'register', or 'reset'
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (view === 'login') {
        const res = await loginUser({ email, password });
        onLogin(res.user);
      } else if (view === 'register') {
        if (pin.length !== 4) {
          setError('Security pin must be exactly 4 digits.');
          setLoading(false);
          return;
        }
        await registerUser({ name, email, password, security_pin: pin });
        setSuccess('Registration successful! Please login.');
        setView('login');
      } else if (view === 'reset') {
        if (pin.length !== 4) {
          setError('Security pin must be exactly 4 digits.');
          setLoading(false);
          return;
        }
        await resetPassword({ email, security_pin: pin, new_password: password });
        setSuccess('Password reset successfully! Please login with your new password.');
        setView('login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleView = (newView) => {
    clearMessages();
    setView(newView);
    setPassword('');
    setPin('');
  };

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      sx={{
        background: 'radial-gradient(circle at 50% -20%, #1a1a2e 0%, #111827 100%)',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%', p: 2, background: 'rgba(31, 41, 55, 0.7)' }}>
        <CardContent>
          
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box 
              sx={{ 
                p: 2, borderRadius: '50%', mb: 2,
                background: view === 'login' ? 'rgba(108, 99, 255, 0.1)' : 
                            view === 'register' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 0, 0.1)',
                color: view === 'login' ? '#6C63FF' : 
                       view === 'register' ? '#00E676' : '#FF3D00'
              }}
            >
              {view === 'login' && <LockOutlinedIcon fontSize="large" />}
              {view === 'register' && <PersonAddOutlinedIcon fontSize="large" />}
              {view === 'reset' && <KeyOutlinedIcon fontSize="large" />}
            </Box>
            <Typography variant="h5" fontWeight="bold">
              {view === 'login' && 'Welcome Back'}
              {view === 'register' && 'Create Account'}
              {view === 'reset' && 'Reset Password'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
              {view === 'login' && 'Sign in to access your AI financial dashboard'}
              {view === 'register' && 'Start tracking and forecasting your expenses'}
              {view === 'reset' && 'Enter your email and 4-digit security pin'}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={2}>
              {view === 'register' && (
                <TextField 
                  label="Full Name" 
                  variant="outlined" 
                  fullWidth 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              
              <TextField 
                label="Email Address" 
                type="email" 
                variant="outlined" 
                fullWidth 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {view !== 'reset' && (
                <TextField 
                  label="Password" 
                  type="password" 
                  variant="outlined" 
                  fullWidth 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}

              {view === 'reset' && (
                <TextField 
                  label="New Password" 
                  type="password" 
                  variant="outlined" 
                  fullWidth 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}

              {(view === 'register' || view === 'reset') && (
                <TextField 
                  label="4-Digit Security Pin" 
                  type="text" 
                  inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
                  variant="outlined" 
                  fullWidth 
                  required 
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  helperText={view === 'register' ? "Save this pin! You need it to reset your password." : ""}
                />
              )}

              <Button 
                type="submit" 
                variant="contained" 
                size="large" 
                fullWidth 
                disabled={loading}
                sx={{ 
                  mt: 1, py: 1.5, fontWeight: 'bold',
                  background: view === 'login' ? 'linear-gradient(45deg, #6C63FF, #5A52D5)' : 
                              view === 'register' ? 'linear-gradient(45deg, #00E676, #00C853)' : 
                              'linear-gradient(45deg, #FF3D00, #DD2C00)'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 
                 view === 'login' ? 'Sign In' : 
                 view === 'register' ? 'Register' : 'Reset Password'}
              </Button>
            </Box>
          </form>

          <Box mt={3}>
            <Divider sx={{ mb: 2 }} />
            
            {view === 'login' && (
              <Box display="flex" justifyContent="space-between">
                <Link component="button" variant="body2" onClick={() => toggleView('reset')} underline="hover">
                  Forgot Password?
                </Link>
                <Link component="button" variant="body2" onClick={() => toggleView('register')} underline="hover">
                  Create Account
                </Link>
              </Box>
            )}

            {view === 'register' && (
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link component="button" onClick={() => toggleView('login')} underline="hover">
                    Sign In
                  </Link>
                </Typography>
              </Box>
            )}

            {view === 'reset' && (
              <Box textAlign="center">
                <Link component="button" variant="body2" onClick={() => toggleView('login')} underline="hover">
                  Back to Sign In
                </Link>
              </Box>
            )}
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthScreen;
