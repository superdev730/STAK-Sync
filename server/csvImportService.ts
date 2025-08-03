import { storage } from "./storage";
import type { InsertEventAttendeeImport } from "@shared/schema";

export interface CSVRow {
  email: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  bio?: string;
  interests?: string;
  goals?: string;
  [key: string]: string | undefined;
}

export class CSVImportService {
  async processCSVImport(
    eventId: string,
    importedBy: string,
    fileName: string,
    csvData: CSVRow[]
  ): Promise<string> {
    // Create import record
    const importRecord = await storage.createAttendeeImport({
      eventId,
      importedBy,
      fileName,
      totalRows: csvData.length,
      status: "processing",
    });

    // Process in background
    this.processRowsAsync(importRecord.id, csvData, eventId);
    
    return importRecord.id;
  }

  private async processRowsAsync(importId: string, csvData: CSVRow[], eventId: string) {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      try {
        // Validate required fields
        if (!row.email || !this.isValidEmail(row.email)) {
          throw new Error(`Invalid email: ${row.email || 'missing'}`);
        }

        // Parse interests and goals from CSV
        const interests = row.interests 
          ? row.interests.split(',').map(s => s.trim()).filter(Boolean)
          : [];
        const goals = row.goals 
          ? row.goals.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        // Create or update user
        const user = await storage.createOrUpdateUserFromImport({
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          title: row.title,
          company: row.company,
          bio: row.bio,
          interests,
          goals,
        });

        // Register user for event (if not already registered)
        const existingRegistration = await storage.getEventRegistration(eventId, user.id);
        if (!existingRegistration) {
          await storage.createEventRegistration({
            eventId,
            userId: user.id,
            interests,
            networkingGoals: goals,
          });
        }

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Row ${i + 1}: ${error.message}`);
        console.error(`CSV import error for row ${i + 1}:`, error);
      }
    }

    // Update import record with results
    await storage.updateAttendeeImport(importId, {
      successfulImports: successCount,
      failedImports: errorCount,
      status: errorCount === 0 ? "completed" : "completed",
      errorLog: errors.length > 0 ? errors.join('\n') : null,
      completedAt: new Date(),
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  parseCSV(csvContent: string): CSVRow[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      }

      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header.toLowerCase()] = values[index] || undefined;
      });

      // Map common header variations to our expected fields
      row.email = row.email || row['email address'] || row['e-mail'];
      row.firstName = row.firstName || row['first name'] || row['firstname'] || row['given name'];
      row.lastName = row.lastName || row['last name'] || row['lastname'] || row['family name'] || row['surname'];
      row.company = row.company || row['organization'] || row['employer'];
      row.title = row.title || row['job title'] || row['position'] || row['role'];
      row.bio = row.bio || row['biography'] || row['about'] || row['description'];
      row.interests = row.interests || row['interest'] || row['tags'] || row['categories'];
      row.goals = row.goals || row['networking goals'] || row['objectives'];

      rows.push(row);
    }

    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(val => val.replace(/^"|"$/g, ''));
  }
}

export const csvImportService = new CSVImportService();
