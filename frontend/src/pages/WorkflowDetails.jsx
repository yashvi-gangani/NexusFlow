import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import workflowService from "../services/workflowService";
import taskService from "../services/taskService";
import workspaceService from "../services/workspaceService";
import socket from "../services/socket";

const WorkflowDetails = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workspace, setWorkspace] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [creating, setCreating] = useState(false);

  const loadWorkflow = async () => {
    const data = await workflowService.getWorkflow(workflowId);

    const loadedWorkflow = data.workflow || data.data;

    setWorkflow(loadedWorkflow);

    return loadedWorkflow;
  };

  const loadTasks = async () => {
    const data = await taskService.getWorkflowTasks(workflowId);

    setTasks(data.tasks || data.data || []);
  };

  const loadWorkspace = async (workspaceId) => {
    const data = await workspaceService.getWorkspace(workspaceId);

    setWorkspace(data.workspace || data.data);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const loadedWorkflow = await loadWorkflow();

      await Promise.all([
        loadTasks(),
        loadWorkspace(loadedWorkflow.workspace),
      ]);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load workflow."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workflowId]);

  // Real-time workspace task updates
  useEffect(() => {
    if (!workspace?._id) {
      return;
    }

    const workspaceId = workspace._id;

    const getTaskWorkflowId = (task) => {
      if (!task?.workflow) {
        return null;
      }

      if (typeof task.workflow === "object") {
        return task.workflow._id?.toString();
      }

      return task.workflow.toString();
    };

    const isCurrentWorkflowTask = (task) => {
      return (
        getTaskWorkflowId(task) === workflowId.toString()
      );
    };

    const handleTaskCreated = (task) => {
      if (!isCurrentWorkflowTask(task)) {
        return;
      }

      setTasks((currentTasks) => {
        const alreadyExists = currentTasks.some(
          (currentTask) =>
            currentTask._id === task._id
        );

        if (alreadyExists) {
          return currentTasks;
        }

        return [task, ...currentTasks];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      if (!isCurrentWorkflowTask(updatedTask)) {
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === updatedTask._id
            ? updatedTask
            : task
        )
      );
    };

    const handleTaskMoved = (movedTask) => {
      if (!isCurrentWorkflowTask(movedTask)) {
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === movedTask._id
            ? movedTask
            : task
        )
      );
    };

    const handleTaskAssigned = (assignedTask) => {
      if (!isCurrentWorkflowTask(assignedTask)) {
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === assignedTask._id
            ? assignedTask
            : task
        )
      );
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task._id !== taskId
        )
      );
    };

    const joinWorkspace = () => {
      socket.emit("join-workspace", workspaceId);
    };

    if (socket.connected) {
      joinWorkspace();
    } else {
      socket.once("connect", joinWorkspace);
      socket.connect();
    }

    socket.on("task-created", handleTaskCreated);
    socket.on("task-updated", handleTaskUpdated);
    socket.on("task-moved", handleTaskMoved);
    socket.on("task-assigned", handleTaskAssigned);
    socket.on("task-deleted", handleTaskDeleted);

    return () => {
      socket.off("task-created", handleTaskCreated);
      socket.off("task-updated", handleTaskUpdated);
      socket.off("task-moved", handleTaskMoved);
      socket.off("task-assigned", handleTaskAssigned);
      socket.off("task-deleted", handleTaskDeleted);

      socket.off("connect", joinWorkspace);

      if (socket.connected) {
        socket.emit("leave-workspace", workspaceId);
      }
    };
  }, [workspace?._id, workflowId]);

  const openCreateTask = (stageId) => {
    setSelectedStage(stageId);
    setShowTaskForm(true);
  };

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setPriority("MEDIUM");
    setDueDate("");
    setAssignedTo("");
    setSelectedStage(null);
    setShowTaskForm(false);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!taskTitle.trim() || !selectedStage) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      await taskService.createTask(workflowId, {
        title: taskTitle,
        description: taskDescription,
        stage: selectedStage,
        priority,
        dueDate: dueDate || null,
        assignedTo: assignedTo || null,
      });

      resetTaskForm();

      // Keep the existing API refresh as a fallback.
      await loadTasks();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create task."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleMoveTask = async (taskId, stageId) => {
    try {
      await taskService.moveTask(taskId, stageId);

      // Keep the existing API refresh as a fallback.
      await loadTasks();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to move task."
      );
    }
  };

  const getTasksForStage = (stageId) => {
    return tasks.filter(
      (task) => task.stage === stageId
    );
  };

  if (loading) {
    return (
      <p style={{ padding: "30px" }}>
        Loading workflow...
      </p>
    );
  }

  if (!workflow) {
    return (
      <div style={{ padding: "30px" }}>
        <p>{error || "Workflow not found."}</p>

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

      <header style={{ marginTop: "20px" }}>
        <h1>{workflow.name}</h1>

        <p>
          {workflow.description ||
            "No workflow description."}
        </p>

        {workspace && (
          <p>
            Workspace: <strong>{workspace.name}</strong>
          </p>
        )}
      </header>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <hr />

      <div
        style={{
          display: "flex",
          gap: "20px",
          overflowX: "auto",
          padding: "25px 0",
          alignItems: "flex-start",
        }}
      >
        {workflow.stages.map((stage) => {
          const stageTasks = getTasksForStage(
            stage._id
          );

          return (
            <div
              key={stage._id}
              style={{
                minWidth: "300px",
                background: "#f5f5f5",
                borderRadius: "10px",
                padding: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                }}
              >
                <h3>{stage.name}</h3>

                <span>
                  {stageTasks.length}
                </span>
              </div>

              {stage.description && (
                <p>{stage.description}</p>
              )}

              <button
                onClick={() =>
                  openCreateTask(stage._id)
                }
              >
                + Add Task
              </button>

              <div style={{ marginTop: "15px" }}>
                {stageTasks.map((task) => (
                  <div
                    key={task._id}
                    style={{
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      marginBottom: "12px",
                    }}
                  >
                    <h4>{task.title}</h4>

                    {task.description && (
                      <p>{task.description}</p>
                    )}

                    <p>
                      Priority:{" "}
                      <strong>
                        {task.priority}
                      </strong>
                    </p>

                    <p>
                      Status:{" "}
                      <strong>
                        {task.status}
                      </strong>
                    </p>

                    {task.assignedTo && (
                      <p>
                        Assigned to:{" "}
                        {task.assignedTo.name ||
                          task.assignedTo.email}
                      </p>
                    )}

                    <button
                      onClick={() =>
                        navigate(
                          `/tasks/${task._id}`
                        )
                      }
                    >
                      Open
                    </button>

                    <select
                      value={task.stage}
                      onChange={(e) =>
                        handleMoveTask(
                          task._id,
                          e.target.value
                        )
                      }
                      style={{
                        marginLeft: "10px",
                      }}
                    >
                      {workflow.stages.map(
                        (stageOption) => (
                          <option
                            key={stageOption._id}
                            value={stageOption._id}
                          >
                            {stageOption.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showTaskForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <form
            onSubmit={handleCreateTask}
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "10px",
              width: "400px",
              maxWidth: "90%",
            }}
          >
            <h2>Create Task</h2>

            <label>Title</label>

            <input
              type="text"
              value={taskTitle}
              onChange={(e) =>
                setTaskTitle(e.target.value)
              }
              required
            />

            <br />
            <br />

            <label>Description</label>

            <textarea
              value={taskDescription}
              onChange={(e) =>
                setTaskDescription(e.target.value)
              }
              rows="4"
            />

            <br />
            <br />

            <label>Priority</label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <br />
            <br />

            <label>Assign To</label>

            <select
              value={assignedTo}
              onChange={(e) =>
                setAssignedTo(e.target.value)
              }
            >
              <option value="">
                Unassigned
              </option>

              {workspace?.members?.map(
                (member) => {
                  const memberUser =
                    member.user || member;

                  return (
                    <option
                      key={memberUser._id}
                      value={memberUser._id}
                    >
                      {memberUser.name ||
                        memberUser.email}
                    </option>
                  );
                }
              )}
            </select>

            <br />
            <br />

            <label>Due Date</label>

            <input
              type="date"
              value={dueDate}
              onChange={(e) =>
                setDueDate(e.target.value)
              }
            />

            <br />
            <br />

            <button
              type="submit"
              disabled={creating}
            >
              {creating
                ? "Creating..."
                : "Create Task"}
            </button>

            <button
              type="button"
              onClick={resetTaskForm}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorkflowDetails;