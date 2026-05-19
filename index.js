// Vercel entry point
// Static files are served automatically by Vercel
// API functions are in api/ directory
export default function handler(req, res) {
  res.status(404).json({ error: 'Not found' });
}