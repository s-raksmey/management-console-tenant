'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  pendingText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  pendingText = 'Working...',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setIsConfirming(false);
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      setError(null);
      await onConfirm();
      onOpenChange(false);
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'The action could not be completed.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    if (isConfirming) return;
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isConfirming}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            disabled={isConfirming}
            className={
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                : ''
            }
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {pendingText}
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
