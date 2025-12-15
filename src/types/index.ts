export interface Candidate {
  id: string
  name: string
  role: string
  notes?: string
  createdAt: string
}

export interface Room {
  id: string
  candidateId: string
  createdAt: string
}
