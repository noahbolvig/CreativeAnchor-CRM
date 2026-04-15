import api from './api';

export interface SendInvoiceEmailParams {
  invoiceId: string;
}

export interface SendPaymentReminderParams {
  invoiceId: string;
}

export interface SendCustomEmailParams {
  clientId: string;
  subject: string;
  message: string;
}

class EmailService {
  /**
   * Send invoice email to client
   */
  async sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 Sending invoice email...');
      const response = await api.post('/email/send-invoice', params);
      console.log('✅ Invoice email sent');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send invoice email:', error);
      throw new Error(error.response?.data?.error || 'Failed to send email');
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(params: SendPaymentReminderParams): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 Sending payment reminder...');
      const response = await api.post('/email/send-reminder', params);
      console.log('✅ Payment reminder sent');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send payment reminder:', error);
      throw new Error(error.response?.data?.error || 'Failed to send reminder');
    }
  }

  /**
   * Send custom email to client
   */
  async sendCustomEmail(params: SendCustomEmailParams): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 Sending custom email...');
      const response = await api.post('/email/send-custom', params);
      console.log('✅ Custom email sent');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send custom email:', error);
      throw new Error(error.response?.data?.error || 'Failed to send email');
    }
  }
}

export const emailService = new EmailService();