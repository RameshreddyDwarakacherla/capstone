import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Copy,
  AlertCircle
} from 'lucide-react';

const StatusBadge = ({ status, priority, size = 'md', className = '' }) => {
  // Status configurations
  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    in_progress: {
      label: 'In Progress',
      icon: AlertTriangle,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      textColor: 'text-blue-800 dark:text-blue-200',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    resolved: {
      label: 'Resolved',
      icon: CheckCircle2,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      textColor: 'text-red-800 dark:text-red-200',
      borderColor: 'border-red-200 dark:border-red-800'
    },
    duplicate: {
      label: 'Duplicate',
      icon: Copy,
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      textColor: 'text-gray-800 dark:text-gray-200',
      borderColor: 'border-gray-200 dark:border-gray-800'
    }
  };

  // Priority configurations
  const priorityConfig = {
    low: {
      label: 'Low',
      icon: AlertCircle,
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      textColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-700'
    },
    medium: {
      label: 'Medium',
      icon: AlertCircle,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    high: {
      label: 'High',
      icon: AlertTriangle,
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-700'
    },
    urgent: {
      label: 'Urgent',
      icon: AlertTriangle,
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-700'
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'px-2 py-1',
      text: 'text-xs',
      iconSize: 'w-3 h-3'
    },
    md: {
      padding: 'px-3 py-1',
      text: 'text-sm',
      iconSize: 'w-4 h-4'
    },
    lg: {
      padding: 'px-4 py-2',
      text: 'text-base',
      iconSize: 'w-5 h-5'
    }
  };

  // Determine which configuration to use
  const config = status ? statusConfig[status] : priorityConfig[priority];
  const sizeClasses = sizeConfig[size];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${config.bgColor} 
        ${config.textColor} 
        ${config.borderColor}
        ${sizeClasses.padding}
        ${sizeClasses.text}
        ${className}
      `}
    >
      <Icon className={sizeClasses.iconSize} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;