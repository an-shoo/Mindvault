import chromadb
from chromadb.config import Settings
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import os
import uuid

class VectorStore:
    def __init__(self):
        # Initialize sentence transformer model
        self.model = SentenceTransformer('all-distilroberta-v1')
        
        # Setup ChromaDB with persistence
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = os.path.join(base_dir, "db", "chroma_db")
        
        # Ensure the directory exists
        os.makedirs(db_path, exist_ok=True)
        
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_or_create_collection(name="documents")
        print(f"Vector Store initialized at {db_path}")

    def add_chunks(self, chunks: List[str], filename: str):
        if not chunks:
            return

        # Generate embeddings
        # Normalize embeddings for Cosine Similarity
        embeddings = self.model.encode(chunks, normalize_embeddings=True)
        
        # Prepare data for ChromaDB
        ids = [str(uuid.uuid4()) for _ in chunks]
        metadatas = [{"filename": filename} for _ in chunks]
        
        # Add to collection
        self.collection.add(
            documents=chunks,
            embeddings=embeddings.tolist(),
            metadatas=metadatas,
            ids=ids
        )
            
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        # Check if collection is empty
        if self.collection.count() == 0:
            return []
            
        # Generate query embedding
        query_vector = self.model.encode([query], normalize_embeddings=True)
        
        # Search in ChromaDB
        results = self.collection.query(
            query_embeddings=query_vector.tolist(),
            n_results=k
        )
        
        # Format results to match expected output structure
        formatted_results = []
        
        # Chroma returns lists of lists (one list per query)
        if results['ids'] and len(results['ids']) > 0:
            # We only have one query, so take the first list
            result_ids = results['ids'][0]
            result_docs = results['documents'][0]
            result_metadatas = results['metadatas'][0]
            
            for i in range(len(result_ids)):
                formatted_results.append({
                    "id": result_ids[i],
                    "text": result_docs[i],
                    "filename": result_metadatas[i]["filename"] if result_metadatas[i] else "unknown"
                })
                
        
        return formatted_results

    def delete_file(self, filename: str):
        """Removes all embeddings associated with a specific file."""
        try:
            # Delete where metadata 'filename' matches the provided filename
            self.collection.delete(
                where={"filename": filename}
            )
            print(f"Deleted embeddings for {filename}")
            return True
        except Exception as e:
            print(f"Error deleting embeddings for {filename}: {e}")
            return False
