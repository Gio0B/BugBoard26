export class HealthController {
  constructor({ database }) {
    this.database = database;
  }

  getHealth = async (_request, response) => {
    try {
      await this.database.query('SELECT 1 AS connected');
      return response.status(200).json({
        status: 'ok',
        service: 'bugboard26-backend',
        dependencies: {
          database: 'ok',
        },
      });
    } catch {
      return response.status(503).json({
        status: 'unavailable',
        service: 'bugboard26-backend',
        dependencies: {
          database: 'unavailable',
        },
      });
    }
  };
}
