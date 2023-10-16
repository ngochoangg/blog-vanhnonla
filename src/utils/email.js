import nodemailer from 'nodemailer';

const sendMail = async (options) => {
  //Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  //Define email options
  //Send email
  await transporter.sendMail({
    from: 'Ice Egg <hoangk41e@hotmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  });
};

export default sendMail;
