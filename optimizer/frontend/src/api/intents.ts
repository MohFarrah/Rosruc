import { api } from './client'
import type { Intent } from '../types/contracts'

export const intentsApi = {
  list: () => api.get<Intent[]>('/intents'),
  get: (id: string) => api.get<Intent>(`/intents/${id}`),
  analyze: (id: string) => api.post<Record<string, unknown>>(`/intents/${id}/analyze`),
}
