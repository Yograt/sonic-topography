app.get('/api/local/audio', async (req, res) => {
  try {
    const filePath = String(req.query.path || '');
    if (!filePath) {
      res.status(400).json({ error: 'Missing path' });
      return;
    }

    // Security: only allow files from Music folder
    const allowedPrefix = 'C:\\Users\\fedri\\Music\\';
    if (!filePath.startsWith(allowedPrefix)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: 'Local audio proxy failed' });
  }
});
