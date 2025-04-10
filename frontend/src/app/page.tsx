'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InventoryDashboard from "@/components/inventory-dashboard"
import AddItemForm from "@/components/add-item-form"
import { useAuth, SignInButton } from "@clerk/nextjs"

export default function Home() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return(
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to continue</h1>
          <SignInButton />
        </div>
      </div>
    ) 

  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <header className="border-b w-full">
      <div className="container flex h-14 sm:h-16 items-center justify-center px-3 sm:px-4 md:px-6">
      <h1 className="text-base sm:text-lg font-semibold md:text-2xl text-center">Formula Electric SAE Inventory</h1>
        </div>
      </header>
      <main className="container py-4 px-3 sm:py-6 sm:px-4 md:px-6 md:py-8 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="dashboard" className="space-y-4 w-full">
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
