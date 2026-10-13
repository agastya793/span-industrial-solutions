import { insertInquiry } from '../config/db.js';
import { sendInquiryNotificationEmail } from './emailService.js';
import type { InquiryInput, InquiryRecord } from '../types/inquiry.js';
import { logger } from '../utils/logger.js';

export async function processInquiry(data: InquiryInput): Promise<InquiryRecord> {
  logger.info(`Processing inquiry for service vertical: ${data.service} (${data.company})`);
  const record = await insertInquiry(data);

  // Trigger email notification to corporate recipient (infospan.ukd@gmail.com)
  try {
    const emailResult = await sendInquiryNotificationEmail(record);
    if (!emailResult.success && !emailResult.skipped) {
      logger.warn(
        `Inquiry #${record.id} persisted to database, but email notification delivery failed ` +
        `(Status: ${emailResult.statusCode || 'N/A'}, Error: ${emailResult.error})`
      );
    }
  } catch (emailErr: any) {
    logger.error(`Gracefully caught email delivery error for inquiry #${record.id}: ${emailErr.message}`);
  }

  return record;
}
