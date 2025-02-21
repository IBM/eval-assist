import { useCallback, useMemo, useState } from 'react'

interface Props<T> {
  instances: T[]
  instancesPerPage: number
}

export const usePagination = <T>({ instances, instancesPerPage }: Props<T>) => {
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = Math.ceil(instances.length / instancesPerPage)

  const currentInstances = useMemo(() => {
    const start = currentPage * instancesPerPage
    return instances.slice(start, start + instancesPerPage)
  }, [instances, instancesPerPage, currentPage])

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages) return
    setCurrentPage(page)
  }

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages - 1)
  }, [totalPages])

  return { currentInstances, currentPage, goToPage, totalPages, goToLastPage }
}
