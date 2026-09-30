import api from "./api";

const getWorkflowTasks = async (workflowId) => {
  const response = await api.get(
    `/workflows/${workflowId}/tasks`
  );

  return response.data;
};

const getTask = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

const createTask = async (workflowId, taskData) => {
  const response = await api.post(
    `/workflows/${workflowId}/tasks`,
    taskData
  );

  return response.data;
};

const updateTask = async (taskId, taskData) => {
  const response = await api.put(
    `/tasks/${taskId}`,
    taskData
  );

  return response.data;
};

const moveTask = async (taskId, stageId) => {
  const response = await api.put(
    `/tasks/${taskId}/stage`,
    { stageId }
  );

  return response.data;
};

const assignTask = async (taskId, assignedTo) => {
  const response = await api.put(
    `/tasks/${taskId}/assign`,
    { assignedTo }
  );

  return response.data;
};

const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export default {
  getWorkflowTasks,
  getTask,
  createTask,
  updateTask,
  moveTask,
  assignTask,
  deleteTask,
};