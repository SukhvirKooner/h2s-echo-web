import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NoPermission() {
  return (
    <div className="panel flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="rounded-full bg-red-100 dark:bg-red-950 p-4 mb-4">
        <ShieldOff className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="font-display text-xl font-semibold mb-2">No permission</h2>
      <p className="text-sm text-steel-500 max-w-md mb-6">
        System Management is restricted to Admin users. Your Safety Officer role can access monitoring,
        records, and reports — but not configuration or user administration.
      </p>
      <Link to="/" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}
