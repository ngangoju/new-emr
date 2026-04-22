'use client'

import { useEffect, useState } from 'react'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { X, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ToasterProvider() {
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: React.ReactNode }>({ open: false, message: '' })

  useEffect(() => {
    // Intercept toast.error to show our modal instead
    const originalError = toast.error;
    
    toast.error = (message: string | React.ReactNode, opts?: any) => {
      setErrorModal({ open: true, message });
      return 'error-modal-id';
    };

    return () => {
      toast.error = originalError;
    };
  }, []);

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          className: 'shadow-lg',
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            padding: '16px',
            maxWidth: '500px',
            fontSize: '15px',
            fontWeight: '500',
          },
          success: {
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t} style={{ padding: 0, background: 'transparent', boxShadow: 'none' }}>
            {({ icon, message }) => (
              <div className="flex items-center w-full gap-3 py-1 bg-card rounded-md border shadow-lg overflow-hidden pr-2">
                <div className={`w-1 h-full absolute left-0 top-0 bottom-0 ${t.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
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

      <Dialog open={errorModal.open} onOpenChange={(open) => setErrorModal(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
          <div className="flex gap-4 p-6">
            <div className="flex-shrink-0 h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
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
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setErrorModal(prev => ({ ...prev, open: false }))}
            >
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
