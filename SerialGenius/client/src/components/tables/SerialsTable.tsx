import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Hash } from "lucide-react";
import type { Serial, Machine, Panel, Order } from "@shared/schema";

interface SerialWithRelations extends Serial {
  machine?: Machine;
  panel?: Panel;
  order?: Order;
}

export function SerialsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: serials = [], isLoading } = useQuery<SerialWithRelations[]>({
    queryKey: ["/api/serials"],
  });

  const filteredSerials = serials.filter(serial =>
    serial.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSerialType = (serial: Serial) => {
    if (serial.machineId) return 'Machine';
    if (serial.panelId) return 'Panel';
    return 'Unknown';
  };

  const getSerialTypeColor = (type: string) => {
    switch (type) {
      case 'Machine':
        return 'bg-blue-100 text-blue-800';
      case 'Panel':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return <div>Loading serial numbers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Serial Numbers</h1>
          <p className="mt-2 text-slate-600">View all generated serial numbers for machines and panels</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Serial Numbers</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search serial numbers..."
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
                <TableHead>Serial Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Generated Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSerials.map((serial) => (
                <TableRow key={serial.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <Hash className="text-primary" size={20} />
                      </div>
                      <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                        {serial.serialNumber}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSerialTypeColor(getSerialType(serial))}>
                      {getSerialType(serial)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {serial.machine?.name || serial.panel?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {serial.order ? (
                      <div>
                        <div className="font-medium">{serial.order.customerName}</div>
                        <div className="text-sm text-slate-600">{serial.order.quoteNumber}</div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {serial.addedOn ? new Date(serial.addedOn).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
