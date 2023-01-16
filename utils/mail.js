require("dotenv").config();
// const { fstat } = require("fs");
const nodeMailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const path = require("path");
const fs = require("fs");
const transport = nodeMailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);
// to: "hop@hingeconsulting.com.ng",

// const SendResetEmail = async (
//   email,
//   name,
//   message
// ) => {
//   try {
//     await transport.sendMail({
//       to: "ademola[",
//       from: email,
//       subject: `${name}'s Message from Onigege Ara Website`,
//       text: "Someone sent you a direct message",
//       inReplyTo: email,
//       html: `
//       <center data-link-color="#1188E6" data-body-style="font-size:16px; font-family:trebuchet ms,helvetica,sans-serif; color:#B9762F; background-color:#FFFFFF;">
//       <body>
//       <div
//         style="
//           width: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           flex-flow: column;
//           background-color: black;
//         "
//       >
//         <h2
//           style="
//             text-align: center;
//             width: 80%;
//             box-shadow: 0.1px 0.1px 0.1px 1px grey;
//             color: white;
//             padding: 1rem 0px;
//           "
//         >
//           ${name} sent you a direct message, you can reply directly to the
//           person's email address
//         </h2>
//         <span
//           style="text-align: center; width: 80%; color: white; padding: 1rem 0px"
//           >Here is the message below:</span
//         >
//         <span
//           style="
//             text-align: center;
//             width: 70%;
//             box-shadow: 0.1px 0.1px 0.1px 1px grey;
//             color: white;
//             padding: 1rem 0px;
//             margin:1rem 0px
//           "
//         >
//           ${message}
//         </span>
//       </div>
//     </body>
//       </center>`,
//     });
//   } catch (error) {
//     if (error.message === "getaddrinfo ENOTFOUND api.sendgrid.com") {
//       throw new Error("Please try again later Request can't be completed");
//     }
//     const errorVal = error.message;
//     throw new Error(errorVal);
//   }
// };
const SendResetEmail = async () => {
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  const msg = {
    to: 'ademolapamilerin192@gmail.com', // Change to your recipient
    from: 'adeakanfea@gmail.com', // Change to your verified sender
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  }
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent')
    })
    .catch((error) => {
      console.error(error)
    })
}
const feedback = async ({ title, email, message, src }) => {
  try {
    await transport.sendMail({
      to: "ademolapamilerin192@gmail.com",
      from: "adeakanfea@gmail.com",
      inReplyTo: email,
      subject: `${name} sent us a feedback`,
      text: "Feedback for Hinge Consultancy",
      html: `
      <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:16px; font-family:trebuchet ms,helvetica,sans-serif; color:#B9762F; background-color:#FFFFFF;">
      <div
      style="
        display: flex;
        flex-flow: column;
        justify-content: center;
        align-items: center;
        background-color: blue;
      "
    >
      <span
        style="
          text-align: center;
          width: 70%;
          font-size: 2rem;
          font-weight: 700;
          color: antiquewhite;
        "
      >
        ${title}
      </span>
      <span
        style="
          position: relative;
          width: 60%;
          height: auto;
          justify-content: center;
          align-items: center;
          display: flex;
          margin: 1rem 0px;
        "
      >
        <img
          src=${src}
          alt=""
          style="object-fit: cover; object-position: center center; width: 30%"
        />
      </span>

      <span
        style="
          position: relative;
          width: 60%;
          height: auto;
          justify-content: center;
          align-items: center;
          display: flex;
          margin: 1rem 0px;
          color: blanchedalmond;
          font-size: 1.1rem;
        "
      >
        ${message}
      </span>
      <footer
        style="
          position: relative;
          width: 60%;
          height: auto;
          justify-content: center;
          align-items: center;
          display: flex;
          margin: 1rem 0px;
          color: blanchedalmond;
          font-size: 1.5rem;
          flex-flow: column;
        "
      >
        &copy; Onigege-Ara
        <br />
        <a
          style="
            position: relative;
            width: 60%;
            height: auto;
            justify-content: center;
            align-items: center;
            display: flex;
            margin: 1rem 0px;
            color: blanchedalmond;
            font-size: 1.1rem;
            cursor: pointer;
          "
        >
          unsubscribe from news letter
        </a>
      </footer>
    </div>
      </center>
      `,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { SendResetEmail, feedback };
