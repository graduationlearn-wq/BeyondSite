const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const ejsLib = require('ejs');
const archiver = require('archiver');

dotenv.config({ 
  path: path.resolve(__dirname, '.env'),
  override: true 
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const { GoogleGenerativeAI } = require("@google/generative-ai"); 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─────────────────────────────────────────────
// 🆕 LOGIN ROUTES — added here, before all others
// ─────────────────────────────────────────────

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // 🔒 Temporary hardcoded check — replace with DB + bcrypt later
  if (email === 'admin@example.com' && password === 'password123') {
    return res.json({ success: true, redirect: '/' });
  }

  return res.status(401).json({ error: 'Invalid email or password.' });
});

// ─────────────────────────────────────────────
// END OF NEW ROUTES
// ─────────────────────────────────────────────

// Route: Serve the form page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route: Get AI suggestions (with auto-retry)
app.post('/api/ai-suggest', async (req, res) => {
  try {
    const { businessDescription } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Generate a website profile for this business: "${businessDescription}". 
    Return ONLY a JSON object with these keys: 
    "businessType", "targetAudience", "suggestedProducts" (array), "suggestedTone", "suggestedAbout", "suggestedKeywords" (array).`;

    let retries = 3;
    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return res.json(JSON.parse(cleanedText));
      } catch (error) {
        if (error.status === 503 && retries > 1) {
          console.log(`Google's servers are busy. Retrying... (${retries - 1} attempts left)`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 2500));
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route: Preview the website
app.post('/api/preview', async (req, res) => {
  try {
    const { businessName, tagline, description, about, products, tone, template } = req.body;

    if (!businessName || !about || !products) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const templateData = {
      businessName, tagline, description, about,
      products: JSON.parse(products),
      tone,
      year: new Date().getFullYear()
    };

    let templateFile = 'website-template-1.ejs';
    if (template === 'template-2') templateFile = 'website-template-2.ejs';
    else if (template === 'template-3') templateFile = 'website-template-3.ejs';
    else if (template === 'template-4') templateFile = 'website-template-4.ejs';
    else if (template === 'template-5') templateFile = 'website-template-5.ejs';
    else if (template === 'template-6') templateFile = 'website-template-6.ejs';
    else if (template === 'template-7') templateFile = 'website-template-7.ejs';
    else if (template === 'template-8') templateFile = 'website-template-8.ejs';

    const htmlContent = await ejsLib.renderFile(
      path.join(__dirname, 'templates', templateFile),
      templateData
    );

    res.json({ html: htmlContent });
  } catch (error) {
    console.error('Preview Error:', error.message);
    res.status(500).json({ error: 'Failed to generate preview: ' + error.message });
  }
});

// Route: Generate website and download as ZIP
app.post('/api/generate', async (req, res) => {
  try {
    const { businessName, tagline, description, about, products, tone, template } = req.body;

    if (!businessName || !about || !products) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const templateData = {
      businessName, tagline, description, about,
      products: JSON.parse(products),
      tone,
      year: new Date().getFullYear()
    };

    let templateFile = 'website-template-1.ejs';
    if (template === 'template-2') templateFile = 'website-template-2.ejs';
    else if (template === 'template-3') templateFile = 'website-template-3.ejs';
    else if (template === 'template-4') templateFile = 'website-template-4.ejs';
    else if (template === 'template-5') templateFile = 'website-template-5.ejs';
    else if (template === 'template-6') templateFile = 'website-template-6.ejs';
    else if (template === 'template-7') templateFile = 'website-template-7.ejs';
    else if (template === 'template-8') templateFile = 'website-template-8.ejs';

    const htmlContent = await ejsLib.renderFile(
      path.join(__dirname, 'templates', templateFile),
      templateData
    );

    const cssContent = fs.readFileSync(path.join(__dirname, 'public', 'style.css'), 'utf8');

    const tempDir = path.join(__dirname, 'generated', `website-${Date.now()}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    fs.writeFileSync(path.join(tempDir, 'index.html'), htmlContent);
    fs.writeFileSync(path.join(tempDir, 'style.css'), cssContent);

    const jsPath = path.join(__dirname, 'public', 'script.js');
    if (fs.existsSync(jsPath)) fs.copyFileSync(jsPath, path.join(tempDir, 'script.js'));

    const zipPath = path.join(__dirname, 'generated', `${businessName.replace(/\s+/g, '-')}-website.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.download(zipPath, (err) => {
        if (err) console.error(err);
        try {
          fs.rmSync(tempDir, { recursive: true });
          fs.unlinkSync(zipPath);
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      });
    });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Failed to create archive' });
    });

    archive.pipe(output);
    archive.directory(tempDir + '/', false);
    archive.finalize();

  } catch (error) {
    console.error('Generation Error:', error.message);
    res.status(500).json({ error: 'Failed to generate website: ' + error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Server error: ' + err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});