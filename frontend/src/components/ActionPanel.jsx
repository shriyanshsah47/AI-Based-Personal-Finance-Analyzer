import React, { useState } from 'react';
import { Card, CardContent, Typography, TextField, MenuItem, Button, Box, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { addTransaction } from '../services/api';

const ActionPanel = ({ categories, onTransactionAdded, userId }) => {
  const [type, setType] = useState('out');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (category === 'Other Transaction' && !customCategory.trim()) {
      setError('Please specify the custom category.');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        category: category,
        custom_category: customCategory,
        type: type,
        date: date,
        notes: notes,
        user_id: userId
      });
      setAmount('');
      setCategory('');
      setCustomCategory('');
      setNotes('');
      onTransactionAdded(); // refresh dashboard
    } catch (err) {
      setError('Failed to add transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Add Transaction
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              color="primary"
              value={type}
              exclusive
              onChange={(e, newType) => {
                if(newType) {
                  setType(newType);
                  setCategory('');
                }
              }}
              fullWidth
            >
              <ToggleButton value="out" sx={{ color: type === 'out' ? '#FF3D00' : 'inherit', '&.Mui-selected': { color: '#FF3D00', backgroundColor: 'rgba(255, 61, 0, 0.1)' } }}>
                Expense
              </ToggleButton>
              <ToggleButton value="in" sx={{ color: type === 'in' ? '#00E676' : 'inherit', '&.Mui-selected': { color: '#00E676', backgroundColor: 'rgba(0, 230, 118, 0.1)' } }}>
                Income
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField
            fullWidth
            type="number"
            label="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="normal"
            required
            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
          />

          <TextField
            select
            fullWidth
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            margin="normal"
            required
          >
            {filteredCategories.map((c) => (
              <MenuItem key={c.id} value={c.name}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          {category === 'Other Transaction' && (
            <TextField
              fullWidth
              label="Specify Custom Category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              margin="normal"
              required
            />
          )}

          <TextField
            fullWidth
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            fullWidth
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            startIcon={<AddCircleOutlineIcon />}
            sx={{ mt: 2 }}
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ActionPanel;
