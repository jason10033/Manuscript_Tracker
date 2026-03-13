export const STATUSES = [
  { key: 'IDEA', label: 'Idea', color: 'bg-gray-200 text-gray-800', columnColor: 'border-gray-300' },
  { key: 'DRAFT_IN_PROGRESS', label: 'Draft In Progress', color: 'bg-blue-100 text-blue-800', columnColor: 'border-blue-300' },
  { key: 'DRAFT_CIRCULATED', label: 'Draft Circulated', color: 'bg-indigo-100 text-indigo-800', columnColor: 'border-indigo-300' },
  { key: 'SUBMITTED', label: 'Submitted', color: 'bg-yellow-100 text-yellow-800', columnColor: 'border-yellow-300' },
  { key: 'REVISE_RESUBMIT', label: 'Revise & Resubmit', color: 'bg-orange-100 text-orange-800', columnColor: 'border-orange-300' },
  { key: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800', columnColor: 'border-red-300' },
  { key: 'ACCEPTED', label: 'Accepted', color: 'bg-green-100 text-green-800', columnColor: 'border-green-300' },
]

export const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]))

// Valid next statuses from each status
export const VALID_TRANSITIONS = {
  IDEA: ['DRAFT_IN_PROGRESS'],
  DRAFT_IN_PROGRESS: ['DRAFT_CIRCULATED'],
  DRAFT_CIRCULATED: ['SUBMITTED'],
  SUBMITTED: ['REVISE_RESUBMIT', 'REJECTED', 'ACCEPTED'],
  REVISE_RESUBMIT: ['SUBMITTED'],
  REJECTED: ['SUBMITTED'],
  ACCEPTED: [],
}
