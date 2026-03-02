export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }



  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // The URL where the file can be accessed statically
    const fileUrl = `/uploads/${req.file.filename}`;
    
    return res.status(200).json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Upload handler error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
