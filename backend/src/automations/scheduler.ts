import cron from 'node-cron';
import { runAllAutomations } from './automationService';

// Schedule automations to run daily at 9 AM
export function startAutomationScheduler() {
  console.log('🚀 Starting automation scheduler...');

  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Daily automation check triggered at 9 AM');
    await runAllAutomations();
  });

  // Also run every 6 hours for more frequent checks
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ 6-hour automation check triggered');
    await runAllAutomations();
  });

  console.log('✅ Automation scheduler started!');
  console.log('📅 Daily checks at 9 AM');
  console.log('🔄 Additional checks every 6 hours');
}

// For testing - run automations immediately
export async function runAutomationsNow() {
  console.log('🧪 Running automations manually...');
  await runAllAutomations();
}