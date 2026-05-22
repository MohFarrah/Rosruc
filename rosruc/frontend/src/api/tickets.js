const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API request failed with ${response.status}.`);
  }

  return response.json();
}

export function createTicket(ticketInput) {
  return request("/tickets", {
    method: "POST",
    body: JSON.stringify(ticketInput),
  });
}

export function getTicket(ticketId) {
  return request(`/tickets/${ticketId}`);
}

export function runTicketAgent(ticketId) {
  return request(`/tickets/${ticketId}/run`, {
    method: "POST",
  });
}

export function getTicketStatus(ticketId) {
  return request(`/tickets/${ticketId}/status`);
}

export function getTicketReport(ticketId) {
  return request(`/tickets/${ticketId}/report`);
}
