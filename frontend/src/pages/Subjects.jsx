import { useState } from 'react'
import { Plus, X, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import useSubjects from '../hooks/useSubjects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const EMPTY_FORM = { name: '', color: '#4f46E5', teacher: '', room: '' }

export default function Subjects() {
  const { subjects, loading, createSubject, updateSubject, deleteSubject } = useSubjects()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (subject) => {
    setEditingId(subject.id)
    setForm({
      name: subject.name,
      color: subject.color,
      teacher: subject.teacher || '',
      room: subject.room || '',
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const action = editingId ? updateSubject(editingId, form) : createSubject(form)

    action
      .then(() => {
        toast.success(editingId ? 'Subject updated' : 'Subject added')
        setShowForm(false)
        setForm(EMPTY_FORM)
        setEditingId(null)
      })
      .catch(() => toast.error('Could not save subject'))
  }

  const handleDelete = (id) => {
    deleteSubject(id)
      .then(() => toast.success('Subject deleted'))
      .catch(() => toast.error('Could not delete subject'))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-sm text-muted-foreground">
            Manage subjects used across timetable, assignments, exams, and grades.
          </p>
        </div>
        <Button
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          variant={showForm ? 'outline' : 'default'}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Subject'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Mathematics"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="teacher">Teacher</Label>
                  <Input
                    id="teacher"
                    name="teacher"
                    placeholder="Optional"
                    value={form.teacher}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    name="room"
                    placeholder="Optional"
                    value={form.room}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="color">Color</Label>
                  <input
                    id="color"
                    type="color"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    className="h-10 w-full rounded-md border border-input bg-transparent cursor-pointer px-1 py-1"
                  />
                </div>
              </div>
              <Button type="submit">
                {editingId ? 'Save Changes' : 'Save Subject'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading subjects...</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subjects yet. Add one above.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subject) => (
						<Card key={subject.id} className="group">
							<CardContent className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<span
										className="w-3 h-3 rounded-full shrink-0 mt-1"
										style={{ backgroundColor: subject.color }}
									/>
									<div>
										<h2 className="font-medium">{subject.name}</h2>
										<p className="text-sm text-muted-foreground">
											{[subject.teacher, subject.room].filter(Boolean).join(' · ') || '—'}
                    </p>
									</div>
								</div>
                <div className="flex gap-1 shrink-0">
									<Button
										variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    aria-label={`Edit ${subject.name}`}
                    onClick={() => openEdit(subject)}
                  >
										<Pencil size={14} />
									</Button>
									<AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={`Delete ${subject.name}`}>
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete subject?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently deletes <strong>{subject.name}</strong>. Assignments,
                          exams, and grades linked to it will lose their subject reference.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(subject.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
    </div>
  )
}
