export default function Dashboard() {
  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="dashboard-grid">
        <div className="card">
          <h3>System Status</h3>
          <p>All core services (Frontend, Spring Boot, FastAPI, Postgres, MinIO) are running.</p>
        </div>
        <div className="card">
          <h3>Recent Workspaces</h3>
          <p>Workspace listing will be implemented in Phase 2.</p>
        </div>
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="actions-list">
            <button className="btn-secondary">New Lesson Plan</button>
            <button className="btn-secondary">New Quiz</button>
          </div>
        </div>
      </div>
    </div>
  );
}
