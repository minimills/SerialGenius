import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Order, Country } from "@shared/schema";

interface OrderCardProps {
  order: Order & { country?: Country };
  onClick: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'Deposit':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const totalQuantity = order.machines.reduce((sum, m) => sum + m.quantity, 0);
  const machineCount = order.machines.length;

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {order.customerName}
            </h3>
            <p className="text-sm text-slate-600">
              {order.city}, {order.state}, {order.country?.name}
            </p>
          </div>
          <Badge className={getStatusColor(order.progressStatus)}>
            {order.progressStatus}
          </Badge>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Quote #:</span>
            <span className="font-medium text-slate-900">{order.quoteNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Invoice #:</span>
            <span className="font-medium text-slate-900">{order.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Due Date:</span>
            <span className="font-medium text-slate-900">
              {new Date(order.dueDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Machines</p>
              <p className="font-medium text-slate-900">{machineCount} units</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Quantity</p>
              <p className="font-medium text-slate-900">{totalQuantity}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Payment</p>
              <Badge className={getPaymentColor(order.paymentStatus)}>
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
