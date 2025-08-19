import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Cpu, Search, Filter, Edit, Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { insertPanelSchema } from "@shared/schema";
import type { Panel, Machine } from "@shared/schema";

const panelFormSchema = insertPanelSchema.omit({ addedBy: true });
type PanelFormData = z.infer<typeof panelFormSchema>;

export function PanelsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: panels = [], isLoading } = useQuery<Panel[]>({
    queryKey: ["/api/panels"],
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const form = useForm<PanelFormData>({
    resolver: zodResolver(panelFormSchema),
    defaultValues: {
      name: "",
      panelCode: "",
      parentMachineId: 0,
    },
  });

  const createPanelMutation = useMutation({
    mutationFn: async (data: PanelFormData) => {
      const response = await apiRequest("POST", "/api/panels", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
      toast({ title: "Panel created successfully" });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create panel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePanelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PanelFormData }) => {
      const response = await apiRequest("PUT", `/api/panels/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
      toast({ title: "Panel updated successfully" });
      setEditingPanel(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update panel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePanelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/panels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
      toast({ title: "Panel deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete panel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPanels = panels.filter(panel =>
    panel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    panel.panelCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (data: PanelFormData) => {
    if (editingPanel) {
      updatePanelMutation.mutate({ id: editingPanel.id, data });
    } else {
      createPanelMutation.mutate(data);
    }
  };

  const handleEdit = (panel: Panel) => {
    setEditingPanel(panel);
    form.reset({
      name: panel.name,
      panelCode: panel.panelCode,
      parentMachineId: panel.parentMachineId,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this panel?")) {
      deletePanelMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingPanel(null);
    setShowAddDialog(false);
    form.reset();
  };

  const getMachineName = (machineId: number) => {
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : 'Unknown Machine';
  };

  if (isLoading) {
    return <div>Loading panels...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panels</h1>
          <p className="mt-2 text-slate-600">Manage control panels and their machine associations</p>
        </div>
        {isAdmin && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" size={16} />
                Add Panel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Panel</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panel Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter panel name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="panelCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panel Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter panel code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="parentMachineId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Machine</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a machine" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {machines.map((machine) => (
                              <SelectItem key={machine.id} value={machine.id.toString()}>
                                {machine.name} ({machine.productCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPanelMutation.isPending}>
                      {createPanelMutation.isPending ? "Creating..." : "Create Panel"}
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
          <div className="flex justify-between items-center">
            <CardTitle>All Panels</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search panels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Panel</TableHead>
                <TableHead>Panel Code</TableHead>
                <TableHead>Parent Machine</TableHead>
                <TableHead>Date Added</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPanels.map((panel) => (
                <TableRow key={panel.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <Cpu className="text-primary" size={20} />
                      </div>
                      <span className="font-medium">{panel.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-slate-100 rounded text-sm">
                      {panel.panelCode}
                    </code>
                  </TableCell>
                  <TableCell>{getMachineName(panel.parentMachineId)}</TableCell>
                  <TableCell>
                    {panel.addedOn ? new Date(panel.addedOn).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog 
                          open={editingPanel?.id === panel.id} 
                          onOpenChange={(open) => !open && setEditingPanel(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(panel)}
                            >
                              <Edit size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Panel</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Panel Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter panel name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="panelCode"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Panel Code</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter panel code" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="parentMachineId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Parent Machine</FormLabel>
                                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a machine" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {machines.map((machine) => (
                                            <SelectItem key={machine.id} value={machine.id.toString()}>
                                              {machine.name} ({machine.productCode})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={updatePanelMutation.isPending}>
                                    {updatePanelMutation.isPending ? "Updating..." : "Update Panel"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(panel.id)}
                          disabled={deletePanelMutation.isPending}
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
        </CardContent>
      </Card>
    </div>
  );
}
