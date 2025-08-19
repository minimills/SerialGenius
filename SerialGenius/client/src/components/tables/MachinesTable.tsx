import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Settings, Search, Filter, Edit, Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { insertMachineSchema } from "@shared/schema";
import type { Machine } from "@shared/schema";

const machineFormSchema = insertMachineSchema.omit({ addedBy: true });
type MachineFormData = z.infer<typeof machineFormSchema>;

export function MachinesTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: machines = [], isLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const form = useForm<MachineFormData>({
    resolver: zodResolver(machineFormSchema),
    defaultValues: {
      name: "",
      productCode: "",
    },
  });

  const createMachineMutation = useMutation({
    mutationFn: async (data: MachineFormData) => {
      const response = await apiRequest("POST", "/api/machines", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({ title: "Machine created successfully" });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create machine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMachineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MachineFormData }) => {
      const response = await apiRequest("PUT", `/api/machines/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({ title: "Machine updated successfully" });
      setEditingMachine(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update machine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMachineMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/machines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({ title: "Machine deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete machine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredMachines = machines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (data: MachineFormData) => {
    if (editingMachine) {
      updateMachineMutation.mutate({ id: editingMachine.id, data });
    } else {
      createMachineMutation.mutate(data);
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    form.reset({
      name: machine.name,
      productCode: machine.productCode,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this machine?")) {
      deleteMachineMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingMachine(null);
    setShowAddDialog(false);
    form.reset();
  };

  if (isLoading) {
    return <div>Loading machines...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {isAdmin && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2" size={16} />
                <span className="hidden xs:inline">Add Machine</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Machine</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Machine Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter machine name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="productCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMachineMutation.isPending}>
                      {createMachineMutation.isPending ? "Creating..." : "Create Machine"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="text-lg md:text-xl">All Machines</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search machines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Filter size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>Product Code</TableHead>
                <TableHead>Date Added</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMachines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <Settings className="text-primary" size={20} />
                      </div>
                      <span className="font-medium">{machine.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-slate-100 rounded text-sm">
                      {machine.productCode}
                    </code>
                  </TableCell>
                  <TableCell>
                    {machine.addedOn ? new Date(machine.addedOn).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog 
                          open={editingMachine?.id === machine.id} 
                          onOpenChange={(open) => !open && setEditingMachine(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(machine)}
                            >
                              <Edit size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Machine</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Machine Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter machine name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="productCode"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Product Code</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter product code" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={updateMachineMutation.isPending}>
                                    {updateMachineMutation.isPending ? "Updating..." : "Update Machine"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(machine.id)}
                          disabled={deleteMachineMutation.isPending}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
