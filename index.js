// Vercel entry point - static files are served automatically
// API functions are in api/ directory
module.exports = (req, res) => {
  res.status(404).json({ error: 'Not found' });
};