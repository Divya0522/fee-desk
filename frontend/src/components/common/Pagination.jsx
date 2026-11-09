import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useLang } from '../../i18n/useLang'

export default function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 15,
  onPageChange,
  onLimitChange,
  itemName = 'records',
}) {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [jumpPage, setJumpPage] = useState('')

  if (totalPages <= 1 && totalItems <= limit) {
    if (totalItems > 0) {
      return (
        <div className="pagination-bar">
          <span className="pagination-summary">
            {isHindi ? (
              <>कुल <strong>{totalItems.toLocaleString('en-IN')}</strong> {itemName} प्रदर्शित</>
            ) : (
              <>Showing all <strong>{totalItems.toLocaleString('en-IN')}</strong> {itemName}</>
            )}
          </span>
        </div>
      )
    }
    return null
  }

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(page * limit, totalItems)

  const handlePageClick = (p) => {
    if (p >= 1 && p <= totalPages && p !== page) {
      onPageChange(p)
    }
  }

  const handleJumpSubmit = (e) => {
    e.preventDefault()
    const target = parseInt(jumpPage, 10)
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target)
      setJumpPage('')
    }
  }

  // Calculate visible page range with ellipsis
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i)
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="modern-pagination-container" role="navigation" aria-label="Pagination">
      {/* Left side: Showing X-Y of Z */}
      <div className="pagination-info-group">
        <span className="pagination-summary">
          {isHindi ? (
            <>
              <strong>{totalItems.toLocaleString('en-IN')}</strong> में से{' '}
              <strong>{startItem}–{endItem}</strong> {itemName}
            </>
          ) : (
            <>
              Showing <strong>{startItem}–{endItem}</strong> of{' '}
              <strong>{totalItems.toLocaleString('en-IN')}</strong> {itemName}
            </>
          )}
        </span>

        {/* Optional Page Size Selector */}
        {onLimitChange && (
          <div className="pagination-limit-wrap">
            <label htmlFor="page-limit-select" className="sr-only">
              Rows per page
            </label>
            <select
              id="page-limit-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="pagination-limit-select"
            >
              <option value={10}>10 / {isHindi ? 'पेज' : 'page'}</option>
              <option value={15}>15 / {isHindi ? 'पेज' : 'page'}</option>
              <option value={25}>25 / {isHindi ? 'पेज' : 'page'}</option>
              <option value={50}>50 / {isHindi ? 'पेज' : 'page'}</option>
            </select>
          </div>
        )}
      </div>

      {/* Right side: Page Navigation Controls */}
      <div className="pagination-controls-group">
        {/* First Page */}
        <button
          type="button"
          className="page-nav-btn"
          disabled={page <= 1}
          onClick={() => handlePageClick(1)}
          title={isHindi ? 'प्रथम पृष्ठ' : 'First page'}
          aria-label="First page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          className="page-nav-btn"
          disabled={page <= 1}
          onClick={() => handlePageClick(page - 1)}
          title={isHindi ? 'पिछला पृष्ठ' : 'Previous page'}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Numbers */}
        <div className="page-numbers-wrap">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="page-dots" aria-hidden="true">
                  &hellip;
                </span>
              )
            }
            const isCurrent = p === page
            return (
              <button
                key={p}
                type="button"
                className={`page-number-btn ${isCurrent ? 'active' : ''}`}
                onClick={() => handlePageClick(p)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          className="page-nav-btn"
          disabled={page >= totalPages}
          onClick={() => handlePageClick(page + 1)}
          title={isHindi ? 'अगला पृष्ठ' : 'Next page'}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          className="page-nav-btn"
          disabled={page >= totalPages}
          onClick={() => handlePageClick(totalPages)}
          title={isHindi ? 'अंतिम पृष्ठ' : 'Last page'}
          aria-label="Last page"
        >
          <ChevronsRight size={16} />
        </button>

        {/* Direct Jump Input for 5+ pages */}
        {totalPages > 5 && (
          <form onSubmit={handleJumpSubmit} className="page-jump-form">
            <span className="page-jump-label">{isHindi ? 'पेज:' : 'Go to:'}</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              placeholder={String(page)}
              className="page-jump-input"
              aria-label="Jump to page"
            />
          </form>
        )}
      </div>
    </div>
  )
}
