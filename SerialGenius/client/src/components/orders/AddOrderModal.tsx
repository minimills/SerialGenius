import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertOrderSchema } from "@shared/schema";
import type { Machine, Country, Panel } from "@shared/schema";

const orderFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  countryId: z.number().min(1, "Please select a country"),
  quoteNumber: z.string().min(1, "Quote number is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  dueDate: z.string().min(1, "Due date is required"),
  progressStatus: z.enum(["Pending", "In Progress", "Completed"]),
  paymentStatus: z.enum(["Pending", "Partial", "Paid"]),
  machines: z.array(z.object({
    machineId: z.number(),
    quantity: z.number().min(1)
  })).min(1, "At least one machine is required")
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface MachineSelection {
  machineId: number;
  quantity: number;
}

interface AddOrderModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddOrderModal({ open, onClose }: AddOrderModalProps) {
  const [machineSelections, setMachineSelections] = useState<MachineSelection[]>([
    { machineId: 0, quantity: 1 }
  ]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      city: "",
      state: "",
      countryId: 0,
      quoteNumber: "",
      invoiceNumber: "",
      dueDate: "",
      progressStatus: "Pending" as const,
      paymentStatus: "Pending" as const,
      machines: [],
    },
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  const { data: panels = [] } = useQuery<Panel[]>({
    queryKey: ["/api/panels"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order created successfully",
        description: "Serial numbers have been generated automatically",
      });
      onClose();
      form.reset();
      setMachineSelections([{ machineId: 0, quantity: 1 }]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create order",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const addMachineSelection = () => {
    const updated = [...machineSelections, { machineId: 0, quantity: 1 }];
    setMachineSelections(updated);
    const validMachines = updated.filter(ms => ms.machineId > 0 && ms.quantity > 0);
    form.setValue('machines', validMachines);
  };

  const removeMachineSelection = (index: number) => {
    if (machineSelections.length > 1) {
      const updated = machineSelections.filter((_, i) => i !== index);
      setMachineSelections(updated);
      const validMachines = updated.filter(ms => ms.machineId > 0 && ms.quantity > 0);
      form.setValue('machines', validMachines);
    }
  };

  const updateMachineSelection = (index: number, field: keyof MachineSelection, value: number) => {
    const updated = [...machineSelections];
    updated[index] = { ...updated[index], [field]: value };
    setMachineSelections(updated);
    
    // Update form machines array
    const validMachines = updated.filter(ms => ms.machineId > 0 && ms.quantity > 0);
    form.setValue('machines', validMachines);
  };

  const getAttachedPanels = () => {
    const selectedMachineIds = machineSelections
      .filter(ms => ms.machineId > 0)
      .map(ms => ms.machineId);
    
    return panels.filter(panel => selectedMachineIds.includes(panel.parentMachineId));
  };

  const onSubmit = (data: OrderFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Machine selections:", machineSelections);
    
    const validMachines = machineSelections.filter(ms => ms.machineId > 0 && ms.quantity > 0);
    
    if (validMachines.length === 0) {
      toast({
        title: "No machines selected",
        description: "Please select at least one machine",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      ...data,
      countryId: Number(data.countryId),
      dueDate: new Date(data.dueDate).toISOString(),
      machines: validMachines,
    };

    console.log("Final order data:", orderData);
    createOrderMutation.mutate(orderData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Add New Order</DialogTitle>
          <DialogDescription>
            Create a new order with customer details, machines, and generate serial numbers automatically.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form 
            onSubmit={(e) => {
              console.log("Form onSubmit triggered");
              form.handleSubmit(onSubmit)(e);
            }} 
            className="space-y-4 md:space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} />
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
                          <Input placeholder="Enter state or province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="countryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
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
                </CardContent>
              </Card>
              
              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="quoteNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quote Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Q-2024-XXX" {...field} />
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
                          <Input placeholder="INV-2024-XXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                  
                  <FormField
                    control={form.control}
                    name="progressStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progress Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select progress status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment status" />
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
                </CardContent>
              </Card>
            </div>
            
            {/* Machine Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Machine Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {machineSelections.map((selection, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                      <Select
                        onValueChange={(value) => updateMachineSelection(index, 'machineId', Number(value))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a machine" />
                        </SelectTrigger>
                        <SelectContent>
                          {machines.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id.toString()}>
                              {machine.name} ({machine.productCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="w-32">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={selection.quantity}
                          onChange={(e) => updateMachineSelection(index, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMachineSelection(index)}
                        disabled={machineSelections.length === 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMachineSelection}
                    className="w-full"
                  >
                    <Plus className="mr-2" size={16} />
                    Add Another Machine
                  </Button>
                </div>
                
                {/* Auto-attached Panels Preview */}
                {getAttachedPanels().length > 0 && (
                  <Card className="mt-4 bg-blue-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Auto-attached Panels:</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        {getAttachedPanels().map((panel) => (
                          <p key={panel.id}>
                            • {panel.name} ({panel.panelCode}) - attached to {machines.find(m => m.id === panel.parentMachineId)?.name}
                          </p>
                        ))}
                        <p className="mt-2 text-blue-600">
                          Serial numbers will be automatically generated for all machines and panels using the prefix### format.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createOrderMutation.isPending}
                onClick={() => console.log("Submit button clicked")}
              >
                {createOrderMutation.isPending ? "Creating..." : "Create Order & Generate Serials"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
