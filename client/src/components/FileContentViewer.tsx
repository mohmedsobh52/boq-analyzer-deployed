import React, { useState } from 'react';
import { AlertCircle, CheckCircle, FileText, Table, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { FileContent, ProcessingError } from '@/lib/fileProcessor';
import { formatErrorMessage } from '@/lib/fileProcessor';

interface FileContentViewerProps {
  content: FileContent;
  onClose?: () => void;
}

export function FileContentViewer({ content, onClose }: FileContentViewerProps) {
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set());
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set());

  const toggleSheet = (sheetName: string) => {
    const newExpanded = new Set(expandedSheets);
    if (newExpanded.has(sheetName)) {
      newExpanded.delete(sheetName);
    } else {
      newExpanded.add(sheetName);
    }
    setExpandedSheets(newExpanded);
  };

  const togglePage = (pageNumber: number) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageNumber)) {
      newExpanded.delete(pageNumber);
    } else {
      newExpanded.add(pageNumber);
    }
    setExpandedPages(newExpanded);
  };

  const hasErrors = content.errors.length > 0;
  const isSuccessful = content.successCount > 0 && content.errors.every(e => e.severity === 'warning');

  return (
    <div className="w-full space-y-4" dir={content.direction}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h2 className="text-xl font-semibold">{content.fileName}</h2>
          <span className="text-sm text-gray-500">
            ({content.fileType === 'excel' ? 'Excel' : content.fileType === 'pdf' ? 'PDF' : 'Unknown'})
          </span>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{content.successCount}</div>
              <div className="text-sm text-gray-600">Successfully Processed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{content.totalCount}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {content.language === 'ar' ? 'العربية' : content.language === 'en' ? 'English' : 'Unknown'}
              </div>
              <div className="text-sm text-gray-600">Detected Language</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success/Error Messages */}
      {isSuccessful && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Successfully Processed</AlertTitle>
          <AlertDescription className="text-green-700">
            All content has been successfully extracted and displayed below.
          </AlertDescription>
        </Alert>
      )}

      {/* Errors and Warnings */}
      {hasErrors && (
        <div className="space-y-2">
          {content.errors.map((error, index) => (
            <Alert
              key={index}
              className={
                error.severity === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'
              }
            >
              <AlertCircle
                className={`h-4 w-4 ${
                  error.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}
              />
              <AlertTitle
                className={
                  error.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                }
              >
                {error.severity === 'error' ? 'Error' : 'Warning'}
              </AlertTitle>
              <AlertDescription
                className={
                  error.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                }
              >
                {formatErrorMessage(error)}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Excel Content */}
      {content.sheets && content.sheets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Table className="w-5 h-5" />
            Sheets ({content.sheets.length})
          </h3>

          {content.sheets.map((sheet, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSheet(sheet.name)}>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{sheet.name}</CardTitle>
                    <span className="text-sm text-gray-500">({sheet.rows.length} rows)</span>
                  </div>
                  {expandedSheets.has(sheet.name) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </CardHeader>

              {expandedSheets.has(sheet.name) && (
                <CardContent>
                  <div
                    className="overflow-x-auto"
                    dir={sheet.direction}
                  >
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          {sheet.headers.map((header, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-2 text-left font-semibold bg-gray-100"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50">
                            {sheet.headers.map((header, colIdx) => (
                              <td key={colIdx} className="px-4 py-2">
                                {row[header] !== undefined && row[header] !== null
                                  ? String(row[header])
                                  : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* PDF Content */}
      {content.pages && content.pages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pages ({content.pages.length})
          </h3>

          {content.pages.map((page, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => togglePage(page.pageNumber)}
                >
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Page {page.pageNumber}</CardTitle>
                    <span className="text-sm text-gray-500">
                      ({page.content.length} characters)
                    </span>
                  </div>
                  {expandedPages.has(page.pageNumber) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </CardHeader>

              {expandedPages.has(page.pageNumber) && (
                <CardContent>
                  <div
                    className="p-4 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap text-sm leading-relaxed"
                    dir={page.direction}
                  >
                    {page.content}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!content.sheets && !content.pages && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Content</AlertTitle>
          <AlertDescription>
            No readable content was found in this file. Please check the file format and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
