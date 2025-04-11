"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type React from "react"

import InventoryDashboard from "@/components/inventory-dashboard"
import AddItemForm from "@/components/add-item-form"
import { useAuth, SignInButton } from "@clerk/nextjs"

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-8 card-modern rounded-lg border border-gray-200">
          <h1 className="text-2xl font-bold mb-6">Please sign in to continue</h1>
          <SignInButton>
            <Button className="button-modern">Sign In</Button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="container mx-auto flex h-14 sm:h-16 items-center relative px-3 sm:px-4 md:px-6">
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base sm:text-lg font-bold md:text-2xl text-center">
            <span className="text-gray-800">Bearcats</span> <span className="text-red-600">Electric Racing</span>{" "}
            <span className="text-gray-800">Inventory</span>
          </h1>
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

// Helper component to style the SignInButton
function Button({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      className={`px-4 py-2 rounded-md text-white ${className}`}
      style={{
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
      }}
      {...props}
    >
      {children}
    </button>
  )
}
