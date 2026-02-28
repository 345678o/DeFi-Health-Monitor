import { NextRequest, NextResponse } from 'next/server';
import { 
  runStressTest,
  runCustomStressTest,
  getPredefinedScenarios,
  exportStressTestResults,
  testStressTestService
} from '@/lib/stressTestService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'scenarios':
        const scenarios = getPredefinedScenarios();
        return NextResponse.json({
          success: true,
          data: scenarios,
          count: scenarios.length
        });

      case 'test':
        testStressTestService();
        return NextResponse.json({
          success: true,
          message: 'Stress test service test completed successfully'
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Stress test API is ready. Use POST to run tests.'
        });
    }

  } catch (error) {
    console.error('Stress test GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve stress test data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      healthFactor,
      collateralValue,
      debtValue,
      liquidationThreshold,
      customScenarios,
      action
    } = body;

    // Validate required inputs
    if (typeof healthFactor !== 'number' || typeof collateralValue !== 'number' || typeof debtValue !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input: healthFactor, collateralValue, and debtValue must be numbers' },
        { status: 400 }
      );
    }

    const inputs = {
      healthFactor,
      collateralValue,
      debtValue,
      liquidationThreshold: liquidationThreshold || 0.8
    };

    switch (action) {
      case 'custom':
        if (!customScenarios || !Array.isArray(customScenarios)) {
          return NextResponse.json(
            { error: 'Custom scenarios array is required for custom stress test' },
            { status: 400 }
          );
        }

        const customResults = runCustomStressTest(inputs, customScenarios);
        
        return NextResponse.json({
          success: true,
          data: customResults,
          type: 'custom',
          count: customResults.scenarios.length
        });

      case 'export':
        const standardResults = runStressTest(inputs);
        const exportData = exportStressTestResults(standardResults, body.format || 'json');
        const filename = `stress-test-results.${body.format || 'json'}`;
        
        return new NextResponse(exportData, {
          status: 200,
          headers: {
            'Content-Type': body.format === 'csv' ? 'text/csv' : 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`
          }
        });

      default:
        // Standard stress test
        const results = runStressTest(inputs);
        
        return NextResponse.json({
          success: true,
          data: results,
          type: 'standard',
          count: results.scenarios.length,
          summary: {
            worstCase: results.scenarios.find(r => r.severity === 'Critical'),
            safeScenarios: results.scenarios.filter(r => r.severity === 'Safe').length,
            riskScenarios: results.scenarios.filter(r => r.severity !== 'Safe').length
          }
        });
    }

  } catch (error) {
    console.error('Stress test execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}