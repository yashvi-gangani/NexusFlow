import api from "./api";

const getWorkspaces = async () => {
  const response = await api.get("/workspaces");
  return response.data;
};

const getWorkspace = async (workspaceId) => {
  const response = await api.get(`/workspaces/${workspaceId}`);
  return response.data;
};

const createWorkspace = async (workspaceData) => {
  const response = await api.post("/workspaces", workspaceData);
  return response.data;
};

const addMember = async (workspaceId, memberData) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/members`,
    memberData
  );
  return response.data;
};

const removeMember = async (workspaceId, userId) => {
  const response = await api.delete(
    `/workspaces/${workspaceId}/members/${userId}`
  );
  return response.data;
};

export default {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  addMember,
  removeMember,
};