import axios from 'axios';
import type { CaptureAnalysis } from '../types';

const api = axios.create({ baseURL: '/api' });

export async function uploadCapture(file: File): Promise<CaptureAnalysis> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<CaptureAnalysis>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function fetchDemo(): Promise<CaptureAnalysis> {
  const { data } = await api.get<CaptureAnalysis>('/demo');
  return data;
}
