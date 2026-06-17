import AssignmentCard from './AssignmentCard'

export default function AssignmentList({ assignments, subjectsById, onStatusChange }) {
  if (assignments.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-8 text-center text-text/50 text-sm">
        No assignments found.
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          subject={subjectsById[assignment.subject_id]}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  )
}
