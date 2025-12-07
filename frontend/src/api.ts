import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const uploadFiles = async (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const askQuestion = async (question: string) => {
  const response = await axios.post(`${API_URL}/ask`, { question });
  return response.data;
};

export const getFiles = async () => {
    const response = await axios.get(`${API_URL}/files`);
    return response.data;
}

export const deleteFile = async (filename: string) => {
    const response = await axios.delete(`${API_URL}/files/${filename}`);
    return response.data;
};

