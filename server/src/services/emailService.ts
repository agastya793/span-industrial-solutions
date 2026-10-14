import { Resend } from 'resend';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { InquiryRecord } from '../types/inquiry.js';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  statusCode?: number | null;
  error?: string;
  skipped?: boolean;
}

let cachedResendApiKey: string | null = null;
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const currentKey = config.resendApiKey;
  if (!currentKey) {
    return null;
  }
  if (!resendClient || cachedResendApiKey !== currentKey) {
    resendClient = new Resend(currentKey);
    cachedResendApiKey = currentKey;
  }
  return resendClient;
}

/**
 * Escapes characters to prevent HTML injection inside email templates.
 */
function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates an executive-styled HTML email notification template
 * matching SPAN Industrial Solutions branding.
 */
export function generateInquiryEmailHtml(inquiry: InquiryRecord): string {
  const safeName = escapeHtml(inquiry.name);
  const safeCompany = escapeHtml(inquiry.company);
  const safeEmail = escapeHtml(inquiry.email);
  const safePhone = escapeHtml(inquiry.phone);
  const safeService = escapeHtml(inquiry.service);
  const rawLocation = [inquiry.city, inquiry.state].filter(Boolean).join(', ');
  const safeLocation = rawLocation ? escapeHtml(rawLocation) : '';
  const hasCustomMessage = Boolean(inquiry.message && inquiry.message.trim());
  const safeMessage = hasCustomMessage
    ? escapeHtml(inquiry.message!).replace(/\n/g, '<br />')
    : '';
  const formattedDate = new Date(inquiry.created_at || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const locationRow = safeLocation
    ? `<tr style="background-color: #f8fafc;">
         <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">
           Location / Industrial Hub
         </td>
         <td style="padding: 10px 16px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
           ${safeLocation}
         </td>
       </tr>`
    : '';

  const messageBox = hasCustomMessage
    ? `<div style="margin-bottom: 24px;">
         <span style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
           Requirement Details & Message:
         </span>
         <div style="background-color: #f8fafc; border-left: 4px solid #0b2545; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 0 6px 6px 0; padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
${safeMessage}
         </div>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Corporate Enquiry - SPAN Industrial Solutions</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0b2545 0%, #134074 100%); padding: 28px 32px; color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #38bdf8; display: block; margin-bottom: 4px;">
                      SPAN Industrial Solutions Pvt Ltd
                    </span>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                      New Corporate Enquiry Received
                    </h1>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #e0f2fe; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;">
                      Ref #${inquiry.id || 'N/A'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Alert Bar -->
          <tr>
            <td style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 32px; font-size: 13px; color: #64748b;">
              Submitted on: <strong style="color: #334155;">${formattedDate} IST</strong>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155;">
                A new corporate enquiry has been submitted through the website. The details provided by the visitor are summarized below:
              </p>

              <!-- Visitor Information Table (5 Retained Core Fields) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #64748b; width: 35%; border-bottom: 1px solid #e2e8f0;">
                    Visitor Name
                  </td>
                  <td style="padding: 10px 16px; font-size: 14px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                    ${safeName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">
                    Organization / Company
                  </td>
                  <td style="padding: 10px 16px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                    ${safeCompany}
                  </td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">
                    Work Email
                  </td>
                  <td style="padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e2e8f0;">
                    <a href="mailto:${safeEmail}" style="color: #0284c7; text-decoration: none; font-weight: 500;">
                      ${safeEmail}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">
                    Contact Telephone
                  </td>
                  <td style="padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e2e8f0;">
                    <a href="tel:${safePhone}" style="color: #0284c7; text-decoration: none; font-weight: 500;">
                      ${safePhone}
                    </a>
                  </td>
                </tr>
                ${locationRow}
                <tr style="background-color: ${locationRow ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #64748b;">
                    Service Vertical Requested
                  </td>
                  <td style="padding: 10px 16px; font-size: 14px; font-weight: 600; color: #0b2545;">
                    ${safeService}
                  </td>
                </tr>
              </table>

              ${messageBox}

              <!-- Quick Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
                <tr>
                  <td style="border-radius: 6px; background-color: #0b2545;">
                    <a href="mailto:${safeEmail}?subject=Re:%20Corporate%20Enquiry%20-%20SPAN%20Industrial%20Solutions" target="_blank" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
                      Reply Directly to ${safeName} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b2545; padding: 24px 32px; color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #1e3a8a;">
              <p style="margin: 0 0 8px 0; color: #cbd5e1; font-weight: 600;">
                SPAN Industrial Solutions Pvt Ltd
              </p>
              <p style="margin: 0 0 6px 0;">
                C5 Rampur Road, Preet Vihar, Rudrapur, US Nagar, Uttarakhand - 263153
              </p>
              <p style="margin: 0; color: #64748b; font-size: 11px;">
                Automated enquiry notification dispatched securely to INFOSPAN.UKD@gmail.com.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates clean plain text fallback for text-only email clients.
 */
export function generateInquiryEmailText(inquiry: InquiryRecord): string {
  const formattedDate = new Date(inquiry.created_at || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });
  const locationText = [inquiry.city, inquiry.state].filter(Boolean).join(', ');
  const locationLine = locationText ? `Location:     ${locationText}\n` : '';
  const messageBlock = inquiry.message && inquiry.message.trim()
    ? `\nREQUIREMENT DETAILS / MESSAGE:\n-----------------------------------------------------\n${inquiry.message}\n`
    : '';

  return `=====================================================
NEW CORPORATE ENQUIRY - SPAN INDUSTRIAL SOLUTIONS
=====================================================
Reference ID: #${inquiry.id || 'N/A'}
Received: ${formattedDate} IST

VISITOR DETAILS:
-----------------------------------------------------
Name:         ${inquiry.name}
Company:      ${inquiry.company}
Work Email:   ${inquiry.email}
Phone:        ${inquiry.phone}
${locationLine}Service:      ${inquiry.service}
${messageBlock}
=====================================================
Reply directly by emailing: ${inquiry.email}
SPAN Industrial Solutions Pvt Ltd | Rudrapur, Uttarakhand
=====================================================`;
}

/**
 * Dispatches an email notification to the company corporate inbox
 * via Resend API.
 */
export async function sendInquiryNotificationEmail(
  inquiry: InquiryRecord
): Promise<EmailSendResult> {
  const client = getResendClient();

  if (!client) {
    logger.warn(`Email notification skipped: RESEND_API_KEY is not configured for inquiry #${inquiry.id}.`);
    return {
      success: false,
      skipped: true,
      error: 'RESEND_API_KEY is not configured.',
    };
  }

  const recipient = (config.resendToEmail || 'infospan.ukd@gmail.com').trim().toLowerCase();
  const sender = config.resendFromEmail || 'SPAN Industrial Solutions <notifications@spanindustrialsolutions.com>';
  const subject = `New Corporate Enquiry - SPAN Industrial Solutions: ${inquiry.company} [${inquiry.service}]`;

  const html = generateInquiryEmailHtml(inquiry);
  const text = generateInquiryEmailText(inquiry);

  try {
    const { data, error } = await client.emails.send({
      from: sender,
      to: [recipient],
      replyTo: inquiry.email,
      subject,
      html,
      text,
    });

    if (error) {
      const statusCode = (error as any).statusCode || (error as any).status || 400;
      const errorType = error.name || 'validation_error';
      logger.error(
        `Resend email delivery failure for inquiry #${inquiry.id}: ` +
        `status=${statusCode}, type=${errorType}, message=${error.message}`
      );
      return {
        success: false,
        statusCode,
        error: error.message,
      };
    }

    logger.info(
      `Email notification successfully sent for inquiry #${inquiry.id} ` +
      `(Resend Message ID: ${data?.id}, HTTP Status: 200, Recipient: ${recipient})`
    );
    return {
      success: true,
      statusCode: 200,
      messageId: data?.id,
    };
  } catch (err: any) {
    const statusCode = err?.statusCode || err?.status || 500;
    logger.error(
      `Unexpected error during email delivery for inquiry #${inquiry.id}: ` +
      `status=${statusCode}, message=${err.message || 'Unknown email delivery error'}`
    );
    return {
      success: false,
      statusCode,
      error: err.message || 'Unknown email delivery error',
    };
  }
}
