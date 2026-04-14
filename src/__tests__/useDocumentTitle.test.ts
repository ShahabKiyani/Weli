import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

describe('useDocumentTitle', () => {
  it('sets document.title to "<title> — Weli"', () => {
    renderHook(() => useDocumentTitle('Dashboard'))
    expect(document.title).toBe('Dashboard — Weli')
  })

  it('uses just "Weli" when title is empty string', () => {
    renderHook(() => useDocumentTitle(''))
    expect(document.title).toBe('Weli')
  })

  it('restores the previous title on unmount', () => {
    document.title = 'Previous Title'
    const { unmount } = renderHook(() => useDocumentTitle('New Page'))
    expect(document.title).toBe('New Page — Weli')
    unmount()
    expect(document.title).toBe('Previous Title')
  })

  it('updates the title when the argument changes', () => {
    const { rerender } = renderHook(({ title }: { title: string }) => useDocumentTitle(title), {
      initialProps: { title: 'Page One' },
    })
    expect(document.title).toBe('Page One — Weli')
    rerender({ title: 'Page Two' })
    expect(document.title).toBe('Page Two — Weli')
  })
})
