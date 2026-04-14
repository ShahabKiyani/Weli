import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500))
    expect(result.current).toBe('hello')
  })

  it('does not update the debounced value before the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 500),
      { initialProps: { value: 'hello' } },
    )

    rerender({ value: 'world' })
    act(() => { vi.advanceTimersByTime(499) })

    expect(result.current).toBe('hello')
  })

  it('updates the debounced value after the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 500),
      { initialProps: { value: 'hello' } },
    )

    rerender({ value: 'world' })
    act(() => { vi.advanceTimersByTime(500) })

    expect(result.current).toBe('world')
  })

  it('resets the timer on each value change (only fires once for rapid updates)', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'ab' })
    act(() => { vi.advanceTimersByTime(200) })
    rerender({ value: 'abc' })
    act(() => { vi.advanceTimersByTime(200) })
    rerender({ value: 'abcd' })
    act(() => { vi.advanceTimersByTime(200) })

    // Only 600ms total since last change — still within the delay from 'abcd'
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe('abcd')
  })

  it('uses the default 500ms delay when no delay is specified', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'updated' })
    act(() => { vi.advanceTimersByTime(499) })
    expect(result.current).toBe('initial')

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('updated')
  })

  it('works with non-string types (numbers)', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebounce(value, 300),
      { initialProps: { value: 0 } },
    )

    rerender({ value: 42 })
    act(() => { vi.advanceTimersByTime(300) })

    expect(result.current).toBe(42)
  })

  it('clears the pending timer on unmount (no state update after unmount)', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'new value' })
    unmount()

    // Should not throw or cause state update after unmount
    act(() => { vi.advanceTimersByTime(500) })

    expect(result.current).toBe('initial')
  })
})
