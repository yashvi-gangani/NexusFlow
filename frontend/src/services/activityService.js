import api from "./api";

const getWorkspaceActivity = async (workspaceId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/activity`
  );

  return response.data;
};

export default {
  getWorkspaceActivity,
};
