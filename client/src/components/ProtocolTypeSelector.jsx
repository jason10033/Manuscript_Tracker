const PROTOCOL_TYPES = [
  {
    key: 'clinical_trial',
    label: 'Clinical Trial',
    guideline: 'SPIRIT 2013',
    description: 'Interventional clinical trial protocol — randomized, controlled, or single-arm trials',
    sectionCount: 20,
    color: 'border-blue-300 bg-blue-50 hover:border-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'observational',
    label: 'Observational Study',
    guideline: 'STROBE',
    description: 'Prospective cohort, case-control, or cross-sectional observational studies',
    sectionCount: 12,
    color: 'border-emerald-300 bg-emerald-50 hover:border-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'retrospective',
    label: 'Retrospective Observational',
    guideline: 'RECORD / STROBE',
    description: 'Studies using routinely collected health data, administrative databases, or chart review',
    sectionCount: 14,
    color: 'border-amber-300 bg-amber-50 hover:border-amber-500',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'qualitative',
    label: 'Qualitative Study',
    guideline: 'COREQ / SRQR',
    description: 'Interviews, focus groups, ethnography, and other qualitative research designs',
    sectionCount: 10,
    color: 'border-purple-300 bg-purple-50 hover:border-purple-500',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
]

export default function ProtocolTypeSelector({ onSelect, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Select Protocol Type</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose the study design that best matches your research. Sections will be based on the corresponding EQUATOR guideline.
          </p>
        </div>

        <div className="p-6 space-y-3">
          {PROTOCOL_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => onSelect(type.key)}
              className={`w-full text-left rounded-xl border-2 p-5 transition-all cursor-pointer ${type.color}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{type.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${type.badgeColor}`}>
                    {type.guideline}
                  </span>
                  <span className="text-xs text-gray-500">{type.sectionCount} sections</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
