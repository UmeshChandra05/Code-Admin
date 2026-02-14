// Export utility functions for data export (CSV, JSON)

/**
 * Export data as JSON file
 */
export function exportToJSON(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV file
 */
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','), // Header row
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format data for CSV export (flatten nested objects)
 */
export function flattenForCSV(data: any[]): any[] {
  return data.map(item => {
    const flattened: any = {};
    
    Object.keys(item).forEach(key => {
      const value = item[key];
      
      if (value === null || value === undefined) {
        flattened[key] = '';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Flatten nested objects
        Object.keys(value).forEach(nestedKey => {
          flattened[`${key}_${nestedKey}`] = value[nestedKey];
        });
      } else if (Array.isArray(value)) {
        // Convert arrays to comma-separated strings
        flattened[key] = value.map(v => 
          typeof v === 'object' ? JSON.stringify(v) : String(v)
        ).join('; ');
      } else {
        flattened[key] = value;
      }
    });
    
    return flattened;
  });
}

/**
 * Prepare problems data for export
 */
export function prepareProblemsForExport(problems: any[]) {
  return problems.map(p => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    module: p.module?.name || '',
    tags: p.tags?.map((t: any) => t.name).join('; ') || '',
    isActive: p.isActive ? 'Yes' : 'No',
    createdAt: new Date(p.createdAt).toLocaleString(),
  }));
}

/**
 * Prepare submissions data for export
 */
export function prepareSubmissionsForExport(submissions: any[]) {
  return submissions.map(s => ({
    id: s.id,
    problem: s.problem?.title || '',
    student: s.student?.name || s.student?.email || '',
    language: s.language,
    status: s.status,
    executionTime: s.executionTime || '',
    memoryUsed: s.memoryUsed || '',
    score: s.score || '',
    createdAt: new Date(s.createdAt).toLocaleString(),
  }));
}

/**
 * Prepare contests data for export
 */
export function prepareContestsForExport(contests: any[]) {
  return contests.map(c => ({
    id: c.id,
    title: c.title,
    status: c.status,
    visibility: c.visibility,
    startTime: new Date(c.startTime).toLocaleString(),
    endTime: new Date(c.endTime).toLocaleString(),
    duration: `${c.duration} min`,
    problems: c._count?.problems || 0,
    registrations: c._count?.registrations || 0,
  }));
}

/**
 * Prepare tags data for export
 */
export function prepareTagsForExport(tags: any[]) {
  return tags.map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description || '',
    color: t.color || '',
    isActive: t.isActive ? 'Yes' : 'No',
  }));
}

/**
 * Prepare modules data for export
 */
export function prepareModulesForExport(modules: any[]) {
  return modules.map(m => ({
    id: m.id,
    name: m.name,
    description: m.description || '',
    order: m.order,
    isActive: m.isActive ? 'Yes' : 'No',
  }));
}
