import pandas as pd
from pypdf import PdfReader
import docx
import os
from typing import List

class IngestionService:
    def parse_file(self, file_path: str, file_type: str) -> str:
        text = ""
        try:
            if file_type == "pdf":
                reader = PdfReader(file_path)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
            elif file_type == "docx":
                doc = docx.Document(file_path)
                for para in doc.paragraphs:
                    text += para.text + "\n"
            elif file_type == "txt":
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
            elif file_type in ["csv", "xlsx", "xls"]:
                if file_type == "csv":
                    df = pd.read_csv(file_path)
                    text = df.to_string(index=False)
                else:
                    # Read all sheets for Excel
                    dfs = pd.read_excel(file_path, sheet_name=None)
                    for sheet_name, df in dfs.items():
                        text += f"\n--- Sheet: {sheet_name} ---\n"
                        text += df.to_string(index=False)
        except Exception as e:
            print(f"Error parsing file {file_path}: {e}")
            return ""
            
        return text

    def chunk_text(self, text: str, chunk_size: int = 2000, overlap: int = 200) -> List[str]:
        chunks = []
        start = 0
        text_len = len(text)
        
        if text_len <= chunk_size:
            return [text]
            
        while start < text_len:
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap
            
        return chunks

