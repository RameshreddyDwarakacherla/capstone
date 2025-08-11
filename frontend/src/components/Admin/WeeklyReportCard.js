import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, BarChart2, RefreshCw } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const WeeklyReportCard = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ai/weekly-report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      
      if (response.data.success) {
        setReport(response.data.data);
        toast.success('Weekly report generated successfully');
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    // Create report content
    const reportContent = `
# Civic Issues Weekly Report
${dateRange.startDate} to ${dateRange.endDate}

## Summary
${report.summary}

## Statistics
- Total Issues: ${report.issueCount}

### Top Categories
${report.topCategories.map(cat => `- ${cat.category}: ${cat.count} issues`).join('\n')}

### Priority Distribution
${Object.entries(report.priorityDistribution).map(([priority, count]) => `- ${priority}: ${count} issues`).join('\n')}

### Status Distribution
${Object.entries(report.statusDistribution).map(([status, count]) => `- ${status}: ${count} issues`).join('\n')}

## Key Insights
${report.insights.map((insight, i) => `${i+1}. ${insight}`).join('\n')}

## Recommendations
${report.recommendations.map((rec, i) => `${i+1}. ${rec}`).join('\n')}

## Trend Analysis
${report.trendAnalysis}
    `;

    // Create and download file
    const element = document.createElement('a');
    const file = new Blob([reportContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `civic-issues-report-${dateRange.startDate}-to-${dateRange.endDate}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          AI-Generated Weekly Report
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={generateReport}
            isLoading={loading}
            disabled={loading}
          >
            Generate Report
          </Button>
          {report && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={downloadReport}
              disabled={loading}
            >
              Download
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <div className="flex items-center mb-2 sm:mb-0">
          <Calendar className="w-5 h-5 text-gray-500 mr-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Date Range:</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:space-x-4">
          <div className="mb-2 sm:mb-0">
            <label className="text-xs text-gray-500 block mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {!report && !loading && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <BarChart2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Generate an AI-powered weekly report of civic issues
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Get insights, trends, and recommendations based on reported issues
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Generating AI report...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            This may take a moment as we analyze the data
          </p>
        </div>
      )}

      {report && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-100 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
              Executive Summary
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {report.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 text-sm">
                Issue Statistics
              </h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {report.issueCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total issues in this period
              </p>
              
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mt-4 mb-1 text-xs">
                Top Categories
              </h4>
              <ul className="text-xs space-y-1">
                {report.topCategories.slice(0, 3).map((cat, index) => (
                  <li key={index} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{cat.category}</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{cat.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2 text-sm">
                Key Insights
              </h3>
              <ul className="text-xs space-y-2">
                {report.insights.slice(0, 3).map((insight, index) => (
                  <li key={index} className="flex">
                    <span className="font-bold text-green-600 dark:text-green-400 mr-2">{index + 1}.</span>
                    <span className="text-gray-600 dark:text-gray-400">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-100 dark:border-amber-800">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 text-sm">
                Recommendations
              </h3>
              <ul className="text-xs space-y-2">
                {report.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="flex">
                    <span className="font-bold text-amber-600 dark:text-amber-400 mr-2">{index + 1}.</span>
                    <span className="text-gray-600 dark:text-gray-400">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-2 text-sm">
              Trend Analysis
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {report.trendAnalysis}
            </p>
          </div>
        </motion.div>
      )}
    </Card>
  );
};

export default WeeklyReportCard;