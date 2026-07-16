import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function SupabaseTestPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch data from categories table
  const { data, error, status } = await supabase
    .from('categories')
    .select('*')
    .limit(10)

  // Handle errors
  if (error && status !== 406) {
    console.error('Supabase error:', error)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        <p className="text-red-500">Error loading data: {error.message}</p>
      </div>
    )
  }

  // Handle loading state (though data should be available immediately in server component)
  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        <p className="text-yellow-500">Loading data...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test - Categories Table</h1>
      
      {data.length > 0 ? (
        <div className="space-y-4">
          {data.map((category) => (
            <div key={category.id} className="border rounded-lg p-4 bg-gray-50">
              <h2 className="text-lg font-semibold mb-2">{category.name_en}</h2>
              {category.name_zh && (
                <p className="text-sm text-gray-600 mb-2">中文: {category.name_zh}</p>
              )}
              {category.description && (
                <p className="text-sm text-gray-700 line-clamp-2">{category.description}</p>
              )}
              <div className="text-xs text-gray-500 mt-2">
                ID: {category.id} | 
                Created: {category.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No categories found in the database.</p>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Connection Info:</h3>
        <p className="text-sm">Successfully connected to Supabase project: znizmdakncmrnowgwppu</p>
        <p className="text-sm">Fetched {data.length} categories from the database</p>
      </div>
    </div>
  )
}