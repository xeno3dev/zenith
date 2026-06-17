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

  return { subjects, loading, createSubject, fetchSubjects }
}
