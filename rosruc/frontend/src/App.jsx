import { useState } from "react";
import AgentLogs from "./components/AgentLogs.jsx";
import ReportViewer from "./components/ReportViewer.jsx";
import TicketForm from "./components/TicketForm.jsx";
import TicketStatus from "./components/TicketStatus.jsx";
import {
  createTicket,
  getTicketReport,
  getTicketStatus,
  runTicketAgent,
} from "./api/tickets.js";

export default function App() {
  const [ticket, setTicket] = useState(null);
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  async function handleCreateTicket(ticketInput) {
    setIsCreating(true);
    setMessage("");

    try {
      const createdTicket = await createTicket(ticketInput);
      setTicket(createdTicket);
      setReport(createdTicket.report);
      setMessage("Ticket created. The placeholder agent is ready to run.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRunAgent() {
    if (!ticket) {
      return;
    }

    setIsRunning(true);
    setMessage("Running the placeholder workflow...");

    try {
      await runTicketAgent(ticket.id);

      const [statusResult, reportResult] = await Promise.all([
        getTicketStatus(ticket.id),
        getTicketReport(ticket.id),
      ]);

      setTicket((currentTicket) => ({
        ...currentTicket,
        status: statusResult.status,
        logs: statusResult.logs,
        updatedAt: statusResult.updatedAt,
        report: reportResult.report,
      }));
      setReport(reportResult.report);
      setMessage("Placeholder workflow finished. Review the draft report below.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <p className="eyebrow">Hackathon foundation</p>
        <h1>UWT AI DevTools</h1>
        <p>
          Turn customer support tickets into a future bug reproduction, fix
          attempt, test run, and report workflow.
        </p>
      </header>

      <section className="workbench" aria-label="Ticket workflow">
        <div className="ticket-column">
          <TicketForm onSubmit={handleCreateTicket} isSubmitting={isCreating} />

          {ticket ? (
            <div className="run-row">
              <button type="button" onClick={handleRunAgent} disabled={isRunning}>
                {isRunning ? "Running..." : "Run AI Agent"}
              </button>
              <span>Ticket ID: {ticket.id}</span>
            </div>
          ) : null}

          {message ? <p className="app-message">{message}</p> : null}
        </div>

        <div className="result-column">
          <TicketStatus ticket={ticket} />
          <AgentLogs logs={ticket?.logs} />
          <ReportViewer report={report} />
        </div>
      </section>
    </main>
  );
}
