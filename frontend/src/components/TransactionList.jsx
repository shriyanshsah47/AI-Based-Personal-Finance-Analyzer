import React, { useState } from 'react';
import { 
  Card, CardContent, Typography, Box, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, TextField, 
  TablePagination, Popover, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Tooltip 
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { deleteTransaction } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const TransactionList = ({ transactions, user, onTransactionDeleted, selectedMonth, onClearMonth }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  
  // On-screen filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  // PDF modal state
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id);
      onTransactionDeleted();
    }
  };

  // ── On-screen Filtering ───────────────────────────────────────────────────
  const filtered = transactions.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMonth = selectedMonth ? t.date.startsWith(selectedMonth) : true;
    const matchesStartDate = startDate ? t.date >= startDate : true;
    const matchesEndDate = endDate ? t.date <= endDate : true;
    return matchesSearch && matchesMonth && matchesStartDate && matchesEndDate;
  });

  const displayed = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── PDF Generation Logic ──────────────────────────────────────────────────
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Filter specifically for the PDF based on the dialog's date range
    const pdfFiltered = transactions.filter(t => {
      const matchesStart = pdfStartDate ? t.date >= pdfStartDate : true;
      const matchesEnd = pdfEndDate ? t.date <= pdfEndDate : true;
      return matchesStart && matchesEnd;
    });

    const formatDateStr = (dateStr) => {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${d}-${m}-${y}`;
    };

    // Calculate Summary Stats
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};

    pdfFiltered.forEach(t => {
      const amt = parseFloat(t.amount);
      const catName = t.category === 'Other Transaction' ? t.custom_category : t.category;
      
      if (t.type === 'in') totalIncome += amt;
      else if (t.type === 'out') {
        totalExpense += amt;
        categoryTotals[catName] = (categoryTotals[catName] || 0) + amt;
      }
    });
    const netBalance = totalIncome - totalExpense;

    // Header & Branding
    doc.setFontSize(22);
    doc.setTextColor(108, 99, 255); // primary color
    doc.text("Finance Analyzer", 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Financial Report", 14, 28);
    
    // User Context & Date Range
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Account: ${user?.name || 'User'} (${user?.email || 'N/A'})`, 14, 38);
    
    const rangeText = (pdfStartDate || pdfEndDate) 
      ? `Date Range: ${pdfStartDate ? formatDateStr(pdfStartDate) : 'Beginning'} to ${pdfEndDate ? formatDateStr(pdfEndDate) : 'Today'}`
      : "Date Range: All Time";
    doc.text(rangeText, 14, 43);
    
    const today = new Date();
    const formattedToday = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    doc.text(`Generated on: ${formattedToday}`, 14, 48);

    let startY = 60;

    // Category Breakdown - Top Right
    const catKeys = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);
    if (catKeys.length > 0) {
      const catData = catKeys.map(cat => [cat, `Rs.${categoryTotals[cat].toLocaleString('en-IN', { minimumFractionDigits: 2 })}`]);
      
      autoTable(doc, {
        startY: 35,
        head: [['Expense Breakdown', 'Amount']],
        body: catData,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 245], textColor: 40, fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' } },
        margin: { left: 120, right: 14 }, // Render on the right side
      });
      // Ensure the main table starts below the category table if it's long
      if (doc.lastAutoTable.finalY + 15 > startY) {
        startY = doc.lastAutoTable.finalY + 15;
      }
    }

    // Summary Statistics - Left side (under generated on)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    doc.setTextColor(0, 200, 83); // Green for income
    doc.text(`Total Income: +Rs.${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14, 60);
    
    doc.setTextColor(255, 61, 0); // Red for expense
    doc.text(`Total Expense: -Rs.${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14, 65);
    
    doc.setTextColor(netBalance >= 0 ? 0 : 255, netBalance >= 0 ? 200 : 61, netBalance >= 0 ? 83 : 0);
    doc.text(`Net Balance: ${netBalance >= 0 ? '+' : '-'}Rs.${Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14, 70);
    
    doc.setFont('helvetica', 'normal');

    startY = Math.max(startY, 85);

    // Format Table Data
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text("Transaction History", 14, startY);

    const tableData = pdfFiltered.map(t => [
      formatDateStr(t.date),
      t.category === 'Other Transaction' ? t.custom_category : t.category,
      t.notes || '-',
      t.type.toUpperCase(),
      `${t.type === 'in' ? '+' : '-'} Rs.${parseFloat(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ]);

    // Generate Table
    autoTable(doc, {
      startY: startY + 5,
      head: [['Date', 'Category', 'Notes', 'Type', 'Amount']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [108, 99, 255], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        1: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw.startsWith('+')) {
            data.cell.styles.textColor = [0, 200, 83];
          } else {
            data.cell.styles.textColor = [255, 61, 0];
          }
        }
      }
    });

    // Add Page Numbers (Footer)
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount} - Finance Analyzer Report`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    // Save PDF
    doc.save("Finance_Transactions_Report.pdf");
    setPdfDialogOpen(false);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Recent Transactions
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {/* Active Filters Display */}
            {selectedMonth && (
              <Chip 
                label={`Chart: ${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}`} 
                onDelete={onClearMonth}
                color="secondary"
                variant="outlined"
                size="small"
              />
            )}
            {(startDate || endDate) && (
              <Chip 
                label={`Range: ${startDate || 'Any'} - ${endDate || 'Any'}`} 
                onDelete={() => { setStartDate(''); setEndDate(''); }}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}

            {/* Search Bar */}
            <TextField 
              size="small" 
              placeholder="Search..." 
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 180 }}
            />

            {/* Filter Menu Button */}
            <Tooltip title="Filter by Date">
              <IconButton 
                onClick={(e) => setFilterAnchorEl(e.currentTarget)} 
                sx={{ bgcolor: 'rgba(108, 99, 255, 0.1)', color: '#6C63FF' }}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>

            {/* Generate PDF Button */}
            <Tooltip title="Export to PDF">
              <IconButton 
                onClick={() => setPdfDialogOpen(true)} 
                sx={{ bgcolor: 'rgba(255, 61, 0, 0.1)', color: '#FF3D00' }}
              >
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Filter Popover */}
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Typography variant="subtitle2" fontWeight="bold">Filter Date Range</Typography>
            <TextField
              type="date"
              size="small"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button variant="contained" size="small" onClick={() => setFilterAnchorEl(null)}>
              Apply
            </Button>
          </Box>
        </Popover>

        {/* PDF Export Dialog */}
        <Dialog open={pdfDialogOpen} onClose={() => setPdfDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Export Transactions</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select a date range to generate your tabular PDF report. Leave blank to export all transactions.
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={pdfStartDate}
                onChange={(e) => setPdfStartDate(e.target.value)}
                fullWidth
              />
              <TextField
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={pdfEndDate}
                onChange={(e) => setPdfEndDate(e.target.value)}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPdfDialogOpen(false)} color="inherit">Cancel</Button>
            <Button onClick={generatePDF} variant="contained" color="error" startIcon={<PictureAsPdfIcon />}>
              Generate PDF
            </Button>
          </DialogActions>
        </Dialog>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                displayed.map((tx) => (
                  <TableRow key={tx.transaction_id} hover>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{tx.date}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          size="small" 
                          label={tx.type === 'in' ? 'IN' : 'OUT'} 
                          sx={{ 
                            height: 20, fontSize: '0.7rem', 
                            bgcolor: tx.type === 'in' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 0, 0.1)',
                            color: tx.type === 'in' ? '#00E676' : '#FF3D00'
                          }} 
                        />
                        <Typography variant="body2">
                          {tx.category === 'Other Transaction' ? tx.custom_category : tx.category}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.notes}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: tx.type === 'in' ? '#00E676' : '#FF3D00' }}>
                      {tx.type === 'in' ? '+' : '-'}₹{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleDelete(tx.transaction_id)} color="error">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  );
};

export default TransactionList;
