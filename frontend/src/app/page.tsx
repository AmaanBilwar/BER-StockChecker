import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InventoryDashboard from "@/components/inventory-dashboard"
import AddItemForm from "@/components/add-item-from"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <h1 className="text-lg font-semibold md:text-2xl">Formula Electric SAE Inventory</h1>
        </div>
      </header>
      <main className="container py-6 px-4 md:px-6 md:py-10">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Inventory Dashboard</TabsTrigger>
            <TabsTrigger value="add">Add/Update Item</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-4">
            <InventoryDashboard />
          </TabsContent>
          <TabsContent value="add" className="space-y-4">
            <AddItemForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
