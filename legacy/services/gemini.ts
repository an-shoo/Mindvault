import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AiResponse, UploadedFile, DocumentChunk } from "../types";
import { VectorStore } from "./vectorStore";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: "The natural language answer to the user's question based on the context.",
    },
    chart: {
      type: Type.OBJECT,
      nullable: true,
      description: "Optional configuration for a chart if the user's query requires data visualization.",
      properties: {
        type: {
          type: Type.STRING,
          enum: ["bar", "line", "pie", "area"],
        },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        xAxisKey: { type: Type.STRING },
        data: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              value: { type: Type.NUMBER },
            },
          },
        },
        series: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dataKey: { type: Type.STRING },
              name: { type: Type.STRING },
              color: { type: Type.STRING },
            },
            required: ["dataKey", "name", "color"],
          },
        },
      },
      required: ["type", "title", "data", "xAxisKey", "series"],
    },
  },
  required: ["answer"],
};

export class GeminiService {
  private client: GoogleGenAI;
  private modelName = "gemini-2.5-flash";
  private embeddingModelName = "text-embedding-004";
  public vectorStore: VectorStore;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    this.vectorStore = new VectorStore();
  }

  // New method: Generate embeddings for a text
  async getEmbedding(text: string): Promise<number[]> {
    if (!text) return [];
    try {
      const result = await this.client.models.embedContent({
        model: this.embeddingModelName,
        contents: [
            {
                role: 'user',
                parts: [{ text }]
            }
        ]
      });
      return result.embeddings?.[0]?.values || [];
    } catch (error) {
      console.error("Embedding error:", error);
      return [];
    }
  }

  // New method: Index files (Chunking + Embedding)
  async indexFiles(files: UploadedFile[], onProgress?: (current: number, total: number) => void): Promise<void> {
    const unindexedFiles = files.filter(f => !f.isIndexed);
    if (unindexedFiles.length === 0) return;

    let processedCount = 0;
    const totalFiles = unindexedFiles.length;

    for (const file of unindexedFiles) {
      // 1. Text Chunking
      const textChunks = VectorStore.splitText(file.content, 1000, 200);
      
      // 2. Embedding (Batching could be done here, but doing sequential for simplicity/rate limits)
      const chunksWithVectors: DocumentChunk[] = [];
      
      for (const text of textChunks) {
        // Simple delay to avoid rate limits if many chunks
        await new Promise(r => setTimeout(r, 100)); 
        const vector = await this.getEmbedding(text);
        if (vector.length > 0) {
            chunksWithVectors.push({
                id: crypto.randomUUID(),
                fileId: file.id,
                text: text,
                vector: vector
            });
        }
      }

      // 3. Add to Vector Store
      this.vectorStore.addDocuments(chunksWithVectors);
      
      // Mark as indexed in the object (caller should update state)
      file.isIndexed = true;
      
      processedCount++;
      if (onProgress) onProgress(processedCount, totalFiles);
    }
  }

  async generateResponse(
    query: string,
    files: UploadedFile[]
  ): Promise<AiResponse> {
    if (!process.env.API_KEY) {
      throw new Error("Missing API Key.");
    }

    // 1. Embed Query
    const queryVector = await this.getEmbedding(query);

    // 2. Retrieve Relevant Chunks (RAG)
    const relevantChunks = this.vectorStore.search(queryVector, 5); // Top 5 chunks

    // 3. Construct Context
    // We also include "File Metadata/Headers" to help with CSV schema understanding
    // even if specific rows aren't retrieved.
    let context = "--- RETRIEVED CONTEXT ---\n";
    relevantChunks.forEach((chunk, i) => {
       context += `[Chunk ${i+1}]\n${chunk.text}\n\n`;
    });

    // Add explicit schema info for CSV/Excel files to help with Chart generation
    const spreadsheetFiles = files.filter(f => f.type.includes('sheet') || f.type.includes('excel') || f.name.endsWith('.csv'));
    if (spreadsheetFiles.length > 0) {
        context += "\n--- DATA SCHEMAS (For Analysis) ---\n";
        spreadsheetFiles.forEach(f => {
            // Take first 5 lines as header/sample
            const preview = f.content.split('\n').slice(0, 5).join('\n');
            context += `File: ${f.name}\nSample:\n${preview}\n\n`;
        });
    }

    // 4. System Instruction
    const systemInstruction = `
      You are MindVault, an intelligent RAG-based assistant.
      
      Workflow:
      1. User asks a question.
      2. You are provided with RELEVANT CHUNKS retrieved from documents via vector search.
      3. You are provided with DATA SCHEMAS for any spreadsheets to help with analytics.
      
      Task:
      - Answer the user's question based ONLY on the retrieved context.
      - If the context is insufficient, politely say you don't have enough information in the uploaded docs.
      
      ANALYTICS & CHARTS:
      - If the user asks to visualize data (e.g. "plot", "show graph") and you have the data in the context or can infer the structure from the Schema:
      - Generate a 'chart' object.
      - If you need to aggregate data (e.g. "Total sales by region") and the retrieved chunks only show a partial list, do your best with the available data but add a disclaimer in the text answer that this is based on the retrieved subset of data.
      - However, for small CSVs, the context might contain the full data.
    `;

    // 5. Generate
    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: "user",
            parts: [
              { text: context },
              { text: `Question: ${query}` }
            ],
          },
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      const parsed = JSON.parse(response.text!) as AiResponse;
      return parsed;

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate response.");
    }
  }
}
