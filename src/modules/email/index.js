const emailService = require("./emailService");
const transporter = require("./transporter");

module.exports = {
  ...emailService,
  transporter,
};
