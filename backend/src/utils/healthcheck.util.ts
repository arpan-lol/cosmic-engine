import prisma from '../prisma/client';
import { getMilvusClient } from '../services/file-processing/milvus/client';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export class HealthCheck {
  static async checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', message: 'Database connection successful' };
    } catch (error) {
      console.error('[HealthCheck] Database connection failed:', error);
      return { 
        status: 'unhealthy', 
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static async checkMilvus(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const client = getMilvusClient();
      await client.checkHealth();
      return { status: 'healthy', message: 'Milvus connection successful' };
    } catch (error) {
      console.error('[HealthCheck] Milvus connection failed:', error);
      return { 
        status: 'unhealthy', 
        message: `Milvus connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static async checkPythonService(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        return { status: 'healthy', message: 'Python service is running' };
      } else {
        return { 
          status: 'unhealthy', 
          message: `Python service returned status: ${response.status}` 
        };
      }
    } catch (error) {
      console.error('[HealthCheck] Python service check failed:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return { status: 'unhealthy', message: 'Python service timeout (5s)' };
      }
      
      return { 
        status: 'unhealthy', 
        message: `Python service unreachable: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static async checkAll(): Promise<{
    overall: 'healthy' | 'unhealthy';
    services: {
      database: { status: 'healthy' | 'unhealthy'; message: string };
      milvus: { status: 'healthy' | 'unhealthy'; message: string };
      pythonService: { status: 'healthy' | 'unhealthy'; message: string };
    };
  }> {
    console.log('\n🔍 Running health checks...\n');

    const [database, milvus, pythonService] = await Promise.all([
      this.checkDatabase(),
      this.checkMilvus(),
      this.checkPythonService(),
    ]);

    const overall = database.status === 'healthy' && 
                   milvus.status === 'healthy' && 
                   pythonService.status === 'healthy' 
                   ? 'healthy' 
                   : 'unhealthy';

    console.log(`Database:       ${database.status === 'healthy' ? '✅' : '❌'} ${database.message}`);
    console.log(`Milvus:         ${milvus.status === 'healthy' ? '✅' : '❌'} ${milvus.message}`);
    console.log(`Python Service: ${pythonService.status === 'healthy' ? '✅' : '❌'} ${pythonService.message}`);
    console.log(`\nOverall Status: ${overall === 'healthy' ? '✅ All systems operational' : '⚠️  Some systems are down'}\n`);

    return {
      overall,
      services: {
        database,
        milvus,
        pythonService,
      },
    };
  }
}
