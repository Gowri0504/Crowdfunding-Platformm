import cron from 'node-cron';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import { sendCampaignImprovementEmail } from './emailService.js';

// Set a longer timeout for email operations
const EMAIL_TIMEOUT = 30000; // 30 seconds

/**
 * Monthly email service to send thank you emails to donors
 * Runs on the 1st day of every month at 9:00 AM
 */
class MonthlyEmailService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the monthly email cron job
   */
  start() {
    if (this.isRunning) {
      console.log('Monthly email service is already running');
      return;
    }

    // Schedule to run on 1st day of every month at 9:00 AM
    cron.schedule('0 9 1 * *', async () => {
      console.log('Starting monthly donor thank you emails...');
      await this.sendMonthlyThankYouEmails();
    });

    this.isRunning = true;
    console.log('Monthly email service started - will run on 1st day of every month at 9:00 AM');
  }

  /**
   * Stop the monthly email service
   */
  stop() {
    this.isRunning = false;
    console.log('Monthly email service stopped');
  }

  /**
   * Send monthly thank you emails to all donors
   */
  async sendMonthlyThankYouEmails() {
    try {
      const currentDate = new Date();
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      console.log(`Sending monthly emails for period: ${lastMonth.toDateString()} to ${thisMonth.toDateString()}`);

      // Get all active campaigns
      const campaigns = await Campaign.find({ 
        status: 'active',
        createdAt: { $lt: thisMonth } // Only campaigns created before this month
      }).populate('creator', 'name email');

      for (const campaign of campaigns) {
        await this.sendCampaignMonthlyUpdate(campaign, lastMonth, thisMonth);
      }

      console.log('Monthly donor thank you emails completed successfully');
    } catch (error) {
      console.error('Error sending monthly thank you emails:', error);
    }
  }

  /**
   * Send monthly update for a specific campaign
   */
  async sendCampaignMonthlyUpdate(campaign, startDate, endDate) {
    try {
      // Get all donations for this campaign in the last month
      const monthlyDonations = await Donation.find({
        campaign: campaign._id,
        createdAt: { $gte: startDate, $lt: endDate },
        paymentStatus: 'completed'
      }).populate('donor', 'name email');

      // Get all unique donors who have ever donated to this campaign
      const allDonors = await Donation.find({
        campaign: campaign._id,
        paymentStatus: 'completed',
        isAnonymous: false
      }).populate('donor', 'name email').distinct('donor');

      if (allDonors.length === 0) {
        console.log(`No donors found for campaign: ${campaign.title}`);
        return;
      }

      // Calculate monthly statistics
      const monthlyTotal = monthlyDonations.reduce((sum, donation) => sum + donation.amount, 0);
      const monthlyDonorCount = new Set(monthlyDonations.map(d => d.donor._id.toString())).size;

      // Create monthly update content
      const updateData = {
        title: `Monthly Update - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        content: this.generateMonthlyUpdateContent(campaign, monthlyTotal, monthlyDonorCount, monthlyDonations.length),
        images: [] // Can be extended to include campaign images
      };

      // Get donor information for emails
      const donorData = await Promise.all(
        allDonors.map(async (donorId) => {
          const donor = await User.findById(donorId);
          const donorDonations = await Donation.find({
            campaign: campaign._id,
            donor: donorId,
            paymentStatus: 'completed'
          });

          const totalDonated = donorDonations.reduce((sum, d) => sum + d.amount, 0);
          const firstDonation = donorDonations.sort((a, b) => a.createdAt - b.createdAt)[0];

          return {
            name: donor.name,
            email: donor.email,
            totalDonated,
            firstDonationDate: firstDonation.createdAt
          };
        })
      );

      // Send emails to all donors
      await sendCampaignImprovementEmail(campaign, donorData, updateData);
      
      console.log(`Monthly update sent for campaign: ${campaign.title} to ${donorData.length} donors`);
    } catch (error) {
      console.error(`Error sending monthly update for campaign ${campaign.title}:`, error);
    }
  }

  /**
   * Generate monthly update content
   */
  generateMonthlyUpdateContent(campaign, monthlyTotal, monthlyDonorCount, monthlyDonationCount) {
    const progressPercentage = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
    
    return `
      <div style="margin: 20px 0;">
        <h3>🎉 Monthly Campaign Update</h3>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <h4>📊 Campaign Progress</h4>
          <p><strong>Total Raised:</strong> ₹${campaign.raisedAmount.toLocaleString()} of ₹${campaign.goalAmount.toLocaleString()} (${progressPercentage}%)</p>
          <p><strong>Total Donors:</strong> ${campaign.donorsCount}</p>
          
          <div style="background: #e9ecef; border-radius: 10px; height: 20px; margin: 10px 0;">
            <div style="background: linear-gradient(90deg, #28a745, #20c997); height: 100%; border-radius: 10px; width: ${Math.min(progressPercentage, 100)}%;"></div>
          </div>
        </div>

        ${monthlyTotal > 0 ? `
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <h4>📈 This Month's Impact</h4>
          <p><strong>New Donations:</strong> ₹${monthlyTotal.toLocaleString()} from ${monthlyDonorCount} donors (${monthlyDonationCount} donations)</p>
          <p>Thanks to your continued support, we're making great progress toward our goal!</p>
        </div>
        ` : `
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <h4>💝 Your Support Matters</h4>
          <p>While we didn't receive new donations this month, your previous contribution continues to make a difference. Every donation, no matter when it was made, brings us closer to our goal.</p>
        </div>
        `}

        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <h4>🙏 Thank You Message</h4>
          <p>Your generosity and belief in our cause continue to inspire us every day. We're committed to using your donations responsibly and keeping you updated on our progress.</p>
          <p>Together, we're making a real difference in the world!</p>
        </div>

        <div style="margin: 20px 0; text-align: center;">
          <p style="color: #666; font-size: 14px;">
            <em>This is an automated monthly update. We send these to keep you informed about the campaigns you've supported.</em>
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Send immediate thank you email for new donations
   */
  async sendImmediateThankYou(donationData) {
    try {
      const { donation, campaign, donor } = donationData;
      
      const updateData = {
        title: `Thank You for Your Donation! 🎉`,
        content: `
          <div style="text-align: center; margin: 20px 0;">
            <h2 style="color: #28a745;">Thank You for Your Generous Donation!</h2>
            <p style="font-size: 18px; color: #666;">Your contribution of <strong>₹${donation.amount}</strong> to "${campaign.title}" has been received successfully.</p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Donation Details</h3>
            <p><strong>Amount:</strong> ₹${donation.amount}</p>
            <p><strong>Campaign:</strong> ${campaign.title}</p>
            <p><strong>Date:</strong> ${new Date(donation.createdAt).toLocaleDateString('en-IN')}</p>
            <p><strong>Transaction ID:</strong> ${donation.transactionId}</p>
            ${donation.message ? `<p><strong>Your Message:</strong> "${donation.message}"</p>` : ''}
          </div>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🎯 Impact of Your Donation</h3>
            <p>Your donation brings us closer to our goal of ₹${campaign.goalAmount.toLocaleString()}. We now have ₹${campaign.raisedAmount.toLocaleString()} raised from ${campaign.donorsCount} generous donors like you!</p>
            <p>Progress: ${Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}% complete</p>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📧 Stay Updated</h3>
            <p>You'll receive monthly updates about this campaign's progress. We'll keep you informed about how your donation is making a difference!</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 16px; color: #333;">Once again, thank you for your kindness and generosity!</p>
            <p style="color: #666;">Together, we're making the world a better place. 🌟</p>
          </div>
        `,
        images: []
      };

      await sendCampaignImprovementEmail(
        campaign, 
        [{
          name: donor.name,
          email: donor.email,
          totalDonated: donation.amount,
          firstDonationDate: donation.createdAt
        }], 
        updateData
      );

      console.log(`Immediate thank you email sent to ${donor.email} for donation to ${campaign.title}`);
    } catch (error) {
      console.error('Error sending immediate thank you email:', error);
    }
  }
}

// Create singleton instance
const monthlyEmailService = new MonthlyEmailService();

export default monthlyEmailService;