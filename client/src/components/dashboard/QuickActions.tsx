import { Link } from "wouter";
import { QuickActionProps } from "@/types";

interface QuickActionsCardProps {
  actions: QuickActionProps[];
}

export default function QuickActions({ actions }: QuickActionsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 col-span-1">
      <div className="border-b border-slate-200 p-4">
        <h3 className="font-semibold">Aksi Cepat</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <a className="flex items-center p-3 rounded-md hover:bg-slate-50 border border-slate-200 hover:border-primary-200 transition-colors">
                <div className={`${action.iconBgColor} ${action.iconColor} p-2 rounded-full mr-3`}>
                  {action.icon}
                </div>
                <div>
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-slate-500">{action.description}</div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
