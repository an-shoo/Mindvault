export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  content: string; // Raw text content
  size: number;
  isIndexed?: boolean; // Track if the file has been processed into the vector store
}

export interface DocumentChunk {
  id: string;
  fileId: string;
  text: string;
  vector?: number[];
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface ChartConfig {
  type: ChartType;
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  xAxisKey: string;
  series: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
}

export interface AiResponse {
  answer: string;
  chart?: ChartConfig;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chart?: ChartConfig;
  timestamp: number;
  isError?: boolean;
}
