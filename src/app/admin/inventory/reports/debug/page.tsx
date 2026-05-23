'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InventoryReportsDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    // Test 0: Check database status (no auth required)
    try {
      const dbRes = await fetch('/api/admin/inventory/reports/debug');
      const dbData = await dbRes.json();
      results.tests.push({
        name: 'Database Status',
        status: dbRes.ok ? 'PASS' : 'FAIL',
        data: dbData,
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Database Status',
        status: 'ERROR',
        error: error.message,
      });
    }

    // Test 1: Check authentication status
    try {
      const authRes = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const authData = await authRes.json();

      // Check if user is authenticated and has admin role
      const isAdmin = authData.success && authData.data?.user?.role === 'admin';

      results.tests.push({
        name: 'Admin Authentication',
        status: authRes.ok && isAdmin ? 'PASS' : 'FAIL',
        httpStatus: authRes.status,
        data: authData,
        isAuthenticated: authData.success && authData.data?.user !== null,
        isAdmin: isAdmin,
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Admin Authentication',
        status: 'ERROR',
        error: error.message,
      });
    }

    // Test 2: Check valuation report
    try {
      const valuationRes = await fetch('/api/admin/inventory/reports/valuation', {
        credentials: 'include',
      });
      const valuationData = await valuationRes.json();
      results.tests.push({
        name: 'Valuation Report API',
        status: valuationRes.ok ? 'PASS' : 'FAIL',
        httpStatus: valuationRes.status,
        data: valuationData,
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Valuation Report API',
        status: 'ERROR',
        error: error.message,
      });
    }

    // Test 3: Check movement report
    try {
      const movementRes = await fetch('/api/admin/inventory/reports/movement', {
        credentials: 'include',
      });
      const movementData = await movementRes.json();
      results.tests.push({
        name: 'Movement Report API',
        status: movementRes.ok ? 'PASS' : 'FAIL',
        httpStatus: movementRes.status,
        data: movementData,
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Movement Report API',
        status: 'ERROR',
        error: error.message,
      });
    }

    // Test 4: Check purchase report
    try {
      const purchaseRes = await fetch('/api/admin/inventory/reports/purchase', {
        credentials: 'include',
      });
      const purchaseData = await purchaseRes.json();
      results.tests.push({
        name: 'Purchase Report API',
        status: purchaseRes.ok ? 'PASS' : 'FAIL',
        httpStatus: purchaseRes.status,
        data: purchaseData,
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Purchase Report API',
        status: 'ERROR',
        error: error.message,
      });
    }

    // Test 5: Check stock report
    try {
      const stockRes = await fetch('/api/admin/inventory/reports/stock', {
        credentials: 'include',
      });
      const stockData = await stockRes.json();
      results.tests.push({
        name: 'Stock Report API',
        status: stockRes.ok ? 'PASS' : 'FAIL',
        httpStatus: stockRes.status,
        data: stockData,
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Stock Report API',
        status: 'ERROR',
        error: error.message,
      });
    }

    // Test 6: Check cost analysis report
    try {
      const costRes = await fetch('/api/admin/inventory/reports/cost-analysis', {
        credentials: 'include',
      });
      const costData = await costRes.json();
      results.tests.push({
        name: 'Cost Analysis Report API',
        status: costRes.ok ? 'PASS' : 'FAIL',
        httpStatus: costRes.status,
        data: costData,
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Cost Analysis Report API',
        status: 'ERROR',
        error: error.message,
      });
    }

    setDebugInfo(results);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return <Badge className="bg-green-600">PASS</Badge>;
      case 'FAIL':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'ERROR':
        return <Badge variant="secondary">ERROR</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Reports Debug</h1>
        <p className="text-muted-foreground mt-1">
          Diagnose issues with inventory reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </CardContent>
      </Card>

      {debugInfo && (
        <div className="space-y-4">
          {debugInfo.tests.map((test: any, idx: number) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  {getStatusBadge(test.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {test.httpStatus && (
                    <div>
                      <strong>HTTP Status:</strong> {test.httpStatus}
                    </div>
                  )}
                  {(test.isAuthenticated !== undefined) && (
                    <div>
                      <strong>Authenticated:</strong> {test.isAuthenticated ? '✅ Yes' : '❌ No'}
                    </div>
                  )}
                  {(test.isAdmin !== undefined) && (
                    <div>
                      <strong>Admin Role:</strong> {test.isAdmin ? '✅ Yes' : '❌ No'}
                    </div>
                  )}
                  {test.error && (
                    <div>
                      <strong>Error:</strong> {test.error}
                    </div>
                  )}
                  {test.data && (
                    <div>
                      <strong>Response:</strong>
                      <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-xs">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
