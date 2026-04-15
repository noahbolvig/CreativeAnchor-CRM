import prisma from '../config/prisma';
import nodemailer from 'nodemailer';

// Email configuration (you'll need to set up environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Helper to send email
async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (!process.env.SMTP_USER) {
      console.log('Email not configured. Would send:', { to, subject });
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// 1. DEADLINE REMINDERS
export async function checkDeadlineReminders() {
  console.log('Checking deadline reminders...');

  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  // Find projects with deadlines in 3 days (not completed)
  const upcomingDeadlines = await prisma.project.findMany({
    where: {
      deadline: {
        gte: today,
        lte: threeDaysFromNow,
      },
      status: {
        not: 'COMPLETED',
      },
    },
    include: {
      user: true,
      client: true,
    },
  });

  for (const project of upcomingDeadlines) {
    const daysUntil = Math.ceil(
      (new Date(project.deadline!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const subject = `Deadline Alert: ${project.title} due in ${daysUntil} days`;
    const html = `
      <h2>Project Deadline Reminder</h2>
      <p><strong>${project.title}</strong> is due in <strong>${daysUntil} days</strong>.</p>
      <p><strong>Deadline:</strong> ${new Date(project.deadline!).toLocaleDateString()}</p>
      ${project.client ? `<p><strong>Client:</strong> ${project.client.name}</p>` : ''}
      ${project.description ? `<p><strong>Description:</strong> ${project.description}</p>` : ''}
      <p>Don't forget to prepare for delivery!</p>
    `;

    await sendEmail(project.user.email, subject, html);
  }

  // Find overdue projects (deadline passed, not completed)
  const overdueProjects = await prisma.project.findMany({
    where: {
      deadline: {
        lt: today,
      },
      status: {
        not: 'COMPLETED',
      },
    },
    include: {
      user: true,
      client: true,
    },
  });

  for (const project of overdueProjects) {
    const daysOverdue = Math.ceil(
      (today.getTime() - new Date(project.deadline!).getTime()) / (1000 * 60 * 60 * 24)
    );

    const subject = `⚠️ OVERDUE: ${project.title} (${daysOverdue} days)`;
    const html = `
      <h2 style="color: #dc2626;">Project Overdue</h2>
      <p><strong>${project.title}</strong> is <strong style="color: #dc2626;">${daysOverdue} days overdue</strong>.</p>
      <p><strong>Original Deadline:</strong> ${new Date(project.deadline!).toLocaleDateString()}</p>
      ${project.client ? `<p><strong>Client:</strong> ${project.client.name}</p>` : ''}
      <p>Please update the client or complete the project.</p>
    `;

    await sendEmail(project.user.email, subject, html);
  }

  console.log(`Checked ${upcomingDeadlines.length} upcoming deadlines, ${overdueProjects.length} overdue`);
}

// 2. INVOICE PAYMENT REMINDERS
export async function checkInvoiceReminders() {
  console.log('Checking invoice reminders...');

  const today = new Date();

  // Find unpaid invoices that are overdue
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ['SENT', 'OVERDUE'],
      },
      dueDate: {
        lt: today,
      },
    },
    include: {
      project: {
        include: {
          user: true,
          client: true,
        },
      },
    },
  });

  for (const invoice of overdueInvoices) {
    if (!invoice.project?.user) continue;

    const daysOverdue = Math.ceil(
      (today.getTime() - new Date(invoice.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
    );

    const subject = `Payment Overdue: Invoice ${invoice.invoiceNumber}`;
    const html = `
      <h2>Invoice Payment Reminder</h2>
      <p>Invoice <strong>${invoice.invoiceNumber}</strong> is <strong>${daysOverdue} days overdue</strong>.</p>
      <p><strong>Amount:</strong> $${invoice.amount.toLocaleString()}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.dueDate!).toLocaleDateString()}</p>
      ${invoice.project.client ? `<p><strong>Client:</strong> ${invoice.project.client.name}</p>` : ''}
      <p>Consider sending a payment reminder to the client.</p>
    `;

    await sendEmail(invoice.project.user.email, subject, html);

    // Auto-update status to OVERDUE if not already
    if (invoice.status === 'SENT') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      });
    }
  }

  console.log(`Checked ${overdueInvoices.length} overdue invoices`);
}

// 3. QUOTE FOLLOW-UPS
export async function checkQuoteFollowUps() {
  console.log('Checking quote follow-ups...');

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Find projects in QUOTE status for 3+ days
  const staleQuotes = await prisma.project.findMany({
    where: {
      status: 'QUOTE',
      createdAt: {
        lte: threeDaysAgo,
      },
    },
    include: {
      user: true,
      client: true,
    },
  });

  for (const project of staleQuotes) {
    const daysWaiting = Math.ceil(
      (new Date().getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const subject = `Follow-up needed: Quote for ${project.title}`;
    const html = `
      <h2>Quote Follow-up Reminder</h2>
      <p>The quote for <strong>${project.title}</strong> has been pending for <strong>${daysWaiting} days</strong>.</p>
      ${project.client ? `<p><strong>Client:</strong> ${project.client.name}</p>` : ''}
      ${project.quotedAmount ? `<p><strong>Quote Amount:</strong> $${project.quotedAmount.toLocaleString()}</p>` : ''}
      <p>Consider following up with the client to move this forward.</p>
    `;

    await sendEmail(project.user.email, subject, html);
  }

  console.log(`Checked ${staleQuotes.length} stale quotes`);
}

// 4. PROJECT STUCK ALERTS
export async function checkStuckProjects() {
  console.log('Checking stuck projects...');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Find in-progress projects with no recent file uploads
  const stuckProjects = await prisma.project.findMany({
    where: {
      status: 'IN_PROGRESS',
      updatedAt: {
        lte: sevenDaysAgo,
      },
    },
    include: {
      user: true,
      client: true,
      _count: {
        select: { files: true },
      },
    },
  });

  for (const project of stuckProjects) {
    const daysStuck = Math.ceil(
      (new Date().getTime() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const subject = `Project Alert: ${project.title} has been inactive for ${daysStuck} days`;
    const html = `
      <h2>Project Inactivity Alert</h2>
      <p><strong>${project.title}</strong> has had no activity for <strong>${daysStuck} days</strong>.</p>
      ${project.client ? `<p><strong>Client:</strong> ${project.client.name}</p>` : ''}
      <p><strong>Files uploaded:</strong> ${project._count.files}</p>
      <p>This project might need attention or a status update.</p>
    `;

    await sendEmail(project.user.email, subject, html);
  }

  console.log(`Checked ${stuckProjects.length} stuck projects`);
}

// 5. WEEKLY SUMMARY
export async function sendWeeklySummary() {
  console.log('Generating weekly summaries...');

  const users = await prisma.user.findMany();

  for (const user of users) {
    // Get stats for the past week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalProjects,
      activeProjects,
      completedThisWeek,
      totalInvoices,
      paidInvoices,
      totalRevenue,
      upcomingDeadlines,
    ] = await Promise.all([
      prisma.project.count({ where: { userId: user.id } }),
      prisma.project.count({ 
        where: { 
          userId: user.id,
          status: { in: ['IN_PROGRESS', 'QUOTE', 'APPROVED'] }
        } 
      }),
      prisma.project.count({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          updatedAt: { gte: weekAgo },
        },
      }),
      prisma.invoice.count({
        where: { project: { userId: user.id } },
      }),
      prisma.invoice.count({
        where: {
          project: { userId: user.id },
          status: 'PAID',
        },
      }),
      prisma.invoice.aggregate({
        where: {
          project: { userId: user.id },
          status: 'PAID',
        },
        _sum: { amount: true },
      }),
      prisma.project.count({
        where: {
          userId: user.id,
          deadline: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          status: { not: 'COMPLETED' },
        },
      }),
    ]);

    const subject = `📊 Your Weekly CreativeAnchor Summary`;
    const html = `
      <h2>Your Week in Review</h2>
      
      <h3>📁 Projects</h3>
      <ul>
        <li><strong>${totalProjects}</strong> total projects</li>
        <li><strong>${activeProjects}</strong> currently active</li>
        <li><strong>${completedThisWeek}</strong> completed this week 🎉</li>
        <li><strong>${upcomingDeadlines}</strong> deadlines in the next 7 days</li>
      </ul>
      
      <h3>💰 Financials</h3>
      <ul>
        <li><strong>${totalInvoices}</strong> total invoices</li>
        <li><strong>${paidInvoices}</strong> paid invoices</li>
        <li><strong>$${(totalRevenue._sum.amount || 0).toLocaleString()}</strong> total revenue</li>
      </ul>
      
      <p>Keep up the great work! 🚀</p>
      <p><small>Sent from CreativeAnchor CRM</small></p>
    `;

    await sendEmail(user.email, subject, html);
  }

  console.log(`Sent weekly summaries to ${users.length} users`);
}

// Main automation runner
export async function runAllAutomations() {
  console.log('🤖 Running all automations...');
  
  try {
    await checkDeadlineReminders();
    await checkInvoiceReminders();
    await checkQuoteFollowUps();
    await checkStuckProjects();
    
    // Weekly summary only runs on Mondays
    const today = new Date();
    if (today.getDay() === 1) {
      await sendWeeklySummary();
    }
    
    console.log('✅ All automations complete!');
  } catch (error) {
    console.error('❌ Automation error:', error);
  }
}
