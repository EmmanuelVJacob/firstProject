// const { router } = require("../app");

// const { TWILIO_SERVICE_SID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } =
//   process.env;
// const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
//   lazyLoading: true,
// });

// const sendOTP = async (req, res, next) => {
//   const { phoneNumber } = req.body;

//   try {
//     const otpResponse = await client.verify
//       .services(TWILIO_SERVICE_SID)

//       .verifications.create({
//         to: `${phoneNumber}`,
//         channel: "sms",
//       });

//     res
//       .status(200)
//       .send(`OTP send successfully!: ${JSON.stringify(otpResponse)}`);
//   } catch (error) {
//     res
//       .status(error?.status || 400)
//       .send(error?.message || "Something went wrong!");
//   }
// };


const { TWILIO_SERVICE_SID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } =
  process.env;
const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
  lazyLoading: true,
});

const sendOTP = async (phoneNumber) => {
  try {
    const otpResponse = await client.verify
      .services(TWILIO_SERVICE_SID)
      .verifications.create({
        to: `${phoneNumber}`,
        channel: "sms",
      });

    return otpResponse;
  } catch (error) {
    throw new Error(error?.message || "Something went wrong!");
  }
};

module.exports = sendOTP;
