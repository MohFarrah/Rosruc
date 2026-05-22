const express = require("express");
const ticketsController = require("../controllers/tickets.controller");

const router = express.Router();

router.post("/", ticketsController.createTicket);
router.get("/:id", ticketsController.getTicket);
router.post("/:id/run", ticketsController.runTicket);
router.get("/:id/status", ticketsController.getTicketStatus);
router.get("/:id/report", ticketsController.getTicketReport);

module.exports = router;
