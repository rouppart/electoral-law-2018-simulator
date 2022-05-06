/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Group {
  sect: string
  subdistrict?: string
  seats: number
}

interface Groups {
  [key: string]: Group
}

interface Candidate {
  name: string
  votes: number
  group: string
}

interface ProcessingCandidate extends Candidate {
  coalitionIndex: number
  excludedByQuota: boolean
  preferentialPercent: number
}

interface ProcessedCandidate extends ProcessingCandidate {
  win: boolean
  lossByGroup: boolean
  lossByCoalition: boolean
}

interface Coalition {
  name: string
  candidates: Candidate[];
  votes: number
  color: string
}

interface ProcessedCoalition extends Coalition {
  index: number
  countedVotes: number
  quotas: number
  fullSeats: number
  remainderVotes: number
  partialSeat: number
}

interface Dataset {
  groups: Groups
  coalitions: Coalition[]
  white: number
}

interface CountDict {
  [key: string]: number
}