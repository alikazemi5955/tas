import cron, { ScheduledTask } from 'node-cron';
import { parkwayAutomation } from '../automation/parkwayScraper';

export interface SchedulerInfo {
  cronExpression: string;
  scheduleTime: string;
  timezone: string;
  isActive: boolean;
  nextRunDescription: string;
}

let activeTask: ScheduledTask | null = null;
let currentScheduleTime: string = process.env.SCHEDULE_TIME || '23:00';
let currentTimezone: string = process.env.TIMEZONE || 'Asia/Tehran';

export function getSchedulerInfo(): SchedulerInfo {
  const [hour, minute] = currentScheduleTime.split(':').map(x => parseInt(x, 10));
  const cronExp = `${minute || 0} ${hour || 23} * * *`;
  return {
    cronExpression: cronExp,
    scheduleTime: currentScheduleTime,
    timezone: currentTimezone,
    isActive: activeTask !== null,
    nextRunDescription: `هر روز رأس ساعت ${currentScheduleTime} (به وقت تهران)`
  };
}

export function initScheduler(): void {
  const [hourStr, minStr] = currentScheduleTime.split(':');
  const hour = parseInt(hourStr, 10) || 23;
  const minute = parseInt(minStr, 10) || 0;

  // Format standard 5-part cron expression: "minute hour * * *"
  const cronExpression = `${minute} ${hour} * * *`;

  if (activeTask) {
    activeTask.stop();
  }

  console.log(`[Scheduler] Initializing cron job: "${cronExpression}" with timezone "${currentTimezone}"`);

  activeTask = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Triggering scheduled daily automation at ${new Date().toISOString()}`);
    try {
      await parkwayAutomation.runDailyAutomation();
    } catch (err) {
      console.error('[Scheduler] Error in scheduled run:', err);
    }
  }, {
    timezone: currentTimezone
  });

  console.log(`[Scheduler] Daily automation scheduler started. Next run at ${currentScheduleTime} (${currentTimezone})`);
}

export function updateSchedule(newTime: string): SchedulerInfo {
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
    throw new Error('فرمت ساعت نامعتبر است. لطفاً فرمت HH:mm مانند 23:00 وارد کنید.');
  }
  currentScheduleTime = newTime;
  process.env.SCHEDULE_TIME = newTime;
  initScheduler();
  return getSchedulerInfo();
}
