import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const baseDir = 'c:\\Users\\arnav\\Downloads\\chatbot\\beam-analyzer';
const filesToInclude = [
  { name: 'beam-engine.js', lang: 'javascript', title: '1. Analytical Mechanics & Equilibrium Engine (beam-engine.js)', desc: 'Static equilibrium solver, continuous section mechanics evaluation across 2,000 points, root finding for zero-shear and contraflexure points, LaTeX piece-wise expressions, and CSV data export.' },
  { name: 'beam-renderer.js', lang: 'javascript', title: '2. High-DPI Canvas Multi-Diagram Renderer (beam-renderer.js)', desc: 'HiDPI synchronized canvas rendering for 2D Beam Schematic, Shear Force Diagram (SFD), Bending Moment Diagram (BMD), and synchronized crosshair scrubbing.' },
  { name: 'presets.js', lang: 'javascript', title: '3. Engineering Loading Presets (presets.js)', desc: 'Preset library of 7 classic civil and mechanical engineering beam load configurations.' },
  { name: 'app.js', lang: 'javascript', title: '4. Main Application Controller (app.js)', desc: 'Reactive state management, two-way input synchronization, live diagnostics, dynamic load list handling, and modal controllers.' },
  { name: 'styles.css', lang: 'css', title: '5. Styling & CAD Design System (styles.css)', desc: 'Dark/light mode themes, glassmorphism, responsive grid layout, and print media formatting.' },
  { name: 'index.html', lang: 'html', title: '6. User Interface & Dashboard Markup (index.html)', desc: 'Semantic HTML5 structure for control sidebar, metrics ribbon, diagram viewports, and interactive modals.' }
];

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let sectionsHtml = '';
let totalLines = 0;

for (const file of filesToInclude) {
  const filePath = path.join(baseDir, file.name);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  totalLines += lines.length;

  const numberedContent = lines.map((line, idx) => {
    const num = (idx + 1).toString().padStart(4, ' ');
    return `<span class="line-num">${num}</span>  ${escapeHtml(line)}`;
  }).join('\n');

  sectionsHtml += `
    <div class="code-file-section">
      <div class="file-header">
        <div class="file-title-group">
          <span class="file-icon">&lt;/&gt;</span>
          <h2 class="file-title">${file.title}</h2>
        </div>
        <span class="file-badge">${lines.length} lines &bull; ${file.lang.toUpperCase()}</span>
      </div>
      <p class="file-desc">${file.desc}</p>
      <pre class="code-block"><code>${numberedContent}</code></pre>
    </div>
  `;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Structural Beam Analysis - Complete Codebase</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.5;
    }

    /* Cover / Overview Banner */
    .cover-card {
      border: 2px solid #4f46e5;
      background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 24px;
      page-break-after: avoid;
    }

    .doc-badge {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff;
      font-size: 9pt;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .doc-title {
      font-size: 20pt;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .doc-subtitle {
      font-size: 12pt;
      color: #475569;
      margin-bottom: 16px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      border-top: 1px solid #cbd5e1;
      padding-top: 14px;
      margin-top: 10px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 8pt;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.05em;
    }

    .meta-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10pt;
      font-weight: 600;
      color: #0f172a;
    }

    /* File Section */
    .code-file-section {
      page-break-before: always;
      margin-bottom: 20px;
    }

    .code-file-section:first-of-type {
      page-break-before: auto;
    }

    .file-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 6px 6px 0 0;
      border-bottom: 2px solid #6366f1;
    }

    .file-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .file-icon {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10pt;
      color: #38bdf8;
      font-weight: bold;
    }

    .file-title {
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #f8fafc;
    }

    .file-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      background: rgba(255, 255, 255, 0.15);
      padding: 3px 8px;
      border-radius: 4px;
      color: #cbd5e1;
    }

    .file-desc {
      background: #f1f5f9;
      border-left: 3px solid #6366f1;
      border-right: 1px solid #e2e8f0;
      padding: 8px 12px;
      font-size: 9pt;
      color: #334155;
    }

    .code-block {
      background: #0a0f1d;
      color: #e2e8f0;
      padding: 12px;
      border-radius: 0 0 6px 6px;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 7.5pt;
      line-height: 1.45;
      overflow-x: auto;
      white-space: pre;
      tab-size: 2;
      border: 1px solid #1e293b;
      border-top: none;
    }

    .line-num {
      color: #64748b;
      user-select: none;
      display: inline-block;
      width: 32px;
      text-align: right;
      padding-right: 8px;
      border-right: 1px solid #334155;
      margin-right: 6px;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .code-file-section {
        page-break-inside: avoid;
      }
      .code-block {
        page-break-inside: auto;
      }
    }
  </style>
</head>
<body>

  <!-- Cover & Overview Header -->
  <div class="cover-card">
    <div class="doc-badge">Source Code Specification & Technical Reference</div>
    <h1 class="doc-title">Structural Beam Analysis Platform</h1>
    <p class="doc-subtitle">Shear Force & Bending Moment Diagnostics (SFD & BMD) for Simply Supported, Overhanging, and Cantilever Beams</p>
    
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Files Documented</span>
        <span class="meta-val">${filesToInclude.length} Source Files</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Total Code Size</span>
        <span class="meta-val">${totalLines.toLocaleString()} Lines</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Resolution</span>
        <span class="meta-val">2,000 Sample Points</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Architecture</span>
        <span class="meta-val">ES Modules / High-DPI Canvas</span>
      </div>
    </div>
  </div>

  ${sectionsHtml}

</body>
</html>
`;

const htmlPath = path.join(baseDir, 'code_documentation.html');
const pdfPath = path.join(baseDir, 'Structural_Beam_Analysis_Codebase.pdf');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Generated HTML documentation at:', htmlPath);

// Invoke Microsoft Edge Headless to print PDF
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
console.log('Rendering PDF with Microsoft Edge Headless...');

try {
  const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('Successfully created PDF at:', pdfPath);
  const stats = fs.statSync(pdfPath);
  console.log(`PDF File Size: ${(stats.size / 1024).toFixed(1)} KB`);
} catch (err) {
  console.error('Error rendering PDF with Edge:', err);
}
