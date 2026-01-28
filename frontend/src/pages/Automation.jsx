import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { formatDate } from '../utils/formatters';
import NoBusiness from '../components/NoBusiness';

const Automation = () => {
  const { selectedBusinessId } = useBusiness();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    taskType: 'rank_check',
    scheduleCron: '0 6 * * *',
    payload: ''
  });
  const [message, setMessage] = useState('');

  const fetchTasks = async () => {
    if (!selectedBusinessId) return;
    const { data } = await api.get(`/businesses/${selectedBusinessId}/automation`);
    const list = data.tasks || [];
    setTasks(list.map((task) => ({ ...task, payloadText: JSON.stringify(task.payload || {}, null, 2) })));
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedBusinessId]);

  const handleTaskChange = (taskId, field, value) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, [field]: value } : task))
    );
  };

  const handleUpdateTask = async (task) => {
    let payload = null;
    if (task.payloadText) {
      try {
        payload = JSON.parse(task.payloadText);
      } catch (error) {
        setMessage('Payload must be valid JSON');
        return;
      }
    }
    await api.patch(`/businesses/${selectedBusinessId}/automation/${task.id}`, {
      scheduleCron: task.schedule_cron,
      status: task.status,
      payload
    });
    setMessage('Automation task updated.');
    await fetchTasks();
  };

  const handleTriggerTask = async (taskId) => {
    await api.post(`/businesses/${selectedBusinessId}/automation/${taskId}/trigger`);
    setMessage('Task triggered.');
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    let payload = null;
    if (newTask.payload) {
      try {
        payload = JSON.parse(newTask.payload);
      } catch (error) {
        setMessage('Payload must be valid JSON');
        return;
      }
    }
    await api.post(`/businesses/${selectedBusinessId}/automation`, {
      taskType: newTask.taskType,
      scheduleCron: newTask.scheduleCron,
      payload
    });
    setNewTask({ taskType: 'rank_check', scheduleCron: '0 6 * * *', payload: '' });
    setMessage('Automation task created.');
    await fetchTasks();
  };

  if (!selectedBusinessId) {
    return (
      <NoBusiness
        title="Automate your local SEO workflows"
        description="Select a business to manage cron schedules and triggers."
      />
    );
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Automation scheduler</h3>
            <p>Control daily rankings, weekly review requests, and monthly reports.</p>
          </div>
          <div className="tag">Cron powered</div>
        </div>
        {message && <div className="info-banner">{message}</div>}
        <div className="list">
          {tasks.length ? (
            tasks.map((task) => (
              <div key={task.id} className="automation-card">
                <div className="automation-header">
                  <div>
                    <strong>{task.task_type.replace('_', ' ')}</strong>
                    <small>Next run: {task.next_run ? formatDate(task.next_run) : 'pending'}</small>
                  </div>
                  <span className={`pill ${task.status === 'active' ? 'high' : 'neutral'}`}>
                    {task.status}
                  </span>
                </div>
                <div className="form-grid">
                  <label>
                    Cron schedule
                    <input
                      value={task.schedule_cron}
                      onChange={(event) => handleTaskChange(task.id, 'schedule_cron', event.target.value)}
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={task.status}
                      onChange={(event) => handleTaskChange(task.id, 'status', event.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </label>
                  <label className="full-width">
                    Payload (JSON)
                    <textarea
                      rows="4"
                      value={task.payloadText}
                      onChange={(event) => handleTaskChange(task.id, 'payloadText', event.target.value)}
                    />
                  </label>
                </div>
                <div className="button-row">
                  <button className="secondary-button" type="button" onClick={() => handleUpdateTask(task)}>
                    Save changes
                  </button>
                  <button className="ghost-button" type="button" onClick={() => handleTriggerTask(task.id)}>
                    Trigger now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No automation tasks configured.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Create new automation</h3>
            <p>Set custom schedules for tasks like review requests or report generation.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleCreateTask}>
          <label>
            Task type
            <select
              value={newTask.taskType}
              onChange={(event) => setNewTask((prev) => ({ ...prev, taskType: event.target.value }))}
            >
              <option value="rank_check">Rank check</option>
              <option value="review_request">Review request</option>
              <option value="seo_suggestion">SEO suggestions</option>
              <option value="report_weekly">Weekly report</option>
              <option value="report_monthly">Monthly report</option>
            </select>
          </label>
          <label>
            Cron schedule
            <input
              value={newTask.scheduleCron}
              onChange={(event) => setNewTask((prev) => ({ ...prev, scheduleCron: event.target.value }))}
              placeholder="0 9 * * 1"
              required
            />
          </label>
          <label className="full-width">
            Payload (JSON)
            <textarea
              rows="4"
              value={newTask.payload}
              onChange={(event) => setNewTask((prev) => ({ ...prev, payload: event.target.value }))}
              placeholder='{"recipients": ["+2547..."], "channel": "whatsapp"}'
            />
          </label>
          <button className="primary-button" type="submit">
            Add automation
          </button>
        </form>
      </section>
    </div>
  );
};

export default Automation;
