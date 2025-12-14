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

// Mock candidate for testing
export const mockCandidate: Candidate = {
  id: 'mock-candidate-1',
  name: 'Alex Johnson',
  role: 'Senior Frontend Engineer',
  notes:
    '5+ years experience with React and TypeScript. Looking for a technical lead role.',
  createdAt: new Date().toISOString(),
}
