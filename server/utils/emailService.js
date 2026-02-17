import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Initialize dotenv if not already initialized
dotenv.config();

const createTransporter = () => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

    if (!user || !pass) {
      console.warn('Email credentials are not configured. Skipping email sending.');
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000 // 10 seconds timeout
    });

    // Verify transporter configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email transporter is ready to send messages');
      }
    });

    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

/**
 * Send campaign improvement notification to all donors
 * @param {Object} campaignData - Campaign information
 * @param {Array} donors - List of donors
 * @param {Object} updateData - Update information
 */
export const sendCampaignImprovementEmail = async (campaignData, donors, updateData) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn('Email transporter not available. Skipping campaign improvement emails.');
      return {
        success: false,
        error: 'Email service not configured'
      };
    }
    
    const { title, creator, _id: campaignId } = campaignData;
    const { title: updateTitle, content: updateContent, images } = updateData;
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const campaignUrl = `${baseUrl}/campaigns/${campaignId}`;
    
    // Track email sending stats
    const stats = { successful: 0, failed: 0 };
    
    // Email template for campaign improvement
    const emailTemplate = (donorName, donationAmount, donationDate) => ({
      from: process.env.EMAIL_USER,
      subject: `🎉 Great News! ${title} has an Important Update`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Campaign Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .update-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .donation-info { background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .images { margin: 20px 0; }
            .images img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Campaign Update!</h1>
              <p>Thank you for supporting "${title}"</p>
            </div>
            
            <div class="content">
              <p>Dear ${donorName},</p>
              
              <p>We have exciting news to share about the campaign you supported!</p>
              
              <div class="donation-info">
                <strong>Your Contribution:</strong><br>
                Amount: ₹${donationAmount}<br>
                Date: ${new Date(donationDate).toLocaleDateString('en-IN')}
              </div>
              
              <div class="update-box">
                <h2>${updateTitle}</h2>
                <p>${updateContent}</p>
                
                ${images && images.length > 0 ? `
                  <div class="images">
                    ${images.map(img => `<img src="${img.url}" alt="${img.caption || 'Update image'}" />`).join('')}
                  </div>
                ` : ''}
              </div>
              
              <p>Your support has made this progress possible. Thank you for believing in this cause!</p>
              
              <a href="${campaignUrl}" class="button">View Full Campaign</a>
              
              <p>Best regards,<br>
              ${creator.name}<br>
              Campaign Creator</p>
            </div>
            
            <div class="footer">
              <p>This email was sent because you donated to this campaign.</p>
              <p>If you have any questions, please contact us at support@crowdfunding.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    // Send emails to all donors
    const emailPromises = donors.map(async (donor) => {
      try {
        if (!donor.donor?.email && !donor.donorDetails?.email) return false;
        
        const mailOptions = emailTemplate(
          donor.donorDetails?.name || donor.donor?.name || 'Valued Supporter',
          donor.amount,
          donor.createdAt
        );
        mailOptions.to = donor.donorDetails?.email || donor.donor?.email;
        
        await transporter.sendMail(mailOptions);
        stats.successful++;
        return true;
      } catch (err) {
        console.error(`Failed to send email to ${donor.donorDetails?.email || donor.donor?.email}:`, err);
        stats.failed++;
        return false;
      }
    });
    
    await Promise.all(emailPromises);
    
    return {
      success: stats.successful > 0,
      stats,
      message: `Campaign improvement emails sent: ${stats.successful} successful, ${stats.failed} failed`,
      error: stats.failed > 0 ? `Failed to send ${stats.failed} emails` : null
    };
    
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send donation confirmation email
 * @param {Object} donationData - Donation information
 */
export const sendDonationConfirmation = async (donationData) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn('Email transporter not available. Skipping donation confirmation email.');
      return {
        success: false,
        error: 'Email service not configured'
      };
    }
    
    const { 
      campaign, 
      donor, 
      amount, 
      currency, 
      transactionId, 
      donorDetails,
      message: donorMessage 
    } = donationData;
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const campaignUrl = `${baseUrl}/campaign/${campaign._id}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: donorDetails?.email || donor?.email,
      subject: `Thank you for your donation to "${campaign.title}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .donation-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🙏 Thank You!</h1>
              <p>Your donation has been received</p>
            </div>
            
            <div class="content">
              <p>Dear ${donorDetails?.name || donor?.name || 'Supporter'},</p>
              
              <p>Thank you for your generous donation to <strong>"${campaign.title}"</strong>!</p>
              
              <div class="donation-details">
                <h3>Donation Details:</h3>
                <p><strong>Amount:</strong> ${currency} ${amount}</p>
                <p><strong>Transaction ID:</strong> ${transactionId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                ${donorMessage ? `<p><strong>Your Message:</strong> "${donorMessage}"</p>` : ''}
              </div>
              
              <p>Your support makes a real difference and helps bring this campaign closer to its goal.</p>
              
              <a href="${campaignUrl}" class="button">View Campaign</a>
              
              <p>You will receive updates about the campaign's progress via email.</p>
              
              <p>Best regards,<br>
              The Crowdfunding Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'Donation confirmation email sent successfully'
    };
    
  } catch (error) {
    console.error('Donation confirmation email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send campaign update email to donors
 * @param {Object} campaignData - Campaign information
 * @param {Array} donors - List of donors to notify
 * @param {Object} updateData - Update information
 */
export const sendCampaignUpdateEmail = async (campaignData, donors, updateData) => {
  try {
    const transporter = createTransporter();
    
    const { title, _id: campaignId } = campaignData;
    const { title: updateTitle, content: updateContent } = updateData;
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const campaignUrl = `${baseUrl}/campaign/${campaignId}`;
    
    // Email template for campaign updates
    const emailTemplate = (donorName) => ({
      from: process.env.EMAIL_USER,
      subject: `Update: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4CAF50;">Campaign Update</h2>
          <p>Dear ${donorName},</p>
          <p>There's a new update for the campaign <strong>${title}</strong> that you supported:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
            <h3 style="margin-top: 0;">${updateTitle}</h3>
            <p>${updateContent}</p>
          </div>
          <p>You can view the full campaign and all updates <a href="${campaignUrl}">here</a>.</p>
          <p>Thank you for your continued support!</p>
          <p>Best regards,<br>The Crowdfunding Team</p>
        </div>
      `
    });
    
    // Send emails to all donors
    const emailPromises = donors.map(async (donor) => {
      try {
        const mailOptions = emailTemplate(
          donor.donorDetails?.name || donor.donor?.name || 'Valued Supporter'
        );
        
        mailOptions.to = donor.donorDetails?.email || donor.donor?.email;
        
        if (mailOptions.to) {
          await transporter.sendMail(mailOptions);
          return { success: true, email: mailOptions.to };
        }
        return { success: false, error: 'No email address found' };
      } catch (error) {
        return { success: false, error: error.message, email: donor.donorDetails?.email };
      }
    });
    
    const results = await Promise.all(emailPromises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      success: true,
      message: `Campaign update emails sent successfully`,
      stats: {
        total: donors.length,
        successful,
        failed
      },
      results
    };
    
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send campaign creation confirmation to creator
 * @param {Object} campaignData - Campaign information
 */
export const sendCampaignCreationConfirmation = async (campaignData) => {
  try {
    const transporter = createTransporter();
    
    const { title, creator, _id: campaignId, qrCode } = campaignData;
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const campaignUrl = `${baseUrl}/campaign/${campaignId}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: creator.email,
      subject: `Your campaign "${title}" has been created successfully!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .qr-section { text-align: center; background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Campaign Created!</h1>
              <p>Your campaign is now live</p>
            </div>
            
            <div class="content">
              <p>Dear ${creator.name},</p>
              
              <p>Congratulations! Your campaign <strong>"${title}"</strong> has been created successfully and is now live on our platform.</p>
              
              ${qrCode && qrCode.imageUrl ? `
                <div class="qr-section">
                  <h3>Your Campaign QR Code</h3>
                  <img src="${qrCode.imageUrl}" alt="Campaign QR Code" style="max-width: 200px;" />
                  <p>Share this QR code to make donations easy for your supporters!</p>
                </div>
              ` : ''}
              
              <p>Here's what you can do next:</p>
              <ul>
                <li>Share your campaign with friends and family</li>
                <li>Post updates to keep supporters engaged</li>
                <li>Use the QR code for offline promotion</li>
                <li>Monitor your campaign's progress</li>
              </ul>
              
              <a href="${campaignUrl}" class="button">View Your Campaign</a>
              
              <p>Best of luck with your campaign!</p>
              
              <p>Best regards,<br>
              The Crowdfunding Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'Campaign creation confirmation email sent successfully'
    };
    
  } catch (error) {
    console.error('Campaign creation email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send campaign approval notification to creator
 * @param {Object} campaignData - Campaign information
 */
export const sendCampaignApprovalEmail = async (campaignData) => {
  try {
    const transporter = createTransporter();
    
    const { title, creator, _id: campaignId, moderation } = campaignData;
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const campaignUrl = `${baseUrl}/campaign/${campaignId}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: creator.email,
      subject: `🎉 Great News! Your campaign "${title}" has been approved!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .approval-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Campaign Approved!</h1>
              <p>Your campaign is now live and accepting donations</p>
            </div>
            
            <div class="content">
              <p>Dear ${creator.name},</p>
              
              <p>Congratulations! Your campaign <strong>"${title}"</strong> has been approved by our review team and is now live on our platform.</p>
              
              <div class="approval-box">
                <h3>✅ Approval Details</h3>
                <p><strong>Status:</strong> Approved</p>
                <p><strong>Reviewed on:</strong> ${new Date(moderation?.reviewedAt).toLocaleDateString('en-IN')}</p>
                ${moderation?.reviewNotes ? `<p><strong>Review Notes:</strong> ${moderation.reviewNotes}</p>` : ''}
              </div>
              
              <p>Your campaign is now visible to all users and ready to receive donations. Here's what you can do next:</p>
              <ul>
                <li>Share your campaign with friends, family, and social networks</li>
                <li>Post regular updates to keep supporters engaged</li>
                <li>Thank your donors and build a community around your cause</li>
                <li>Monitor your campaign's progress through your dashboard</li>
              </ul>
              
              <a href="${campaignUrl}" class="button">View Your Live Campaign</a>
              
              <p>Thank you for using our platform to make a positive impact!</p>
              
              <p>Best regards,<br>
              The Crowdfunding Team</p>
            </div>
            
            <div class="footer">
              <p>This email was sent because your campaign status was updated.</p>
              <p>If you have any questions, please contact us at support@crowdfunding.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'Campaign approval email sent successfully'
    };
    
  } catch (error) {
    console.error('Campaign approval email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send campaign rejection notification to creator
 * @param {Object} campaignData - Campaign information
 */
export const sendCampaignRejectionEmail = async (campaignData) => {
  try {
    const transporter = createTransporter();
    
    const { title, creator, _id: campaignId, moderation } = campaignData;
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const campaignUrl = `${baseUrl}/campaign/${campaignId}`;
    const editUrl = `${baseUrl}/campaigns/edit/${campaignId}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: creator.email,
      subject: `Important: Your campaign "${title}" requires attention`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .rejection-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545; }
            .action-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .button-secondary { background: #6c757d; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Campaign Review Update</h1>
              <p>Your campaign requires some adjustments</p>
            </div>
            
            <div class="content">
              <p>Dear ${creator.name},</p>
              
              <p>Thank you for submitting your campaign <strong>"${title}"</strong>. After careful review, our team has identified some areas that need attention before we can approve your campaign.</p>
              
              <div class="rejection-box">
                <h3>📋 Review Details</h3>
                <p><strong>Status:</strong> Requires Changes</p>
                <p><strong>Reviewed on:</strong> ${new Date(moderation?.reviewedAt).toLocaleDateString('en-IN')}</p>
                ${moderation?.reviewNotes ? `<p><strong>Required Changes:</strong><br>${moderation.reviewNotes}</p>` : ''}
              </div>
              
              <div class="action-box">
                <h3>🔧 Next Steps</h3>
                <p>Please review the feedback above and make the necessary changes to your campaign. Once you've addressed these points, you can resubmit your campaign for review.</p>
              </div>
              
              <p>Common areas to check:</p>
              <ul>
                <li>Ensure all campaign details are complete and accurate</li>
                <li>Verify that images are clear and relevant</li>
                <li>Check that your campaign description is detailed and compelling</li>
                <li>Make sure your funding goal and timeline are realistic</li>
                <li>Ensure compliance with our community guidelines</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${editUrl}" class="button">Edit Your Campaign</a>
                <a href="${campaignUrl}" class="button button-secondary">View Campaign</a>
              </div>
              
              <p>We're here to help you succeed! If you have any questions about the feedback or need assistance with your campaign, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>
              The Crowdfunding Team</p>
            </div>
            
            <div class="footer">
              <p>This email was sent because your campaign status was updated.</p>
              <p>If you have any questions, please contact us at support@crowdfunding.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'Campaign rejection email sent successfully'
    };
    
  } catch (error) {
    console.error('Campaign rejection email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendCampaignImprovementEmail,
  sendDonationConfirmation,
  sendCampaignCreationConfirmation,
  sendCampaignApprovalEmail,
  sendCampaignRejectionEmail
};
