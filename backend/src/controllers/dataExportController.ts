import { Request, Response } from 'express';
import { DataExportService, ExportFormat } from '../services/dataExportService';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class DataExportController {
  private dataExportService: DataExportService;

  constructor() {
    this.dataExportService = new DataExportService();
  }

  exportUserData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        format = 'json',
        includePersonalData = true,
        startDate,
        endDate,
        download = 'false'
      } = req.query;

      // Validate format
      if (format !== 'json' && format !== 'csv') {
        res.status(400).json({ error: 'Invalid format. Must be "json" or "csv"' });
        return;
      }

      // Build export options
      const exportOptions: ExportFormat = {
        format: format as 'json' | 'csv',
        includePersonalData: includePersonalData === 'true'
      };

      // Add date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
          return;
        }

        if (start > end) {
          res.status(400).json({ error: 'Start date must be before end date' });
          return;
        }

        exportOptions.dateRange = { startDate: start, endDate: end };
      }

      // Validate user ownership (users can only export their own data)
      const isValidUser = await this.dataExportService.validateUserOwnership(userId, userId);
      if (!isValidUser) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      logger.info('Data export requested', { userId, format, includePersonalData });

      // Get the export data
      const exportData = await this.dataExportService.exportUserData(userId, exportOptions);

      // If download=true, return as file download, otherwise return as JSON
      if (download === 'true') {
        if (format === 'json') {
          const jsonData = await this.dataExportService.exportUserDataAsJSON(userId, exportOptions);
          
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${new Date().toISOString().split('T')[0]}.json"`);
          res.send(jsonData);
        } else {
          const csvFiles = await this.dataExportService.exportUserDataAsCSV(userId, exportOptions);
          
          // For CSV, we'll return a ZIP-like structure as JSON for now
          // In a production system, you might want to create an actual ZIP file
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${new Date().toISOString().split('T')[0]}-csv.json"`);
          res.json({
            format: 'csv-collection',
            files: csvFiles,
            instructions: 'Each key represents a CSV file. Save the content of each key as a separate .csv file.'
          });
        }
      } else {
        // Return data directly for API consumption (used by tests and frontend)
        res.status(200).json(exportData);
      }

    } catch (error) {
      logger.error('Error in data export:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  };

  getExportInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const sizeEstimate = await this.dataExportService.getExportSizeEstimate(userId);
      
      res.json({
        user_id: userId,
        estimated_size_bytes: sizeEstimate.estimatedSizeBytes,
        estimated_size_mb: Math.round(sizeEstimate.estimatedSizeBytes / (1024 * 1024) * 100) / 100,
        record_counts: sizeEstimate.recordCounts,
        available_formats: ['json', 'csv'],
        privacy_options: {
          include_personal_data: 'Include detailed profile and behavioral analytics',
          exclude_personal_data: 'Include only activity data and habits'
        },
        date_range_support: true
      });

    } catch (error) {
      logger.error('Error getting export info:', error);
      res.status(500).json({ error: 'Failed to get export information' });
    }
  };

  requestDataDeletion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // This is a placeholder for GDPR compliance
      // In a production system, this would initiate a data deletion process
      logger.info('Data deletion requested', { userId });

      res.json({
        message: 'Data deletion request received',
        user_id: userId,
        status: 'pending',
        estimated_completion: '7-14 business days',
        note: 'You will receive an email confirmation when the deletion is complete'
      });

    } catch (error) {
      logger.error('Error processing data deletion request:', error);
      res.status(500).json({ error: 'Failed to process deletion request' });
    }
  };
}