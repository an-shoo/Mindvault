import { DocumentChunk } from '../types';

export class VectorStore {
  private chunks: DocumentChunk[] = [];

  constructor() {}

  // Basic recursive-like character splitter
  static splitText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = startIndex + chunkSize;
      
      // If we are not at the end of the text, try to break at a newline or space
      if (endIndex < text.length) {
        // Look for the last period or newline within the chunk to break cleanly
        const lastPeriod = text.lastIndexOf('.', endIndex);
        const lastNewline = text.lastIndexOf('\n', endIndex);
        
        // Prioritize splitting at paragraphs/sentences near the limit
        let breakPoint = Math.max(lastPeriod, lastNewline);
        
        // If no good breakpoint found in the last 20% of chunk, just split at space
        if (breakPoint < startIndex + (chunkSize * 0.8)) {
           breakPoint = text.lastIndexOf(' ', endIndex);
        }
        
        // If still no space (mega long word), force split
        if (breakPoint > startIndex) {
          endIndex = breakPoint + 1;
        }
      }

      const chunk = text.slice(startIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      // Move window forward, accounting for overlap
      startIndex = endIndex - overlap;
      // Ensure we always move forward
      if (startIndex >= endIndex) startIndex = endIndex; 
    }

    return chunks;
  }

  // Add chunks with vectors to the store
  addDocuments(chunks: DocumentChunk[]) {
    this.chunks.push(...chunks);
  }

  // Clear store (useful when resetting)
  clear() {
    this.chunks = [];
  }

  // Cosine Similarity Search
  search(queryVector: number[], topK: number = 5): DocumentChunk[] {
    if (this.chunks.length === 0) return [];

    const scoredChunks = this.chunks.map(chunk => {
      if (!chunk.vector) return { chunk, score: -1 };
      const score = this.cosineSimilarity(queryVector, chunk.vector);
      return { chunk, score };
    });

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, topK).map(item => item.chunk);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
