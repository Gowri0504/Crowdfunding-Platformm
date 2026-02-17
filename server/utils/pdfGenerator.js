import puppeteer from 'puppeteer';

/**
 * Generate PDF from HTML content
 * @param {string} htmlContent - HTML content to convert to PDF
 * @param {Object} options - PDF generation options
 * @returns {Buffer} PDF buffer
 */
export const generatePDF = async (htmlContent, options = {}) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      ...options
    };
    
    const pdfBuffer = await page.pdf(pdfOptions);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Generate financial report HTML template
 * @param {Object} reportData - Financial report data
 * @returns {string} HTML content
 */
export const generateFinancialReportHTML = (reportData) => {
  const { period, dateRange, summary, categoryBreakdown, dailyTrends, topCampaigns, donations } = reportData;
  
  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Financial Report - ${period.charAt(0).toUpperCase() + period.slice(1)}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #6b7280;
          margin: 5px 0;
          font-size: 14px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        .section {
          margin-bottom: 30px;
          background: #f8fafc;
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid #3b82f6;
        }
        .section h2 {
          color: #1e40af;
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        tr:hover {
          background: #f9fafb;
        }
        .amount {
          font-weight: 600;
          color: #059669;
        }
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .category-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #10b981;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .category-item h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
        }
        .category-item p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DreamLift Financial Report</h1>
        <p>${period.charAt(0).toUpperCase() + period.slice(1)} Report</p>
        <p>Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}</p>
        <p>Generated on: ${formatDate(new Date())}</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Revenue</h3>
          <p class="value">${formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div class="summary-card">
          <h3>Total Donations</h3>
          <p class="value">${summary.totalDonations}</p>
        </div>
        <div class="summary-card">
          <h3>Average Donation</h3>
          <p class="value">${formatCurrency(summary.averageDonation)}</p>
        </div>
      </div>

      <div class="section">
        <h2>📊 Category Breakdown</h2>
        <div class="category-grid">
          ${Object.entries(categoryBreakdown).map(([category, stats]) => `
            <div class="category-item">
              <h4>${category}</h4>
              <p><strong>Amount:</strong> ${formatCurrency(stats.amount)}</p>
              <p><strong>Donations:</strong> ${stats.count}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h2>🏆 Top Performing Campaigns</h2>
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Amount Raised</th>
              <th>Donations</th>
            </tr>
          </thead>
          <tbody>
            ${topCampaigns.slice(0, 10).map(campaign => `
              <tr>
                <td>${campaign.title}</td>
                <td class="amount">${formatCurrency(campaign.amount)}</td>
                <td>${campaign.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${donations.length > 0 ? `
      <div class="section page-break">
        <h2>💰 Recent Donations</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Campaign</th>
              <th>Category</th>
              <th>Donor</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${donations.slice(0, 50).map(donation => `
              <tr>
                <td>${formatDate(donation.date)}</td>
                <td>${donation.campaign}</td>
                <td>${donation.category}</td>
                <td>${donation.donor}</td>
                <td class="amount">${formatCurrency(donation.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${donations.length > 50 ? `<p><em>Showing first 50 donations. Total: ${donations.length} donations.</em></p>` : ''}
      </div>
      ` : ''}

      <div class="footer">
        <p>This report was generated automatically by DreamLift Platform</p>
        <p>For questions or support, contact admin@dreamlift.com</p>
      </div>
    </body>
    </html>
  `;
};