import { api } from './client'
import type { AggregateSavings } from '../types/contracts'

export const savingsApi = {
  aggregate: () => api.get<AggregateSavings>('/savings/aggregate'),
}
