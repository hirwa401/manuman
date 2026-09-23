// Local development entry point. The Vercel function imports this same app,
// keeping local and production behaviour identical.
// Keep this direct dependency reference so Vercel recognizes the Express app.
require('express');
const app = require('./api/index');

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
