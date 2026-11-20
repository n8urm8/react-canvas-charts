import { Link } from 'react-router'

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-600 mb-6">The page does not exist or has moved.</p>
      <Link
        to="/"
        className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white shadow-md hover:bg-blue-600 transition-colors"
      >
        Back to API Docs
      </Link>
    </div>
  )
}
