import api from "./api";

const getWorkflows = async (workspaceId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/workflows`
  );

  return response.data;
};

const getWorkflow = async (workflowId) => {
  const response = await api.get(
    `/workflows/${workflowId}`
  );

  return response.data;
};

const createWorkflow = async (workspaceId, workflowData) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/workflows`,
    workflowData
  );

  return response.data;
};

const updateWorkflow = async (workflowId, workflowData) => {
  const response = await api.put(
    `/workflows/${workflowId}`,
    workflowData
  );

  return response.data;
};

const deleteWorkflow = async (workflowId) => {
  const response = await api.delete(
    `/workflows/${workflowId}`
  );

  return response.data;
};

const addStage = async (workflowId, stageData) => {
  const response = await api.post(
    `/workflows/${workflowId}/stages`,
    stageData
  );

  return response.data;
};

const removeStage = async (workflowId, stageId) => {
  const response = await api.delete(
    `/workflows/${workflowId}/stages/${stageId}`
  );

  return response.data;
};

export default {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  addStage,
  removeStage,
};