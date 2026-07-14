'use client'

import { useEffect, useState } from 'react'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { X, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { EmrError } from '@/lib/errors'

export type EmrToastDetail = {
  message: string
  severity?: 'toast' | 'modal'
  code?: string
}

/**
 * Permission suppression uses typed error codes / custom events only —
 * not free-text message matching (see isPermissionFeedback removal).
 */
export function ToasterProvider() {
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: React.ReactNode }>({
    open: false,
    message: '',
  })

  useEffect(() => {
    const onEmrError = (event: Event) => {
      const detail = (event as CustomEvent<EmrError | EmrToastDetail>).detail
      if (!detail) return

      const code = 'code' in detail ? detail.code : undefined
      const severity =
        'severity' in detail && detail.severity
          ? detail.severity
          : code === 'PERMISSION_DENIED' || code === 'UNAUTHORIZED'
            ? 'silent'
            : 'toast'

      if (severity === 'silent' || code === 'PERMISSION_DENIED' || code === 'UNAUTHORIZED') {
        return
      }

      if (severity === 'modal' || ('blocking' in detail && detail.blocking)) {
        setErrorModal({ open: true, message: detail.message })
        return
      }

      // Recoverable: non-blocking toast (use toast() not toast.error monkeypatch)
      toast(detail.message, { icon: '⚠️' })
    }

    const onPermission = () => {
      // Typed permission path — silent by design (caller may show ForbiddenAccess UI)
    }

    window.addEventListener('emr:error', onEmrError)
    window.addEventListener('emr:permission-denied', onPermission)

    // Keep toast.error as non-blocking toast by default; only modal via emr:error blocking
    //
    // NOTE: This runtime reassignment of toast.error is a deliberate provider-
    // level compatibility shim (see Phase 2 P2). It makes every direct
    // `toast.error(...)` call recoverably non-blocking; callers that need a
    // blocking modal must explicitly dispatch `new EmrError(..., 'modal')` (see
    // listenForEmrErrors / dispatchEmrError in @/lib/errors). The shim is set up
    // here and torn down on cleanup so it never leaks beyond this provider.
    //
    // REMOVAL PATH: once every `toast.error(...)` call site and the
    // qa-popup-sweep e2e are migrated to the typed-error dispatch, this block
    // (and the matching restoration in the cleanup return) can be deleted.
    const originalError = toast.error
    toast.error = ((message, opts) => {
      const text = typeof message === 'function' ? 'Action failed.' : String(message ?? 'Action failed.')
      // Destructive/blocking callers should dispatch emr:error with severity modal.
      // Default toast.error remains recoverable (non-blocking) for compatibility.
      return originalError(text, opts)
    }) as typeof toast.error

    return () => {
      toast.error = originalError
      window.removeEventListener('emr:error', onEmrError)
      window.removeEventListener('emr:permission-denied', onPermission)
    }
  }, [])

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          className: 'shadow-lg',
          style: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
            padding: '16px',
            maxWidth: '500px',
            fontSize: '15px',
            fontWeight: '500',
          },
          success: {
            style: {
              borderLeft: '4px solid var(--success)',
            },
          },
          error: {
            style: {
              borderLeft: '4px solid var(--critical)',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t} style={{ padding: 0, background: 'transparent', boxShadow: 'none' }}>
            {({ icon, message }) => (
              <div className="flex items-center w-full gap-3 py-1 bg-card rounded-md border shadow-lg overflow-hidden pr-2 relative">
                <div
                  className={`w-1 absolute left-0 top-0 bottom-0 ${
                    t.type === 'success' ? 'bg-success' : t.type === 'error' ? 'bg-critical' : 'bg-info'
                  }`}
                />
                {icon && <div className="flex-shrink-0 pl-4 py-3">{icon}</div>}
                <div className={`flex-1 min-w-0 pr-4 py-3 break-words ${!icon ? 'pl-4' : 'pl-2'}`}>
                  {message}
                </div>
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 ml-auto flex items-center justify-center p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>

      <Dialog open={errorModal.open} onOpenChange={(open) => setErrorModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
          <div className="flex gap-4 p-6">
            <div className="flex-shrink-0 h-10 w-10 bg-critical-muted rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-critical" />
            </div>
            <div className="pt-1.5 w-full">
              <DialogHeader>
                <DialogTitle className="text-lg text-left text-foreground">Action Failed</DialogTitle>
                <DialogDescription className="text-[15px] mt-2 text-left text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {errorModal.message}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          <div className="bg-muted/40 px-6 py-4 flex justify-end border-t">
            <Button
              type="button"
              className="bg-critical hover:bg-critical/90 text-critical-foreground"
              onClick={() => setErrorModal((prev) => ({ ...prev, open: false }))}
            >
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
