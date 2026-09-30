import api from "./api";

const getComments = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
};

const addComment = async (taskId, text) => {
  const response = await api.post(
    `/tasks/${taskId}/comments`,
    { text }
  );

  return response.data;
};

export default {
  getComments,
  addComment,
};