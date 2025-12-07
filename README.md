# MindVault - Personal Knowledge Assistant

MindVault is a local-first Personal Knowledge Assistant that allows you to chat with your documents. It uses a RAG (Retrieval-Augmented Generation) pipeline to answer questions based on your uploaded files (PDFs, Word Docs, Text files) and can even perform data analysis on CSVs and Excel sheets.

## Features

*   **RAG (Retrieval-Augmented Generation):** Upload documents and ask questions. The system finds relevant sections and uses Gemini to answer.
*   **Data Analysis:** Upload CSV or Excel files. The system detects analytical queries and generates charts and insights.
*   **Local Vector Store:** Uses ChromaDB to store embeddings locally. Your data persists across restarts.
*   **File Management:** Upload and delete files directly from the UI.
*   **Privacy Focused:** Your documents stay on your machine (except for the snippets sent to the LLM for answering).

## Architecture

*   **Frontend:** React, Vite, Tailwind CSS
*   **Backend:** FastAPI, Python
*   **Vector Database:** ChromaDB (Local)
*   **LLM:** Google Gemini (via API)
*   **Embeddings:** `all-distilroberta-v1` (via `sentence-transformers`)

## Prerequisites

*   **Node.js** (v18+)
*   **Python** (v3.10+)
*   **Gemini API Key** (Get one from [Google AI Studio](https://makersuite.google.com/))

## Setup & Installation

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```

3.  Activate the virtual environment:
    *   **Windows:**
        ```powershell
        .\venv\Scripts\activate
        ```
    *   **Mac/Linux:**
        ```bash
        source venv/bin/activate
        ```

4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

5.  Create a `.env` file in the `backend` directory and add your Gemini API Key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

6.  Run the backend server:
    ```bash
    python main.py
    ```
    The backend will start at `http://localhost:8000`.

### 2. Frontend Setup

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the frontend development server:
    ```bash
    npm run dev
    ```
    The frontend will start at `http://localhost:5173`.

## Usage

1.  Open the frontend URL (`http://localhost:5173`) in your browser.
2.  Use the **Upload** area in the sidebar to upload PDF, DOCX, TXT, CSV, or Excel files.
3.  Once uploaded, type your question in the chat bar.
    *   *Example (Text):* "Summarize the key points of the meeting notes."
    *   *Example (Data):* "Plot the sales trend over the last year."
4.  To delete a file, hover over it in the sidebar and click the trash icon.

## Project Structure

```
mindvault/
├── backend/
│   ├── data/           # Stored uploaded files
│   ├── db/             # ChromaDB vector database files
│   ├── services/       # Core logic (Ingestion, Retrieval, LLM, Charts)
│   ├── main.py         # FastAPI application entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/ # React components (Chat, Sidebar, Charts)
│   │   ├── api.ts      # API client
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Notes

*   **Persistence:** Embeddings are stored in `backend/db/chroma_db`. Deleting this folder will reset the vector database, requiring you to re-upload files.
*   **Data Analysis:** Chart generation requires clean tabular data in CSV or Excel format.
