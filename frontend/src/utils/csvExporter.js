/**
 * Generic CSV Exporter Utility
 * Compiles a dataset and maps keys to headers to download a clean, well-formatted CSV file.
 * Automatically handles nested properties (e.g. 'item.itemName').
 */
export const exportToCSV = (data, filename, headersMap) => {
  const headers = Object.values(headersMap);
  const keys = Object.keys(headersMap);
  
  // Create CSV Rows starting with headers
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = keys.map(key => {
      // Traverse nested fields (e.g., 'item.itemName')
      let val = row;
      const parts = key.split('.');
      for (const part of parts) {
        val = val ? val[part] : '';
      }
      
      // Escape inner quotes and wrap in quotes to preserve formatting
      const strVal = String(val === undefined || val === null ? '' : val).replace(/"/g, '""');
      return `"${strVal}"`;
    });
    csvRows.push(values.join(','));
  });
  
  // Use Blob API with UTF-8 BOM so Excel opens it with correct formatting
  const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
