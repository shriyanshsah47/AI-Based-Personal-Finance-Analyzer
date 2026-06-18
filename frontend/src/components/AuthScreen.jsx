import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  CircularProgress, Alert, Link, Divider, InputAdornment, IconButton 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { loginUser, registerUser, resetPassword, sendOtp, verifyLogin, resendOtp } from '../services/api';
import ReCAPTCHA from 'react-google-recaptcha';

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
  const [showPassword, setShowPassword] = useState(false);

  const isValidPassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pwd);

  // OTP and CAPTCHA states
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = React.useRef(null);

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
        if (!isOtpSent) {
          if (!recaptchaToken) { setError('Please complete the reCAPTCHA'); setLoading(false); return; }
          const res = await loginUser({ email, password, recaptcha_token: recaptchaToken });
          setSuccess(res.message);
          setIsOtpSent(true);
        } else {
          const res = await verifyLogin({ email, otp });
          onLogin(res.user);
        }
      } else if (view === 'register') {
        if (!isOtpSent) {
          if (!isValidPassword(password)) {
            setError('Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.');
            setLoading(false);
            return;
          }
          if (!recaptchaToken) { setError('Please complete the reCAPTCHA'); setLoading(false); return; }
          const res = await sendOtp({ email, recaptcha_token: recaptchaToken });
          setSuccess(res.message);
          setIsOtpSent(true);
        } else {
          await registerUser({ name, email, password, otp });
          setSuccess('Registration successful! Please login.');
          toggleView('login');
        }
      } else if (view === 'reset') {
        if (!isOtpSent) {
          if (!isValidPassword(password)) {
            setError('Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.');
            setLoading(false);
            return;
          }
          if (!recaptchaToken) { setError('Please complete the reCAPTCHA'); setLoading(false); return; }
          const res = await sendOtp({ email, recaptcha_token: recaptchaToken });
          setSuccess(res.message);
          setIsOtpSent(true);
        } else {
          await resetPassword({ email, otp, new_password: password });
          setSuccess('Password reset successfully! Please login with your new password.');
          toggleView('login');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    clearMessages();
    setLoading(true);
    try {
      await resendOtp({ email });
      setSuccess('OTP has been resent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP. You might need to refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWrongEmail = () => {
    setIsOtpSent(false);
    setOtp('');
    setRecaptchaToken(null);
    if(recaptchaRef.current) recaptchaRef.current.reset();
  };

  const toggleView = (newView) => {
    clearMessages();
    setView(newView);
    setPassword('');
    setShowPassword(false);
    setOtp('');
    setIsOtpSent(false);
    setRecaptchaToken(null);
    if(recaptchaRef.current) recaptchaRef.current.reset();
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
              {view === 'reset' && 'Enter your email to reset your password'}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={2}>
              {!isOtpSent && view === 'register' && (
                <TextField 
                  label="Full Name" 
                  variant="outlined" 
                  fullWidth 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              
              {!isOtpSent && (
                <TextField 
                  label="Email Address" 
                  type="email" 
                  variant="outlined" 
                  fullWidth 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                />
              )}

              {!isOtpSent && view !== 'reset' && (
                <TextField 
                  label="Password" 
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined" 
                  fullWidth 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}

              {!isOtpSent && view === 'reset' && (
                <TextField 
                  label="New Password" 
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined" 
                  fullWidth 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}

              {!isOtpSent && (view === 'register' || view === 'reset') && (
                <Box sx={{ mt: -1, mb: 1, px: 1 }}>
                  <Typography variant="caption" color={password.length >= 8 ? "success.main" : "text.secondary"} display="block">
                    {password.length >= 8 ? '✓' : '○'} At least 8 characters
                  </Typography>
                  <Typography variant="caption" color={/[A-Z]/.test(password) ? "success.main" : "text.secondary"} display="block">
                    {/[A-Z]/.test(password) ? '✓' : '○'} At least 1 uppercase letter
                  </Typography>
                  <Typography variant="caption" color={/\d/.test(password) ? "success.main" : "text.secondary"} display="block">
                    {/\d/.test(password) ? '✓' : '○'} At least 1 number
                  </Typography>
                  <Typography variant="caption" color={/[@$!%*?&]/.test(password) ? "success.main" : "text.secondary"} display="block">
                    {/[@$!%*?&]/.test(password) ? '✓' : '○'} At least 1 special character (@$!%*?&)
                  </Typography>
                </Box>
              )}

              {!isOtpSent && (
                <Box display="flex" justifyContent="center" my={1}>
                  <ReCAPTCHA
                    sitekey="6LeC5yYtAAAAABJaEI51La_XOFlEa9WHWK6S4Bjd"
                    onChange={(token) => setRecaptchaToken(token)}
                    ref={recaptchaRef}
                    theme="dark"
                  />
                </Box>
              )}

              {isOtpSent && (
                <Box>
                  <TextField 
                    label="Enter 6-Digit OTP" 
                    variant="outlined" 
                    fullWidth 
                    required 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    helperText="Please check your email for the OTP"
                  />
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Link component="button" type="button" variant="caption" onClick={handleWrongEmail} underline="hover" disabled={loading}>
                      Wrong email? Correct it here
                    </Link>
                    <Link component="button" type="button" variant="caption" onClick={handleResendOtp} underline="hover" disabled={loading}>
                      Didn't receive code? Resend OTP
                    </Link>
                  </Box>
                </Box>
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
                 isOtpSent ? 'Verify OTP' :
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
