const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireBusinessAccess } = require('../middleware/businessAccess');
const automationService = require('../services/automationService');

const router = express.Router();

router.get('/businesses/:businessId/automation', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const tasks = await automationService.listTasks(req.business.id);
    return res.json({ tasks });
  } catch (error) {
    return next(error);
  }
});

router.post('/businesses/:businessId/automation', authenticate, requireBusinessAccess, async (req, res, next) => {
  try {
    const { taskType, scheduleCron, payload, status } = req.body;
    if (!taskType || !scheduleCron) {
      return res.status(400).json({ message: 'taskType and scheduleCron are required' });
    }
    const task = await automationService.createTask(req.business.id, {
      taskType,
      scheduleCron,
      payload,
      status
    });
    return res.status(201).json({ task });
  } catch (error) {
    return next(error);
  }
});

router.patch(
  '/businesses/:businessId/automation/:taskId',
  authenticate,
  requireBusinessAccess,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const task = await automationService.updateTask(taskId, req.business.id, req.body);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      return res.json({ task });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/businesses/:businessId/automation/:taskId/trigger',
  authenticate,
  requireBusinessAccess,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const task = await automationService.triggerTask(taskId, req.business.id);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      return res.json({ status: 'queued' });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
