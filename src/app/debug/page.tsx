'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  HardDrive,
  RefreshCw,
  Trash2,
  Terminal,
} from 'lucide-react';

interface DebugLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  responseStatus?: number;
  responseTime?: number;
  hasError?: boolean;
  error?: {
    message: string;
    name: string;
  };
}

interface DebugSummary {
  totalLogs: number;
  statsByStatus: {
    success: number;
    clientError: number;
    serverError: number;
    redirect: number;
    unknown: number;
  };
  errorSummary: {
    totalErrors: number;
    errorsByStatus: Record<number, number>;
    errorsByPath: Record<string, number>;
  };
  recentLogs: DebugLog[];
}

interface BindingsInfo {
  bindingsFound: boolean;
  hasDB: boolean;
  hasKV: boolean;
  hasBUCKET: boolean;
  availableKeys: string[];
}

export default function DebugPage() {
  const [summary, setSummary] = useState<DebugSummary | null>(null);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [bindings, setBindings] = useState<BindingsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, logsRes, bindingsRes] = await Promise.all([
        fetch('/api/debug/logs?summary=true'),
        fetch('/api/debug/logs?limit=100'),
        fetch('/api/debug/bindings'),
      ]);

      const summaryData = await summaryRes.json();
      const logsData = await logsRes.json();
      const bindingsData = await bindingsRes.json();

      setSummary(summaryData);
      setLogs(logsData.logs || []);
      setBindings(bindingsData);
    } catch (error) {
      console.error('Failed to load debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all debug logs?')) return;
    
    try {
      await fetch('/api/debug/logs', { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status?: number) => {
    if (!status) return <Clock className="w-4 h-4 text-gray-400" />;
    if (status >= 200 && status < 300) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status >= 300 && status < 400) return <Clock className="w-4 h-4 text-blue-500" />;
    if (status >= 400 && status < 500) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (status?: number) => {
    if (!status) return <Badge variant="outline">Pending</Badge>;
    if (status >= 200 && status < 300) return <Badge variant="default" className="bg-green-500">{status}</Badge>;
    if (status >= 300 && status < 400) return <Badge variant="secondary">{status}</Badge>;
    if (status >= 400 && status < 500) return <Badge variant="outline" className="border-yellow-500 text-yellow-500">{status}</Badge>;
    return <Badge variant="destructive">{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">API Debug Dashboard</h1>
            <p className="text-muted-foreground">Monitor and debug all API activity</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={clearLogs} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Logs
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Recent Logs</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="bindings">Bindings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary?.totalLogs || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-500">Success</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary?.statsByStatus?.success || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-500">Client Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary?.statsByStatus?.clientError || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-500">Server Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary?.statsByStatus?.serverError || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {logs.length > 0 
                        ? `${Math.round(logs.reduce((acc, log) => acc + (log.responseTime || 0), 0) / logs.length)}ms`
                        : '-'
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors by Path */}
              {summary?.errorSummary?.errorsByPath && Object.keys(summary.errorSummary.errorsByPath).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Errors by Endpoint</CardTitle>
                    <CardDescription>API endpoints with the most errors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {Object.entries(summary.errorSummary.errorsByPath)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 10)
                          .map(([path, count]) => (
                            <div key={path} className="flex items-center justify-between">
                              <code className="text-sm bg-muted px-2 py-1 rounded">{path}</code>
                              <Badge variant="destructive">{count} errors</Badge>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Recent API Calls</CardTitle>
                <CardDescription>Last 100 API requests</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {getStatusIcon(log.responseStatus)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{log.method}</Badge>
                            <code className="text-sm truncate">{log.path}</code>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(log.timestamp).toLocaleString()} • {log.responseTime}ms
                          </div>
                          {log.error && (
                            <div className="text-xs text-red-500 mt-1">
                              {log.error.message}
                            </div>
                          )}
                        </div>
                        {getStatusBadge(log.responseStatus)}
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        No logs yet. Make some API requests to see them here.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle>Error Log</CardTitle>
                <CardDescription>API calls that resulted in errors (4xx, 5xx)</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {logs.filter(log => log.hasError || (log.responseStatus && log.responseStatus >= 400)).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 p-4 border border-red-200 bg-red-50/50 dark:bg-red-950/10 rounded-lg"
                      >
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{log.method}</Badge>
                            <code className="text-sm truncate">{log.path}</code>
                            <Badge variant="destructive">{log.responseStatus}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(log.timestamp).toLocaleString()} • {log.responseTime}ms
                          </div>
                          {log.error && (
                            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-xs font-mono text-red-700 dark:text-red-400">
                              <div className="font-semibold">{log.error.name}</div>
                              <div>{log.error.message}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {logs.filter(log => log.hasError || (log.responseStatus && log.responseStatus >= 400)).length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        No errors recorded. Great job! 🎉
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bindings">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cloudflare Bindings</CardTitle>
                  <CardDescription>Database and storage connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Database className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium">D1 Database</div>
                        <div className="text-xs text-muted-foreground">
                          {bindings?.hasDB ? (
                            <span className="text-green-500">Connected ✓</span>
                          ) : (
                            <span className="text-red-500">Not Connected ✗</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Terminal className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="text-sm font-medium">KV Storage</div>
                        <div className="text-xs text-muted-foreground">
                          {bindings?.hasKV ? (
                            <span className="text-green-500">Connected ✓</span>
                          ) : (
                            <span className="text-red-500">Not Connected ✗</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <HardDrive className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className="text-sm font-medium">R2 Storage</div>
                        <div className="text-xs text-muted-foreground">
                          {bindings?.hasBUCKET ? (
                            <span className="text-green-500">Connected ✓</span>
                          ) : (
                            <span className="text-red-500">Not Connected ✗</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Available Binding Keys</h3>
                    <div className="flex flex-wrap gap-2">
                      {bindings?.availableKeys?.map((key) => (
                        <Badge key={key} variant="secondary">
                          {key}
                        </Badge>
                      )) || (
                        <span className="text-sm text-muted-foreground">No bindings found</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Diagnostics</CardTitle>
                  <CardDescription>Test your API endpoints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Test API Endpoint</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="/api/admin/products"
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                          id="testEndpoint"
                        />
                        <Button
                          onClick={() => {
                            const endpoint = (document.getElementById('testEndpoint') as HTMLInputElement).value;
                            if (endpoint) {
                              fetch(`/api/debug/diagnostics?action=test-api`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ endpoint, method: 'GET' })
                              }).then(r => r.json()).then(console.log);
                            }
                          }}
                        >
                          Test
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will make a request to the specified endpoint and return the response details.
                      Check the browser console for results.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
