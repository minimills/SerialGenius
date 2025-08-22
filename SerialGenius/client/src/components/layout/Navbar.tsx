import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Barcode, 
  Home, 
  Settings, 
  Cpu, 
  List, 
  Bell, 
  LogOut,
  Plus
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onAddOrder?: () => void;
}

export function Navbar({ onAddOrder }: NavbarProps) {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Machines", href: "/machines", icon: Settings },
    { name: "Panels", href: "/panels", icon: Cpu },
    { name: "Serial Numbers", href: "/serials", icon: List },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 md:space-x-8">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Barcode className="text-white text-sm md:text-lg" size={16} />
              </div>
              <span className="text-lg md:text-xl font-bold text-slate-900 hidden sm:block">Serial Generator</span>
              <span className="text-lg font-bold text-slate-900 sm:hidden">SNG</span>
            </div>
            
            <div className="hidden md:flex space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="mr-2" size={16} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {isAdmin && onAddOrder && (
              <Button onClick={onAddOrder} size="sm" className="hidden sm:flex">
                <Plus className="mr-2" size={16} />
                Add Order
              </Button>
            )}
            {isAdmin && onAddOrder && (
              <Button onClick={onAddOrder} size="sm" className="sm:hidden">
                <Plus size={16} />
              </Button>
            )}
            
            <div className="hidden sm:flex items-center space-x-3">
              <Badge variant={user?.role === 'Admin' ? 'default' : 'secondary'}>
                {user?.role}
              </Badge>
              <span className="text-sm font-medium text-slate-700">
                {user?.username}
              </span>
            </div>
            
            <div className="sm:hidden">
              <Badge variant={user?.role === 'Admin' ? 'default' : 'secondary'} className="text-xs">
              </Badge>
            </div>
            
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Bell size={20} />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={16} className="md:size-20" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-200 py-2">
          <div className="flex justify-around">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center px-2 py-2 rounded-md text-xs font-medium transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon size={20} />
                  <span className="mt-1">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
