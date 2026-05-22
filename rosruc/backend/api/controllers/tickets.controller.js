const aiService = require("../services/ai.service");
const ticketService = require("../services/ticket.service");

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function requireTicket(ticketId) {
  const ticket = ticketService.findTicketById(ticketId);

  if (!ticket) {
    throw httpError(404, `Ticket not found: ${ticketId}`);
  }

  return ticket;
}

function createTicket(request, response, next) {
  try {
    const { title, description } = request.body || {};

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      !title.trim() ||
      !description.trim()
    ) {
      throw httpError(400, "Ticket title and description are required.");
    }

    const ticket = ticketService.createTicket({
      title: title.trim(),
      description: description.trim(),
    });

    response.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}

function getTicket(request, response, next) {
  try {
    response.json(requireTicket(request.params.id));
  } catch (error) {
    next(error);
  }
}

function runTicket(request, response, next) {
  try {
    const ticket = requireTicket(request.params.id);
    const runningTicket = ticketService.updateTicket(ticket.id, {
      status: "running",
      logs: [...ticket.logs, "API handed ticket to the placeholder AI service."],
    });
    const result = aiService.runPlaceholderWorkflow(runningTicket);
    const updatedTicket = ticketService.updateTicket(ticket.id, {
      status: result.status,
      logs: [...runningTicket.logs, ...result.logs],
      report: result.report,
    });

    response.json({
      ticket: updatedTicket,
      result,
    });
  } catch (error) {
    next(error);
  }
}

function getTicketStatus(request, response, next) {
  try {
    const ticket = requireTicket(request.params.id);

    response.json({
      id: ticket.id,
      status: ticket.status,
      logs: ticket.logs,
      updatedAt: ticket.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

function getTicketReport(request, response, next) {
  try {
    const ticket = requireTicket(request.params.id);

    response.json({
      id: ticket.id,
      status: ticket.status,
      report: ticket.report,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTicket,
  getTicket,
  getTicketReport,
  getTicketStatus,
  runTicket,
};
