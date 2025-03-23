import { StatCardProps } from "@/types";

export default function StatCard({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  iconColor, 
  trend 
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-slate-500 text-sm font-medium">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className={`${iconBgColor} p-3 rounded-full ${iconColor}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-slate-500'} flex items-center`}>
          {trend.isPositive && (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}
