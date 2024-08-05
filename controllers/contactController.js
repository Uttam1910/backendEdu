// controllers/contactController.js
const sendContactMessage = (req, res) => {
    const { name, email, message } = req.body;
  
    // Here, you can handle the form submission, e.g., save it to the database or send an email
    // For demonstration, we will just log it and return a success message
  
    console.log(`Contact message from ${name} (${email}): ${message}`);
    res.status(200).json({ message: 'Contact message received successfully' });
  };
  
  module.exports = { sendContactMessage };
  