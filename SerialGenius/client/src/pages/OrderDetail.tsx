import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Edit, Save, X, Package, FileText } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Order, Machine, Country, Panel, Serial } from "@shared/schema";

const orderUpdateSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  countryId: z.number().min(1, "Please select a country"),
  quoteNumber: z.string().min(1, "Quote number is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  dueDate: z.string().min(1, "Due date is required"),
  progressStatus: z.enum(["Pending", "In Progress", "Completed", "Confirmed"]),
  paymentStatus: z.enum(["Pending", "Partial", "Paid"]),
});

type OrderUpdateData = z.infer<typeof orderUpdateSchema>;

interface OrderWithRelations extends Order {
  country?: Country;
  serials?: Serial[];
}

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading: orderLoading } = useQuery<OrderWithRelations>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: panels = [] } = useQuery<Panel[]>({
    queryKey: ["/api/panels"],
  });

  const { data: serials = [] } = useQuery<Serial[]>({
    queryKey: ["/api/serials"],
    select: (data) => data.filter((serial: Serial) => serial.orderId === Number(orderId)),
  });

  const form = useForm<OrderUpdateData>({
    resolver: zodResolver(orderUpdateSchema),
    values: order ? {
      customerName: order.customerName,
      city: order.city,
      state: order.state,
      countryId: order.countryId,
      quoteNumber: order.quoteNumber,
      invoiceNumber: order.invoiceNumber,
      dueDate: new Date(order.dueDate).toISOString().split('T')[0],
      progressStatus: order.progressStatus,
      paymentStatus: order.paymentStatus,
    } : undefined,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: OrderUpdateData) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, {
        ...data,
        countryId: Number(data.countryId),
        dueDate: new Date(data.dueDate).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order updated successfully",
        description: "All changes have been saved",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update order",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderUpdateData) => {
    updateOrderMutation.mutate(data);
  };

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-slate-200 rounded"></div>
              <div className="h-64 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Order Not Found</h1>
          <p className="text-slate-600 mb-6">The order you're looking for doesn't exist.</p>
          <Link href="/orders">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "In Progress": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Completed": return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Confirmed": return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default: return "bg-slate-100 text-slate-800 hover:bg-slate-200";
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-red-100 text-red-800 hover:bg-red-200";
      case "Partial": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Paid": return "bg-green-100 text-green-800 hover:bg-green-200";
      default: return "bg-slate-100 text-slate-800 hover:bg-slate-200";
    }
  };

  const getMachinesWithQuantities = () => {
    if (!order.machines) return [];
    return order.machines.map(orderMachine => {
      const machine = machines.find(m => m.id === orderMachine.machineId);
      return {
        machine,
        quantity: orderMachine.quantity,
      };
    });
  };

  const getAttachedPanels = () => {
    const selectedMachineIds = order.machines?.map(m => m.machineId) || [];
    return panels.filter(panel => selectedMachineIds.includes(panel.parentMachineId));
  };

  const machineSerials = serials.filter(s => s.machineId);
  const panelSerials = serials.filter(s => s.panelId);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Order #{order.id} - {order.customerName}
              </h1>
              <p className="text-slate-600">
                Created on {new Date(order.createdAt!).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={() => setIsEditing(false)} 
                    variant="outline" 
                    size="sm"
                    disabled={updateOrderMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={form.handleSubmit(onSubmit)}
                    size="sm"
                    disabled={updateOrderMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateOrderMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Order
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="countryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.id} value={country.id.toString()}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quoteNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quote Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="progressStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Progress Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Confirmed">Confirmed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="paymentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Partial">Partial</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{order.customerName}</h3>
                    <p className="text-slate-600">{order.city}, {order.state}</p>
                    <p className="text-slate-600">{order.country?.name}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(order.progressStatus)}>
                      {order.progressStatus}
                    </Badge>
                    <Badge className={getPaymentColor(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Quote Number:</p>
                      <p className="font-medium">{order.quoteNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Invoice Number:</p>
                      <p className="font-medium">{order.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Due Date:</p>
                      <p className="font-medium">{new Date(order.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Confirmation Date:</p>
                      <p className="font-medium">
                        {order.confirmationDate ? new Date(order.confirmationDate).toLocaleDateString() : 'Not confirmed'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Machines & Panels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Machines & Panels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Ordered Machines</h4>
                  <div className="space-y-2">
                    {getMachinesWithQuantities().map(({ machine, quantity }, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{machine?.name || 'Unknown Machine'}</p>
                          <p className="text-sm text-slate-600">Code: {machine?.productCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {quantity}</p>
                          <p className="text-sm text-slate-600">
                            {machineSerials.filter(s => s.machineId === machine?.id).length} serials
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {getAttachedPanels().length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Auto-attached Panels</h4>
                    <div className="space-y-2">
                      {getAttachedPanels().map((panel) => (
                        <div key={panel.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium">{panel.name}</p>
                            <p className="text-sm text-slate-600">Code: {panel.panelCode}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">
                              {panelSerials.filter(s => s.panelId === panel.id).length} serials
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Serial Numbers */}
        {serials.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Generated Serial Numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {machineSerials.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Machine Serials</h4>
                    <div className="space-y-2">
                      {machineSerials.map((serial) => {
                        const machine = machines.find(m => m.id === serial.machineId);
                        return (
                          <div key={serial.id} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                            <span className="font-mono font-medium">{serial.serialNumber}</span>
                            <span className="text-slate-600">{machine?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {panelSerials.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Panel Serials</h4>
                    <div className="space-y-2">
                      {panelSerials.map((serial) => {
                        const panel = panels.find(p => p.id === serial.panelId);
                        return (
                          <div key={serial.id} className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm">
                            <span className="font-mono font-medium">{serial.serialNumber}</span>
                            <span className="text-slate-600">{panel?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}