import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Generic API fetching hook
 * Provides { data, error, isLoading, refetch, setData }
 */
export function useApi(fetcherFn, deps = [], options = { immediate: true }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(options.immediate))

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const refetch = useCallback(
    async (...args) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetcherFn(...args)
        if (isMountedRef.current) {
          setData(result)
          setError(null)
        }
        return result
      } catch (err) {
        if (isMountedRef.current) {
          setError(err)
        }
        throw err
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    },
    [fetcherFn]
  )

  useEffect(() => {
    let isCancelled = false

    if (options.immediate) {
      fetcherFn()
        .then((result) => {
          if (!isCancelled && isMountedRef.current) {
            setData(result)
            setError(null)
            setIsLoading(false)
          }
        })
        .catch((err) => {
          if (!isCancelled && isMountedRef.current) {
            setError(err)
            setIsLoading(false)
          }
        })
    }

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return {
    data,
    error,
    isLoading,
    refetch,
    setData,
  }
}
