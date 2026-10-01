import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import workspaceService from "../services/workspaceService";
import NotificationBell from "../components/NotificationBell";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await workspaceService.getWorkspaces();
      setWorkspaces(data.workspaces || data.data || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load workspaces."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();

    if (!workspaceName.trim()) return;

    try {
      setCreating(true);
      setError("");

      await workspaceService.createWorkspace({
        name: workspaceName,
        description,
      });

      setWorkspaceName("");
      setDescription("");
      setShowCreateForm(false);

      await loadWorkspaces();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create workspace."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: "30px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1>NexusFlow</h1>
          <p>Welcome, {user?.name}</p>
        </div>

        <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px",
  }}
>
  <NotificationBell />

  <button onClick={handleLogout}>
    Logout
  </button>
</div>
      </header>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Your Workspaces</h2>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : "+ Create Workspace"}
          </button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateWorkspace}
            style={{
              marginTop: "20px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <div>
              <label>Workspace Name</label>
              <br />
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Product Team"
                required
              />
            </div>

            <br />

            <div>
              <label>Description</label>
              <br />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your workspace"
                rows="3"
              />
            </div>

            <br />

            <button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Workspace"}
            </button>
          </form>
        )}

        {error && (
          <p style={{ color: "red", marginTop: "20px" }}>
            {error}
          </p>
        )}

        {loading ? (
          <p>Loading workspaces...</p>
        ) : workspaces.length === 0 ? (
          <p style={{ marginTop: "30px" }}>
            No workspaces yet. Create your first workspace.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "20px",
              marginTop: "25px",
            }}
          >
            {workspaces.map((workspace) => (
              <div
                key={workspace._id}
                onClick={() =>
                  navigate(`/workspaces/${workspace._id}`)
                }
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "20px",
                  cursor: "pointer",
                }}
              >
                <h3>{workspace.name}</h3>

                <p>
                  {workspace.description ||
                    "No description provided."}
                </p>

                <small>
                  {workspace.members?.length || 0} member(s)
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;