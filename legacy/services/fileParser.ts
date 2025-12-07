import { UploadedFile } from '../types';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

export const readFileContent = async (file: File): Promise<UploadedFile> => {
  let content = '';

  try {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      content = await parsePdf(file);
    } else if (
      file.type.includes('sheet') || 
      file.type.includes('excel') || 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls')
    ) {
      content = await parseExcel(file);
    } else {
      // Default to text parsing for CSV, TXT, MD, JSON
      content = await parseText(file);
    }

    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      content: content,
      isIndexed: false,
    };
  } catch (error) {
    console.error("File parsing error:", error);
    throw new Error(`Failed to parse ${file.name}`);
  }
};

const parseText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

const parseExcel = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let allText = "";
        
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          // Convert to CSV for structure
          const csv = XLSX.utils.sheet_to_csv(sheet);
          allText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
        });
        
        resolve(allText);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const parsePdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }
  
  return fullText;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
