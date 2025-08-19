import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { OrderCard } from "@/components/orders/OrderCard";
import { AddOrderModal } from "@/components/orders/AddOrderModal";
import { 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  Hash,
  Download,
  Plus
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Order, Country } from "@shared/schema";

interface OrderWithCountry extends Order {
  country?: Country;
}

export function Dashboard() {
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [, setLocation] = useLocation();
  const { isAdmin } = useAuth();

  const { data: orders = [], isLoading } = useQuery<OrderWithCountry[]>({
    queryKey: ["/api/orders"],
  });

  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.progressStatus === 'Completed').length,
    pendingOrders: orders.filter(o => o.progressStatus === 'In Progress').length,
    serialsGenerated: orders.reduce((sum, order) => {
      return sum + order.machines.reduce((machineSum, machine) => machineSum + machine.quantity, 0);
    }, 0) * 2, // Approximate: machines + panels
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onAddOrder={() => setShowAddOrderModal(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Orders Dashboard</h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-600">Manage your manufacturing orders and serial numbers</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {isAdmin && (
              <Button onClick={() => setShowAddOrderModal(true)} className="w-full sm:w-auto">
                <Plus className="mr-2" size={16} />
                <span className="hidden xs:inline">Add New Order</span>
                <span className="xs:hidden">Add Order</span>
              </Button>
            )}
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2" size={16} />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="text-primary" size={20} />
                </div>
                <div className="ml-3 md:ml-4">
                  <p className="text-xl md:text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
                  <p className="text-slate-600 text-xs md:text-sm">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="text-emerald-600" size={20} />
                </div>
                <div className="ml-3 md:ml-4">
                  <p className="text-xl md:text-2xl font-bold text-slate-900">{stats.completedOrders}</p>
                  <p className="text-slate-600 text-xs md:text-sm">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="text-amber-600" size={20} />
                </div>
                <div className="ml-3 md:ml-4">
                  <p className="text-xl md:text-2xl font-bold text-slate-900">{stats.pendingOrders}</p>
                  <p className="text-slate-600 text-xs md:text-sm">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Hash className="text-purple-600" size={20} />
                </div>
                <div className="ml-3 md:ml-4">
                  <p className="text-xl md:text-2xl font-bold text-slate-900">{stats.serialsGenerated}</p>
                  <p className="text-slate-600 text-xs md:text-sm">Serials Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-slate-600">No orders found. {isAdmin && "Create your first order to get started."}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setLocation(`/order/${order.id}`)}
              />
            ))}
          </div>
        )}
      </main>
      
      <AddOrderModal
        open={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
      />
    </div>
  );
}
