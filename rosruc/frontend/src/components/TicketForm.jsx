import { useState } from "react";

const initialForm = {
  title: "",
  description: "",
};

export default function TicketForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialForm);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <form className="ticket-form" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="ticket-title">Ticket title</label>
        <input
          id="ticket-title"
          name="title"
          value={form.title}
          onChange={updateField}
          placeholder="Login button freezes after password reset"
          required
        />
      </div>

      <div>
        <label htmlFor="ticket-description">Description</label>
        <textarea
          id="ticket-description"
          name="description"
          value={form.description}
          onChange={updateField}
          placeholder="Paste the customer symptoms, expected behavior, and any useful environment details."
          rows="7"
          required
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Ticket"}
      </button>
    </form>
  );
}
