const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'Documentos', 'catalogo_final_con_fotos (40).html');
const destDir = __dirname;
const imgDir = path.join(destDir, 'assets', 'images');

if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

let html = fs.readFileSync(srcPath, 'utf8');

// Extract script
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.log("No script found!");
    process.exit(1);
}
let scriptContent = scriptMatch[1];

// Extract variables
function extractVar(name) {
    const regex = new RegExp(`(?:const|let)\\s+${name}\\s*=\\s*([\\s\\S]*?);\\s*(?:const|let|//|\\n)`);
    const match = scriptContent.match(regex);
    if (match) {
        return match[1].trim();
    }
    return null;
}

const datosStr = extractVar('DATOS_INCRUSTADOS');
const imagenesStr = extractVar('IMAGENES_INCRUSTADAS');
const logoStr = extractVar('LOGO_INCRUSTADO');
const catInicialStr = extractVar('CATEGORIA_INICIAL');
const fechaStr = extractVar('FECHA_CATALOGO');
const vendedorStr = extractVar('VENDEDOR_INCRUSTADO');

if (!datosStr || !imagenesStr) {
    console.log("Could not find variables.");
    process.exit(1);
}

let datos = JSON.parse(datosStr);
let imagenes = JSON.parse(imagenesStr);
let logo = JSON.parse(logoStr);

// Save images
let newImagenes = {};
for (const [key, base64Str] of Object.entries(imagenes)) {
    if (!base64Str) continue;
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) continue;
    const ext = matches[1].split('/')[1];
    const data = Buffer.from(matches[2], 'base64');
    const filename = `${key}.${ext}`;
    fs.writeFileSync(path.join(imgDir, filename), data);
    newImagenes[key] = `assets/images/${filename}`;
}

let newLogoPath = "";
if (logo) {
    const matches = logo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
        const ext = matches[1].split('/')[1];
        const data = Buffer.from(matches[2], 'base64');
        const filename = `logo.${ext}`;
        fs.writeFileSync(path.join(imgDir, filename), data);
        newLogoPath = `assets/images/${filename}`;
    }
}

// Write app.js (without the massive base64 strings)
let cleanScript = scriptContent
    .replace(`const DATOS_INCRUSTADOS = ${datosStr};`, `const DATOS_INCRUSTADOS = ${JSON.stringify(datos, null, 2)};`)
    .replace(`const IMAGENES_INCRUSTADAS = ${imagenesStr};`, `const IMAGENES_INCRUSTADAS = ${JSON.stringify(newImagenes, null, 2)};`)
    .replace(`let LOGO_INCRUSTADO = ${logoStr};`, `let LOGO_INCRUSTADO = ${JSON.stringify(newLogoPath)};`);

fs.writeFileSync(path.join(destDir, 'app.js'), cleanScript);

// Extract style
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
    fs.writeFileSync(path.join(destDir, 'styles.css'), styleMatch[1].trim());
}

// Generate index.html
let cleanHtml = html
    .replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="styles.css">')
    .replace(/<script>[\s\S]*?<\/script>/, '<script src="app.js"></script>');

// Clean up upload section inside HTML
cleanHtml = cleanHtml.replace(/<div class="upload-section">[\s\S]*?<\/div>\s*<div class="top-panel">/, '<div class="top-panel">');

// Ensure has-data class is on body so it displays normally
cleanHtml = cleanHtml.replace(/<body>/, '<body class="has-data">');

// Clear out the hardcoded DOM generated previously, but keep modals
cleanHtml = cleanHtml.replace(/<div id="catalog-sections">[\s\S]*?(<div[^>]*id="cart-overlay"[^>]*>|<div[^>]*id="photo-overlay"[^>]*>|<script>|<\/body>)/i, '<div id="catalog-sections"></div>\n$1');

// Replace base64 logo in HTML
if (newLogoPath) {
    cleanHtml = cleanHtml.replace(/<div id="logo-place"><img src="data:image[\s\S]*?"><\/div>/, `<div id="logo-place"><img src="${newLogoPath}"></div>`);
}


fs.writeFileSync(path.join(destDir, 'index.html'), cleanHtml);
console.log("Extraction complete!");
