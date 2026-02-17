import QRCode from 'qrcode';

/**
 * Generate QR code for campaign payments
 * @param {Object} campaignData - Campaign information
 * @param {String} campaignData.campaignId - Campaign ID
 * @param {String} campaignData.title - Campaign title
 * @param {Number} campaignData.targetAmount - Target amount
 * @param {String} campaignData.upiId - UPI ID for payments
 * @param {String} campaignData.currency - Currency (default: INR)
 * @returns {Object} QR code data and image
 */
export const generateCampaignQR = async (campaignData) => {
  try {
    const { campaignId, title, targetAmount, upiId, currency = 'INR', creatorName, description } = campaignData;
    
    // Create payment URL for the campaign
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/donate/${campaignId}`;
    
    // Create comprehensive UPI payment string if UPI ID is provided
    let upiPaymentString = '';
    let upiQrCodeImage = null;
    
    if (upiId) {
      const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
      const cleanCreatorName = creatorName ? creatorName.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30) : 'Campaign Creator';
      
      // Create proper UPI payment string with all required parameters
      upiPaymentString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(cleanCreatorName)}&tn=${encodeURIComponent(cleanTitle)}&cu=${currency}&mc=0000&mode=02&purpose=00`;
      
      // For flexible amount donations, don't include 'am' parameter
      // Users can enter amount in their UPI app
      
      // Generate UPI QR code with enhanced options
      const upiQrOptions = {
        errorCorrectionLevel: 'H', // Higher error correction for UPI
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300 // Larger size for better scanning
      };
      
      upiQrCodeImage = await QRCode.toDataURL(upiPaymentString, upiQrOptions);
    }
    
    // Enhanced QR code data object with more details
    const qrData = {
      type: 'campaign_payment',
      campaignId,
      title,
      description: description ? description.substring(0, 100) : '',
      creatorName: creatorName || 'Anonymous',
      paymentUrl,
      upiPaymentString,
      currency,
      targetAmount,
      upiId: upiId || null,
      generatedAt: new Date().toISOString(),
      version: '2.0' // Version for future compatibility
    };
    
    // Generate QR code for the payment URL (primary)
    const qrCodeOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };
    
    // Generate QR code image as base64
    const qrCodeImage = await QRCode.toDataURL(paymentUrl, qrCodeOptions);
    
    return {
      success: true,
      data: {
        qrData: JSON.stringify(qrData),
        paymentUrl,
        upiPaymentString,
        qrCodeImage, // Base64 image for web payment
        upiQrCodeImage, // Base64 image for UPI payment (enhanced)
        imageUrl: qrCodeImage, // Alias for backward compatibility
        generatedAt: new Date(),
        qrType: upiId ? 'upi_enabled' : 'web_only'
      }
    };
    
  } catch (error) {
    console.error('QR Code generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate QR code for donation tracking
 * @param {Object} donationData - Donation information
 * @returns {Object} QR code for donation verification
 */
export const generateDonationQR = async (donationData) => {
  try {
    const { donationId, campaignId, amount, transactionId, donorName, campaignTitle } = donationData;
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/donation/verify/${donationId}`;
    
    // Enhanced QR data with more verification details
    const qrData = {
      type: 'donation_verification',
      donationId,
      campaignId,
      amount,
      transactionId: transactionId || `TXN_${Date.now()}`,
      donorName: donorName || 'Anonymous Donor',
      campaignTitle: campaignTitle || 'Campaign',
      verificationUrl,
      generatedAt: new Date().toISOString(),
      version: '2.0'
    };
    
    const qrCodeOptions = {
      errorCorrectionLevel: 'H', // High error correction for verification
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: {
        dark: '#1a365d', // Darker blue for verification QR
        light: '#FFFFFF'
      },
      width: 250
    };
    
    const qrCodeImage = await QRCode.toDataURL(verificationUrl, qrCodeOptions);
    
    return {
      success: true,
      data: {
        qrData: JSON.stringify(qrData),
        verificationUrl,
        qrCodeImage,
        imageUrl: qrCodeImage, // Alias for compatibility
        generatedAt: new Date(),
        qrType: 'donation_verification'
      }
    };
    
  } catch (error) {
    console.error('Donation QR generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate QR code for campaign updates notification
 * @param {Object} updateData - Update information
 * @returns {Object} QR code for update access
 */
export const generateUpdateQR = async (updateData) => {
  try {
    const { campaignId, updateId, title } = updateData;
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const updateUrl = `${baseUrl}/campaign/${campaignId}/update/${updateId}`;
    
    const qrData = {
      type: 'campaign_update',
      campaignId,
      updateId,
      title,
      updateUrl,
      generatedAt: new Date().toISOString()
    };
    
    const qrCodeOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 200
    };
    
    const qrCodeImage = await QRCode.toDataURL(updateUrl, qrCodeOptions);
    
    return {
      success: true,
      data: {
        qrData: JSON.stringify(qrData),
        updateUrl,
        qrCodeImage,
        generatedAt: new Date()
      }
    };
    
  } catch (error) {
    console.error('Update QR generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  generateCampaignQR,
  generateDonationQR,
  generateUpdateQR
};