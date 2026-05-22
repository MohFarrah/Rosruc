const express = require("express");

const router = express.Router();

router.get("/", (request, response) => {
  response.json({
    status: "ok",
    service: "uwt-devtools-api",
  });
});

module.exports = router;
