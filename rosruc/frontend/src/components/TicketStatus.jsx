export default function TicketStatus({ ticket }) {
  return (
    <section className="result-block" aria-live="polite">
      <div className="block-heading">
        <h2>Status</h2>
        <span className={`status-pill status-${ticket?.status || "empty"}`}>
          {ticket?.status || "Waiting for ticket"}
        </span>
      </div>

      {ticket ? (
        <>
          <strong>{ticket.title}</strong>
          <p>{ticket.description}</p>
          <small>Updated: {new Date(ticket.updatedAt).toLocaleString()}</small>
        </>
      ) : (
        <p>Create a support ticket to begin the demo flow.</p>
      )}
    </section>
  );
}
