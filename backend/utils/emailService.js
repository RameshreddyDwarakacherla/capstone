const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email service connection error:', error);
    return false;
  }
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} options.html - HTML email body (optional)
 * @returns {Promise<Object>} - Nodemailer send response
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"Civic Reporter" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a verification email to a new user
 * @param {Object} user - User object
 * @param {string} verificationToken - Token for email verification
 * @returns {Promise<Object>} - Email send result
 */
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${user.email}`;
  
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - Civic Reporter',
    text: `Hello ${user.name},\n\nThank you for registering with Civic Reporter. Please verify your email by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.\n\nRegards,\nThe Civic Reporter Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Verify Your Email Address</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering with Civic Reporter. Please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #4b5563;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Regards,<br>The Civic Reporter Team</p>
      </div>
    `,
  });
};

/**
 * Send a password reset email
 * @param {Object} user - User object
 * @param {string} resetToken - Token for password reset
 * @returns {Promise<Object>} - Email send result
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${user.email}`;
  
  return sendEmail({
    to: user.email,
    subject: 'Password Reset - Civic Reporter',
    text: `Hello ${user.name},\n\nYou requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.\n\nRegards,\nThe Civic Reporter Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #4b5563;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Regards,<br>The Civic Reporter Team</p>
      </div>
    `,
  });
};

/**
 * Send a notification email to admin about an urgent issue
 * @param {Object} admin - Admin user object
 * @param {Object} issue - Issue object
 * @returns {Promise<Object>} - Email send result
 */
const sendUrgentIssueNotification = async (admin, issue) => {
  const issueUrl = `${process.env.FRONTEND_URL}/admin/issues/${issue._id}`;
  
  return sendEmail({
    to: admin.email,
    subject: `URGENT: New High Priority Issue - ${issue.title}`,
    text: `Hello ${admin.name},\n\nA new high priority issue has been reported and requires your attention.\n\nIssue: ${issue.title}\nCategory: ${issue.category}\nPriority: ${issue.priority}\nLocation: ${issue.location.address}\nReported by: ${issue.user.name}\n\nPlease review this issue as soon as possible: ${issueUrl}\n\nRegards,\nThe Civic Reporter System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">URGENT: New High Priority Issue</h2>
        <p>Hello ${admin.name},</p>
        <p>A new high priority issue has been reported and requires your attention.</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p><strong>Issue:</strong> ${issue.title}</p>
          <p><strong>Category:</strong> ${issue.category}</p>
          <p><strong>Priority:</strong> ${issue.priority}</p>
          <p><strong>Location:</strong> ${issue.location.address}</p>
          <p><strong>Reported by:</strong> ${issue.user.name}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${issueUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Issue</a>
        </div>
        <p>Please review this issue as soon as possible.</p>
        <p>Regards,<br>The Civic Reporter System</p>
      </div>
    `,
  });
};

/**
 * Send a status update notification to a user
 * @param {string} email - User's email address
 * @param {string} name - User's first name
 * @param {string} issueTitle - Title of the issue
 * @param {string} newStatus - New status of the issue
 * @param {string} statusNotes - Notes about the status change
 * @param {string} issueUrl - URL to view the issue
 * @returns {Promise<Object>} - Email send result
 */
const sendStatusUpdateNotification = async (email, name, issueTitle, newStatus, statusNotes, issueUrl) => {
  // Map status to colors for HTML email
  const statusColors = {
    'New': '#f59e0b',
    'In Progress': '#3b82f6',
    'Resolved': '#10b981',
    'Closed': '#6b7280',
    'Reopened': '#ef4444'
  };
  
  const statusColor = statusColors[newStatus] || '#6b7280';
  
  return sendEmail({
    to: email,
    subject: `Issue Status Update: ${issueTitle}`,
    text: `Hello ${name},\n\nThe status of your reported issue has been updated.\n\nIssue: ${issueTitle}\nNew Status: ${newStatus}\n${statusNotes ? `Notes: ${statusNotes}\n` : ''}\nYou can view the full details here: ${issueUrl}\n\nThank you for using Civic Reporter.\n\nRegards,\nThe Civic Reporter Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Issue Status Update</h2>
        <p>Hello ${name},</p>
        <p>The status of your reported issue has been updated.</p>
        <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0;">
          <p><strong>Issue:</strong> ${issueTitle}</p>
          <p><strong>New Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${newStatus}</span></p>
          ${statusNotes ? `<p><strong>Notes:</strong> ${statusNotes}</p>` : ''}
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${issueUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Issue Details</a>
        </div>
        <p>Thank you for using Civic Reporter.</p>
        <p>Regards,<br>The Civic Reporter Team</p>
      </div>
    `,
  });
};

module.exports = {
  verifyConnection,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendUrgentIssueNotification,
  sendStatusUpdateNotification,
};