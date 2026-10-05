import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import workspaceService from "../services/workspaceService";
import { useNotifications } from "../context/NotificationContext";

const WorkspaceDetails = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const { onlineUsers } = useNotifications();

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await workspaceService.getWorkspace(
          workspaceId
        );

      setWorkspace(
        data.workspace || data.data
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load workspace."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [workspaceId]);

  const isUserOnline = (userId) => {
    if (!userId) {
      return false;
    }

    return onlineUsers.includes(
      userId.toString()
    );
  };

  if (loading) {
    return (
      <p style={{ padding: "30px" }}>
        Loading workspace...
      </p>
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: "30px" }}>
        <p>
          {error || "Workspace not found."}
        </p>

        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <button
        onClick={() => navigate("/dashboard")}
      >
        ← Back to Dashboard
      </button>

      <header style={{ marginTop: "25px" }}>
        <h1>{workspace.name}</h1>

        <p>
          {workspace.description ||
            "No workspace description."}
        </p>
      </header>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <hr />

      <section style={{ marginTop: "25px" }}>
        <h2>Workspace Members</h2>

        {workspace.members?.length === 0 ? (
          <p>No members found.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxWidth: "600px",
            }}
          >
            {workspace.members?.map((member) => {
              const memberUser =
                member.user || member;

              const userId = memberUser?._id;

              const online = isUserOnline(userId);

              return (
                <div
                  key={userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    padding: "15px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    background: "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: online
                          ? "#22c55e"
                          : "#9ca3af",
                      }}
                    />

                    <div>
                      <strong>
                        {memberUser?.name ||
                          "Unknown User"}
                      </strong>

                      <p
                        style={{
                          margin: "4px 0 0",
                          color: "#666",
                        }}
                      >
                        {memberUser?.email}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <strong>
                      {member.role}
                    </strong>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "13px",
                        color: online
                          ? "#16a34a"
                          : "#777",
                      }}
                    >
                      {online
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default WorkspaceDetails;