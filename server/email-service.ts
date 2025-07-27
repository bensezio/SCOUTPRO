import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not found. Email functionality will be disabled.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email templates
const templates = {
  verification: (userName: string, userEmail: string): EmailTemplate => ({
    subject: 'Account Verified - Welcome to Platinum Scout',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Platinum Scout</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">AI-Powered Football Data Solutions Platform</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0;">Account Verified Successfully!</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Dear ${userName},
          </p>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Congratulations! Your account has been verified by our admin team. You now have full access to all Platinum Scout features:
          </p>
          
          <ul style="color: #475569; font-size: 16px; line-height: 1.8; padding-left: 20px;">
            <li>Global player database with focus on underrepresented regions</li>
            <li>AI-powered player analysis and comparisons</li>
            <li>Professional scouting reports and insights</li>
            <li>Advanced video analysis and performance tracking</li>
            <li>Transfer market intelligence and valuation</li>
          </ul>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.VITE_APP_URL || 'https://platinumedge-analytics.replit.app'}" 
               style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            If you have any questions, our support team is here to help.<br>
            Email: info@platinumscout.ai
          </p>
        </div>
      </div>
    `,
    text: `
      Platinum Scout - Account Verified

      Dear ${userName},

      Congratulations! Your account has been verified by our admin team. You now have full access to all Platinum Scout features:

      - Global player database with focus on underrepresented regions
      - AI-powered player analysis and comparisons
      - Professional scouting reports and insights
      - Advanced video analysis and performance tracking
      - Transfer market intelligence and valuation

      Access your dashboard: ${process.env.VITE_APP_URL || 'https://platinumscout.replit.app'}

      If you have any questions, our support team is here to help.
      Email: support@platinumedge.com
    `
  }),

  welcome: (userName: string): EmailTemplate => ({
    subject: 'Welcome to PlatinumEdge Analytics - Account Under Review',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">PlatinumEdge Analytics</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Africa-First Football Scouting Platform</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0;">Welcome to the Future of Football Scouting!</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Dear ${userName},
          </p>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Thank you for registering with PlatinumEdge Analytics, the premier AI-powered football scouting platform specializing in African talent discovery.
          </p>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">Account Under Review</h3>
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              Your account is currently under review by our admin team. You'll receive a verification email once approved, typically within 24-48 hours.
            </p>
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Once verified, you'll have access to:
          </p>
          
          <ul style="color: #475569; font-size: 16px; line-height: 1.8; padding-left: 20px;">
            <li>🎯 Comprehensive African player database</li>
            <li>🤖 AI-powered analysis and comparisons</li>
            <li>📊 Professional scouting reports</li>
            <li>🎥 Video analysis tools</li>
            <li>💰 Transfer market intelligence</li>
          </ul>
          
          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Questions? Contact us at support@platinumedge.com
          </p>
        </div>
      </div>
    `,
    text: `
      PlatinumEdge Analytics - Welcome

      Dear ${userName},

      Thank you for registering with PlatinumEdge Analytics, the premier AI-powered football scouting platform specializing in African talent discovery.

      Account Under Review:
      Your account is currently under review by our admin team. You'll receive a verification email once approved, typically within 24-48 hours.

      Once verified, you'll have access to:
      - Comprehensive African player database
      - AI-powered analysis and comparisons
      - Professional scouting reports
      - Video analysis tools
      - Transfer market intelligence

      Questions? Contact us at support@platinumedge.com
    `
  }),

  custom: (subject: string, content: string, userName: string): EmailTemplate => ({
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">PlatinumEdge Analytics</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Africa-First Football Scouting Platform</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Dear ${userName},
          </p>
          
          <div style="color: #475569; font-size: 16px; line-height: 1.6; white-space: pre-line;">
            ${content}
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Best regards,<br>
            PlatinumEdge Analytics Team<br>
            support@platinumedge.com
          </p>
        </div>
      </div>
    `,
    text: `
      PlatinumEdge Analytics

      Dear ${userName},

      ${content}

      Best regards,
      PlatinumEdge Analytics Team
      support@platinumedge.com
    `
  })
};

interface SendEmailOptions {
  to: string;
  templateType: 'verification' | 'welcome' | 'custom';
  userName: string;
  customSubject?: string;
  customContent?: string;
  fromEmail?: string;
  fromName?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Email not sent.');
    return false;
  }

  try {
    let template: EmailTemplate;

    switch (options.templateType) {
      case 'verification':
        template = templates.verification(options.userName, options.to);
        break;
      case 'welcome':
        template = templates.welcome(options.userName);
        break;
      case 'custom':
        if (!options.customSubject || !options.customContent) {
          throw new Error('Custom subject and content are required for custom emails');
        }
        template = templates.custom(options.customSubject, options.customContent, options.userName);
        break;
      default:
        throw new Error(`Unknown template type: ${options.templateType}`);
    }

    const msg = {
      to: options.to,
      from: {
        email: options.fromEmail || 'noreply@platinumscout.ai',
        name: options.fromName || 'Platinum Scout'
      },
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Helper function for verification emails
export async function sendVerificationEmail(userEmail: string, userName: string): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    templateType: 'verification',
    userName,
  });
}

// Helper function for welcome emails
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    templateType: 'welcome',
    userName,
  });
}

// Helper function for custom admin emails
export async function sendCustomEmail(
  userEmail: string, 
  userName: string, 
  subject: string, 
  content: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    templateType: 'custom',
    userName,
    customSubject: subject,
    customContent: content,
  });
}

// Contact form email interface
interface ContactFormData {
  customerName: string;
  customerEmail: string;
  organization: string;
  phone: string;
  inquiryType: string;
  subject: string;
  message: string;
}

// Send contact form notification to Platinum Scout team
export async function sendContactFormEmail(data: ContactFormData): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Contact form email not sent.');
    return false;
  }

  try {
    const msg = {
      to: 'info@platinumscout.ai',
      from: {
        email: 'noreply@platinumscout.ai',
        name: 'Platinum Scout Contact Form'
      },
      replyTo: data.customerEmail,
      subject: `New Contact Form Submission: ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">Platinum Scout Contact Form</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">Customer Details</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 30%;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${data.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${data.customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Phone:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${data.phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Organization:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${data.organization || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Inquiry Type:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${data.inquiryType}</td>
              </tr>
            </table>
            
            <h3 style="color: #1e293b; margin: 20px 0 10px 0; font-size: 16px;">Subject:</h3>
            <p style="color: #475569; background: white; padding: 12px; border-radius: 4px; border-left: 4px solid #3b82f6; margin: 0 0 20px 0;">
              ${data.subject}
            </p>
            
            <h3 style="color: #1e293b; margin: 20px 0 10px 0; font-size: 16px;">Message:</h3>
            <div style="color: #475569; background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6; line-height: 1.6;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                This email was sent from the Platinum Scout contact form.<br>
                Timestamp: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission - Platinum Scout

Customer Details:
Name: ${data.customerName}
Email: ${data.customerEmail}
Phone: ${data.phone || 'Not provided'}
Organization: ${data.organization || 'Not provided'}
Inquiry Type: ${data.inquiryType}

Subject: ${data.subject}

Message:
${data.message}

---
This email was sent from the Platinum Scout contact form.
Timestamp: ${new Date().toLocaleString()}
      `
    };

    await sgMail.send(msg);
    console.log(`Contact form email sent successfully to info@platinumscout.ai from ${data.customerEmail}`);
    return true;
  } catch (error) {
    console.error('SendGrid contact form email error:', error);
    return false;
  }
}