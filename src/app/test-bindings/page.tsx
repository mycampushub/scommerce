'use client'

import { useEffect, useState } from 'react'

interface BindingTestResult {
  success: boolean
  hasErrors: boolean
  environment: string
  bindings: {
    DB?: string
    KV?: string
    BUCKET?: string
  }
  operations: {
    database?: {
      read: string
      userCount: number
    }
    kv?: {
      write: string
      read: string
      testValue: string
    }
    r2?: {
      list: string
      objectsFound: number
    }
  }
  errors: string[]
  summary: string
}

export default function TestBindingsPage() {
  const [result, setResult] = useState<BindingTestResult | null>(null)
  const [loading, setLoading] = useState(true)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-bindings')
      const data = await response.json() as BindingTestResult
      setResult(data)
    } catch (error) {
      console.error('Test failed:', error)
      setResult({
        success: false,
        hasErrors: true,
        environment: 'error',
        bindings: {},
        operations: {},
        errors: ['Failed to run binding tests'],
        summary: 'Unable to connect to test API'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  const getStatusColor = (status?: string) => {
    if (status === 'connected') return 'bg-green-100 text-green-800 border-green-300'
    if (status === 'NOT FOUND') return 'bg-red-100 text-red-800 border-red-300'
    return 'bg-gray-100 text-gray-800'
  }

  const getOperationColor = (status?: string) => {
    if (status === 'success') return 'text-green-600'
    if (status === 'failed') return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cloudflare Bindings Test
          </h1>
          <p className="text-gray-600">
            Verify that D1, KV, and R2 bindings are properly connected
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent"></div>
            <p className="ml-4 text-gray-600">Testing bindings...</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div
              className={`p-6 rounded-lg border-2 ${
                result.success
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  {result.success ? '✓' : '✗'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {result.summary}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Environment: <span className="font-mono">{result.environment}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bindings Status */}
            <div className="grid gap-4 md:grid-cols-3">
              <div
                className={`p-4 rounded-lg border ${getStatusColor(result.bindings.DB)}`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">D1 Database</h3>
                <p className="text-sm">
                  Status: <span className="font-medium">{result.bindings.DB || 'Unknown'}</span>
                </p>
                {result.operations.database && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm">
                      Read: <span className={getOperationColor(result.operations.database.read)}>
                        {result.operations.database.read}
                      </span>
                    </p>
                    <p className="text-sm">
                      Users: <span className="font-mono font-semibold">
                        {result.operations.database.userCount}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`p-4 rounded-lg border ${getStatusColor(result.bindings.KV)}`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">KV Namespace</h3>
                <p className="text-sm">
                  Status: <span className="font-medium">{result.bindings.KV || 'Unknown'}</span>
                </p>
                {result.operations.kv && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm">
                      Write: <span className={getOperationColor(result.operations.kv.write)}>
                        {result.operations.kv.write}
                      </span>
                    </p>
                    <p className="text-sm">
                      Read: <span className={getOperationColor(result.operations.kv.read)}>
                        {result.operations.kv.read}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 break-all">
                      Value: {result.operations.kv.testValue}
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`p-4 rounded-lg border ${getStatusColor(result.bindings.BUCKET)}`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">R2 Bucket</h3>
                <p className="text-sm">
                  Status: <span className="font-medium">{result.bindings.BUCKET || 'Unknown'}</span>
                </p>
                {result.operations.r2 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm">
                      List: <span className={getOperationColor(result.operations.r2.list)}>
                        {result.operations.r2.list}
                      </span>
                    </p>
                    <p className="text-sm">
                      Objects: <span className="font-mono font-semibold">
                        {result.operations.r2.objectsFound}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Errors Found</h3>
                <ul className="space-y-2">
                  {result.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                      <span className="text-red-600 font-bold">{index + 1}.</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={runTest}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Re-run Tests
              </button>
              <a
                href="https://dash.cloudflare.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Open Cloudflare Dashboard
              </a>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                How to Fix Binding Issues
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  <strong>D1 Database:</strong> Go to Workers & Pages → scommerce → Settings → D1 Databases. Ensure the database name matches your wrangler.toml configuration.
                </li>
                <li>
                  <strong>KV Namespace:</strong> Go to Workers & Pages → scommerce → Settings → KV Namespace Bindings. Create a KV namespace and add the binding.
                </li>
                <li>
                  <strong>R2 Bucket:</strong> Go to Workers & Pages → scommerce → Settings → R2 Bucket Bindings. Create an R2 bucket and add the binding.
                </li>
                <li>
                  <strong>wrangler.toml:</strong> Verify the binding names in your wrangler.toml match what you expect in your code.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
