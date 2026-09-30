import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import taskService from "../services/taskService";
import commentService from "../services/commentService";
import activityService from "../services/activityService";

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
  });

  const loadTask = async () => {
    const data = await taskService.getTask(taskId);

    const loadedTask = data.task || data.data;

    setTask(loadedTask);

    setEditData({
      title: loadedTask.title || "",
      description: loadedTask.description || "",
      priority: loadedTask.priority || "MEDIUM",
      status: loadedTask.status || "TODO",
      dueDate: loadedTask.dueDate
        ? loadedTask.dueDate.split("T")[0]
        : "",
    });

    return loadedTask;
  };

  const loadComments = async () => {
    const data = await commentService.getComments(taskId);

    setComments(data.comments || data.data || []);
  };

  const loadActivities = async (workspaceId) => {
    const data =
      await activityService.getWorkspaceActivity(
        workspaceId
      );

    setActivities(data.activities || data.data || []);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const loadedTask = await loadTask();

      await Promise.all([
        loadComments(),
        loadActivities(loadedTask.workspace),
      ]);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load task."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [taskId]);

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const data = await taskService.updateTask(
        taskId,
        {
          title: editData.title,
          description: editData.description,
          priority: editData.priority,
          status: editData.status,
          dueDate: editData.dueDate || null,
        }
      );

      const updatedTask = data.task || data.data;

      setTask(updatedTask);
      setEditing(false);

      await loadComments();
      await loadActivities(updatedTask.workspace);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update task."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      await taskService.deleteTask(taskId);

      navigate(-1);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to delete task."
      );
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      setAddingComment(true);

      await commentService.addComment(
        taskId,
        commentText
      );

      setCommentText("");

      await loadComments();
      await loadActivities(task.workspace);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to add comment."
      );
    } finally {
      setAddingComment(false);
    }
  };

  if (loading) {
    return (
      <p style={{ padding: "30px" }}>
        Loading task...
      </p>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: "30px" }}>
        <p>{error || "Task not found."}</p>

        <button onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <button onClick={() => navigate(-1)}>
        ← Back
      </button>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: "30px",
          marginTop: "25px",
        }}
      >
        <main>
          {!editing ? (
            <>
              <h1>{task.title}</h1>

              <p>
                {task.description ||
                  "No description provided."}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginTop: "20px",
                }}
              >
                <span>
                  Priority: <strong>{task.priority}</strong>
                </span>

                <span>
                  Status: <strong>{task.status}</strong>
                </span>

                <span>
                  Assigned:{" "}
                  <strong>
                    {task.assignedTo?.name ||
                      task.assignedTo?.email ||
                      "Unassigned"}
                  </strong>
                </span>

                {task.dueDate && (
                  <span>
                    Due:{" "}
                    <strong>
                      {new Date(
                        task.dueDate
                      ).toLocaleDateString()}
                    </strong>
                  </span>
                )}
              </div>

              <div style={{ marginTop: "25px" }}>
                <button
                  onClick={() => setEditing(true)}
                >
                  Edit Task
                </button>

                <button
                  onClick={handleDelete}
                  style={{ marginLeft: "10px" }}
                >
                  Delete Task
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSave}>
              <h2>Edit Task</h2>

              <label>Title</label>
              <br />

              <input
                name="title"
                value={editData.title}
                onChange={handleEditChange}
                required
              />

              <br />
              <br />

              <label>Description</label>
              <br />

              <textarea
                name="description"
                value={editData.description}
                onChange={handleEditChange}
                rows="5"
              />

              <br />
              <br />

              <label>Priority</label>
              <br />

              <select
                name="priority"
                value={editData.priority}
                onChange={handleEditChange}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              <br />
              <br />

              <label>Status</label>
              <br />

              <select
                name="status"
                value={editData.status}
                onChange={handleEditChange}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">
                  In Progress
                </option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>

              <br />
              <br />

              <label>Due Date</label>
              <br />

              <input
                type="date"
                name="dueDate"
                value={editData.dueDate}
                onChange={handleEditChange}
              />

              <br />
              <br />

              <button
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </button>
            </form>
          )}

          <hr style={{ margin: "40px 0" }} />

          <section>
            <h2>Comments</h2>

            <form onSubmit={handleAddComment}>
              <textarea
                value={commentText}
                onChange={(e) =>
                  setCommentText(e.target.value)
                }
                placeholder="Write a comment..."
                rows="4"
                style={{ width: "100%" }}
              />

              <button
                type="submit"
                disabled={addingComment}
                style={{ marginTop: "10px" }}
              >
                {addingComment
                  ? "Adding..."
                  : "Add Comment"}
              </button>
            </form>

            <div style={{ marginTop: "25px" }}>
              {comments.length === 0 ? (
                <p>No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      marginBottom: "12px",
                    }}
                  >
                    <strong>
                      {comment.user?.name ||
                        comment.user?.email ||
                        "User"}
                    </strong>

                    <p>{comment.text}</p>

                    <small>
                      {new Date(
                        comment.createdAt
                      ).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>

        <aside>
          <h2>Activity</h2>

          {activities.length === 0 ? (
            <p>No activity yet.</p>
          ) : (
            activities
              .filter(
                (activity) =>
                  !activity.task ||
                  activity.task._id === task._id
              )
              .map((activity) => (
                <div
                  key={activity._id}
                  style={{
                    borderLeft:
                      "3px solid #ddd",
                    paddingLeft: "12px",
                    marginBottom: "18px",
                  }}
                >
                  <strong>
                    {activity.user?.name ||
                      "User"}
                  </strong>

                  <p>{activity.description}</p>

                  <small>
                    {new Date(
                      activity.createdAt
                    ).toLocaleString()}
                  </small>
                </div>
              ))
          )}
        </aside>
      </div>
    </div>
  );
};

export default TaskDetails;