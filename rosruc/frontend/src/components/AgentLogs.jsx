export default function AgentLogs({ logs = [] }) {
  return (
    <section className="result-block">
      <div className="block-heading">
        <h2>Agent Logs</h2>
        <span>{logs.length} entries</span>
      </div>

      {logs.length ? (
        <ol className="log-list">
          {logs.map((log, index) => (
            <li key={`${log}-${index}`}>{log}</li>
          ))}
        </ol>
      ) : (
        <p>No agent activity yet.</p>
      )}
    </section>
  );
}
