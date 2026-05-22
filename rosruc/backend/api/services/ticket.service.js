const tickets = [];

function makeTicketId() {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `ticket-${timePart}-${randomPart}`;
}

function createTicket({ title, description }) {
  const now = new Date().toISOString();
  const ticket = {
    id: makeTicketId(),
    title,
    description,
    status: "created",
    logs: ["Ticket accepted by the API and stored in memory."],
    report: null,
    createdAt: now,
    updatedAt: now,
  };

  tickets.push(ticket);
  return ticket;
}

function findTicketById(ticketId) {
  return tickets.find((ticket) => ticket.id === ticketId);
}

function updateTicket(ticketId, updates) {
  const index = tickets.findIndex((ticket) => ticket.id === ticketId);

  if (index === -1) {
    return null;
  }

  const updatedTicket = {
    ...tickets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  tickets[index] = updatedTicket;
  return updatedTicket;
}

module.exports = {
  createTicket,
  findTicketById,
  updateTicket,
};
