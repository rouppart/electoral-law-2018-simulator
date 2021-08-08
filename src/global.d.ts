/// <reference types="svelte" />

interface Coalition {
  name: string
  votes: number
}

interface ProcessedCoalition extends Coalition {
  index: number
  countedVotes: number
  fullSeats: number
  remainderVotes: number
  partialSeat: number
}

interface EliminatedCoalition extends Coalition {
  eliminatingQuota: number
}