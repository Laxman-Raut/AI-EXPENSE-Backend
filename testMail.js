require("dotenv").config();

const { sendOtpEmail } = require("./src/modules/auth/mailService");

(async () => {
  try {
    await sendOtpEmail("YOUR_EMAIL@gmail.com", "123456");
    console.log("Email sent successfully!");
  } catch (err) {
    console.error(err);
  }
})();