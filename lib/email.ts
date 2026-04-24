import nodemailer from 'nodemailer'

// Configure nodemailer transport using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_APP_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface SendPasswordResetEmailParams {
  to: string
  resetToken: string
}

/**
 * Send a password reset email to the user with a secure reset link.
 * The link expires in 1 hour.
 */
export async function sendPasswordResetEmail({
  to,
  resetToken,
}: SendPasswordResetEmailParams): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: `"Finance Tracker" <${process.env.GMAIL_APP_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
              font-size: 24px;
            }
            .content {
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 30px;
              border-radius: 6px;
              font-weight: 600;
              text-align: center;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .code {
              background-color: #f3f4f6;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your Finance Tracker account. Click the button below to create a new password:</p>
            </div>

            <div class="button-container">
              <a
                href="${resetUrl}"
                style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;line-height:1;mso-padding-alt:0px;"
              >Reset Your Password</a>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in <strong>1 hour</strong> for security reasons.
            </div>

            <div class="content">
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p class="code">${resetUrl}</p>
            </div>

            <div class="footer">
              <p><strong>Didn't request this?</strong></p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <p style="margin-top: 20px;">
                This is an automated email, please do not reply.<br>
                © ${new Date().getFullYear()} Finance Tracker. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Password Reset Request

Hello,

We received a request to reset your password for your Finance Tracker account.

To reset your password, click the following link (expires in 1 hour):
${resetUrl}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Finance Tracker. All rights reserved.
    `,
  }

  await transporter.sendMail(mailOptions)
}
