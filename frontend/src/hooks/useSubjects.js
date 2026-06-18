import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'

export default function useSubjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSubjects = useCallback(() => {
    setLoading(true)
    return api
      .get('/subjects')
      .then((res) => setSubjects(res.data || []))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  const createSubject = useCallback((data) => {
    return api.post('/subjects', data).then((res) => {
      setSubjects((prev) => [...prev, res.data])
      return res.data
    })
  }, [])

  const updateSubject = useCallback((id, data) => {
    return api.put(`/subjects/${id}`, data).then((res) => {
      setSubjects((prev) => prev.map((subject) => (subject.id === id ? res.data : subject)))
      return res.data
    })
  }, [])

  const deleteSubject = useCallback((id) => {
    return api.delete(`/subjects/${id}`).then(() => {
      setSubjects((prev) => prev.filter((subject) => subject.id !== id))
    })
  }, [])

  return { subjects, loading, fetchSubjects, createSubject, updateSubject, deleteSubject }
}
