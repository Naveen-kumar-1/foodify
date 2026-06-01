import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const LogoutConfirmDialog = ({ open, onOpenChange, onConfirm, loading }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent onClose={() => onOpenChange(false)} className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogDescription>
          Are you sure you want to logout from your account?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading}>
          Logout
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default LogoutConfirmDialog
