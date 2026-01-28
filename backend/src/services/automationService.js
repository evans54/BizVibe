const cronParser = require('cron-parser');
const pool = require('../db/pool');
const logger = require('../utils/logger');
const { addAutomationJob } = require('../jobs/queue');

const DEFAULT_TASKS = [
  {
    taskType: 'rank_check',
    scheduleCron: '0 6 * * *'
  },
  {
    taskType: 'review_request',
    scheduleCron: '0 9 * * 1'
  },
  {
    taskType: 'seo_suggestion',
    scheduleCron: '0 10 1 * *'
  },
  {
    taskType: 'report_weekly',
    scheduleCron: '0 8 * * 1'
  },
  {
    taskType: 'report_monthly',
    scheduleCron: '0 8 1 * *'
  }
];

const computeNextRun = (scheduleCron, fromDate) => {
  const interval = cronParser.parseExpression(scheduleCron, {
    currentDate: fromDate || new Date()
  });
  return interval.next().toDate();
};

const createTask = async (businessId, task) => {
  const nextRun = computeNextRun(task.scheduleCron);
  const { rows } = await pool.query(
    `INSERT INTO automation_tasks (business_id, task_type, schedule_cron, payload, status, next_run)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      businessId,
      task.taskType,
      task.scheduleCron,
      task.payload || null,
      task.status || 'active',
      nextRun
    ]
  );
  return rows[0];
};

const createDefaultTasks = async (businessId) => {
  const tasks = [];
  for (const task of DEFAULT_TASKS) {
    tasks.push(await createTask(businessId, task));
  }
  return tasks;
};

const listTasks = async (businessId) => {
  const { rows } = await pool.query(
    'SELECT * FROM automation_tasks WHERE business_id = $1 ORDER BY created_at DESC',
    [businessId]
  );
  return rows;
};

const updateTask = async (taskId, businessId, updates) => {
  const nextRun = updates.scheduleCron
    ? computeNextRun(updates.scheduleCron)
    : undefined;

  const { rows } = await pool.query(
    `UPDATE automation_tasks
     SET schedule_cron = COALESCE($1, schedule_cron),
         payload = COALESCE($2, payload),
         status = COALESCE($3, status),
         next_run = COALESCE($4, next_run),
         updated_at = NOW()
     WHERE id = $5 AND business_id = $6
     RETURNING *`,
    [
      updates.scheduleCron || null,
      updates.payload || null,
      updates.status || null,
      nextRun || null,
      taskId,
      businessId
    ]
  );
  return rows[0];
};

const getDueTasks = async () => {
  const { rows } = await pool.query(
    `SELECT *
     FROM automation_tasks
     WHERE status = 'active'
       AND (next_run IS NULL OR next_run <= NOW())`
  );
  return rows;
};

const markTaskRun = async (taskId, scheduleCron) => {
  const nextRun = computeNextRun(scheduleCron, new Date());
  await pool.query(
    `UPDATE automation_tasks
     SET last_run = NOW(), next_run = $1, updated_at = NOW()
     WHERE id = $2`,
    [nextRun, taskId]
  );
  return nextRun;
};

const runSchedulerTick = async () => {
  const dueTasks = await getDueTasks();
  for (const task of dueTasks) {
    await addAutomationJob(task.task_type, {
      taskId: task.id,
      businessId: task.business_id,
      payload: task.payload
    });
    await markTaskRun(task.id, task.schedule_cron);
    logger.info('Scheduled automation task', {
      taskId: task.id,
      taskType: task.task_type
    });
  }
};

const triggerTask = async (taskId, businessId) => {
  const { rows } = await pool.query(
    'SELECT * FROM automation_tasks WHERE id = $1 AND business_id = $2',
    [taskId, businessId]
  );
  const task = rows[0];
  if (!task) {
    return null;
  }
  await addAutomationJob(task.task_type, {
    taskId: task.id,
    businessId: task.business_id,
    payload: task.payload
  });
  return task;
};

module.exports = {
  createDefaultTasks,
  createTask,
  listTasks,
  updateTask,
  runSchedulerTick,
  triggerTask,
  computeNextRun
};
