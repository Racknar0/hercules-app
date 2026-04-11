/**
 * ⚠️ DEPRECATED: Este es un script CLI legacy para procesamiento batch local.
 * En producción usa: node server.js  (o PM2: pm2 start server.js --name api-hercules)
 * NO uses este archivo con PM2, se ejecuta y termina inmediatamente causando loops de reinicio.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GeminiService } from './src/services/gemini.service.js';
import { ExcelService } from './src/services/excel.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas 
const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_FILE = path.join(__dirname, 'output', 'med-records.xlsx');

// Función auxiliar para determinar mime type
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    default: return null;
  }
}

async function main() {
  console.log("=== Iniciando Procesamiento de Documentos ===");
  
  if (!fs.existsSync(INPUT_DIR)) {
    console.log("No existe carpeta 'input', creándola...");
    fs.mkdirSync(INPUT_DIR);
    return;
  }

  const files = fs.readdirSync(INPUT_DIR);
  if (files.length === 0) {
    console.log("No hay archivos en la carpeta 'input' para analizar.");
    return;
  }

  const extractedList = [];

  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file);
    const mimeType = getMimeType(file);

    if (!mimeType) {
      console.log(`Saltando ${file} - Formato no soportado.`);
      continue;
    }

    // 1. Extraemos info usando Gemini
    const extractedData = await GeminiService.extractDataFromDocument(filePath, mimeType);
    
    if (extractedData) {
      // Le agregamos el nombre del archivo de origen para tener referencia en excel
      extractedData.archivoOrigen = file;
      extractedList.push(extractedData);
      console.log(`[+] Datos extraídos de ${file} con éxito.`);
    }
  }

  // 2. Exportamos a Excel
  if (extractedList.length > 0) {
    if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
        fs.mkdirSync(path.dirname(OUTPUT_FILE));
    }
    await ExcelService.exportToExcel(extractedList, OUTPUT_FILE);
  } else {
    console.log("No se extrajo información de ningún documento.");
  }
  
  console.log("=== Procesamiento Finalizado ===");
}

main().catch(console.error);
