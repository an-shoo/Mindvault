from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
import uvicorn

from services.ingestion import IngestionService
from services.retrieval import VectorStore
from services.llm import LLMService
from services.charts import ChartService

app = FastAPI(title="MindVault API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
# Note: In a production app, these might be singletons or dependencies injected
ingestion = IngestionService()
vector_store = VectorStore()
llm = LLMService()
charts = ChartService(llm)

# Setup data directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str
    sources: List[str]
    chart: Optional[Dict[str, Any]] = None

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    results = []
    print(f"Uploading {len(files)} files...")
    
    for file in files:
        try:
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            print(f"File saved: {file.filename}")
            
            file_ext = file.filename.split('.')[-1].lower()
            
            # 1. Parse Text for RAG
            text = ingestion.parse_file(file_path, file_ext)
            if text:
                # 2. Chunk & Embed
                chunks = ingestion.chunk_text(text)
                vector_store.add_chunks(chunks, file.filename)
                print(f"Processed {len(chunks)} chunks for {file.filename}")
                results.append({"filename": file.filename, "chunks": len(chunks), "status": "processed"})
            else:
                print(f"No text extracted for {file.filename}")
                results.append({"filename": file.filename, "status": "failed_or_empty"})

            # 3. If CSV/Excel, load into ChartService for Analysis
            if file_ext in ["csv", "xlsx", "xls"]:
                charts.load_dataframe(file.filename, file_path)
                print(f"Loaded dataframe for {file.filename}")
                
        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            results.append({"filename": file.filename, "status": "error", "detail": str(e)})
            
    return {"results": results}

@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    question = request.question
    print(f"Received question: {question}")
    
    # 1. Check for Chart Intent (Analytical Query)
    # Only if we have dataframes loaded
    if charts.dataframes:
        chart_data = charts.analyze_query(question)
        if chart_data:
            print("Chart intent detected")
            return AskResponse(
                answer=chart_data["explanation"],
                sources=[chart_data.get("filename", "Data Analysis")],
                chart=chart_data
            )

    # 2. RAG Flow (Semantic Search)
    relevant_chunks = vector_store.search(question)
    
    if not relevant_chunks:
        return AskResponse(answer="I couldn't find any relevant information in your documents.", sources=[])
    
    context = "\n\n".join([f"Source: {c['filename']}\n{c['text']}" for c in relevant_chunks])
    
    prompt = f"""
    You are a helpful Personal Knowledge Assistant. 
    Use the following retrieved context to answer the user's question accurately.
    If the context doesn't contain the answer, say "I don't have enough information in the documents."
    
    Context:
    {context}
    
    Question: {question}
    """
    
    answer = llm.get_response(prompt)
    sources = list(set([c['filename'] for c in relevant_chunks]))
    
    return AskResponse(answer=answer, sources=sources)

@app.delete("/files/{filename}")
async def delete_file(filename: str):
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # 1. Delete from Disk
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted file from disk: {filename}")
        else:
            print(f"File not found on disk: {filename}")
            # We continue to ensure embeddings are cleaned up even if file is missing
            
        # 2. Delete from Vector Store
        vector_store.delete_file(filename)
        
        # 3. Remove from ChartService if loaded
        if filename in charts.dataframes:
            del charts.dataframes[filename]
            print(f"Removed dataframe from memory: {filename}")

        return {"status": "success", "message": f"Deleted {filename}"}
        
    except Exception as e:
        print(f"Error deleting {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files")
def list_files():
    try:
        files = os.listdir(UPLOAD_DIR)
        return {"files": files}
    except Exception as e:
        return {"files": [], "error": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

