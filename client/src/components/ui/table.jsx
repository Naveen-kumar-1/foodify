import { cn } from '@/lib/utils'

const Table = ({ className, ...props }) => (
  <div className="relative w-full overflow-auto rounded-lg border border-border">
    <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
)

const TableHeader = ({ className, ...props }) => (
  <thead className={cn('bg-muted/50 [&_tr]:border-b', className)} {...props} />
)

const TableBody = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
)

const TableRow = ({ className, ...props }) => (
  <tr
    className={cn('border-b border-border transition-colors hover:bg-muted/30', className)}
    {...props}
  />
)

const TableHead = ({ className, ...props }) => (
  <th
    className={cn(
      'h-11 px-4 text-left align-middle text-xs font-semibold tracking-wide text-muted-foreground uppercase',
      className,
    )}
    {...props}
  />
)

const TableCell = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 align-middle', className)} {...props} />
)

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
