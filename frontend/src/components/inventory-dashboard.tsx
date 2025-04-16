"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, AlertTriangle, RefreshCw, Plus, Minus, MapPin } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

// Define the Item type based on our MongoDB schema
interface Item {
  _id: string
  name: string
  category: string
  quantity: number
  location: string
  image_url?: string
  created_at: string
}

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<Item[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({})

  // Fetch inventory data from MongoDB
  const fetchInventory = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch inventory data")
      }

      const data = await response.json()
      console.log("Received raw inventory data:", data)
      
      // Map the data to ensure all required fields are present
      const processedData = data.map((item: Item) => ({
        _id: item._id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        location: item.location,
        image_url: item.image_url,
        created_at: item.created_at
      }))
      console.log("Processed inventory data:", processedData)
      
      setInventory(processedData)
    } catch (err) {
      console.error("Error fetching inventory:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Update item quantity
  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return

    setUpdatingItems((prev) => ({ ...prev, [itemId]: true }))

    try {
      const currentItem = inventory.find(item => item._id === itemId)
      console.log("Current item before update:", currentItem)

      const updateData = {
        quantity: newQuantity,
        location: currentItem?.location
      }
      console.log("Sending update data:", updateData)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items)`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update item")
      }

      const updatedItem = await response.json()
      console.log("Updated item response:", updatedItem)

      // Update the item in the local state
      setInventory((prev) => prev.map((item) => (item._id === itemId ? {
        ...updatedItem,
        location: updatedItem.location || '' // Ensure location is never undefined
      } : item)))

      toast.success(`Item updated successfully`)
    } catch (err) {
      console.error("Error updating item:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update item")
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  // Increment item quantity
  const incrementQuantity = (itemId: string, currentQuantity: number) => {
    updateItemQuantity(itemId, currentQuantity + 1)
  }

  // Decrement item quantity
  const decrementQuantity = (itemId: string, currentQuantity: number) => {
    if (currentQuantity > 0) {
      updateItemQuantity(itemId, currentQuantity - 1)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchInventory()
  }, [])

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const lowStockItems = inventory.filter((item) => item.quantity <= 5).length

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search inventory..."
              className="pl-8 w-full sm:w-[240px] md:w-[300px] input-modern"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
          <Button variant="outline" size="icon" className="shrink-0" onClick={fetchInventory} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {lowStockItems > 0 && (
          <div className="flex items-center gap-2 text-red-500 mt-2 sm:mt-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm sm:text-base">{lowStockItems} items low in stock</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
          <span className="ml-2 text-gray-500">Loading inventory...</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInventory.map((item) => (
            <Card key={item._id} className="overflow-hidden relative card-modern">
              <CardHeader className="p-0">
                <div className="relative h-36 sm:h-48 w-full">
                  <Image src={item.image_url || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg sm:text-xl line-clamp-1">{item.name}</CardTitle>
                    <CardDescription>{item.category}</CardDescription>
                    <div className="mt-1 text-sm text-gray-500">
                      <span className="font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> 
                        {item.location ? (
                          item.location === 'ice_electronics' ? 'ICE Electronics' :
                          item.location === 'electronics_drawer' ? 'Electronics Drawer' :
                          item.location === 'powertrain_drawer' ? 'Powertrain Drawer' :
                          item.location === 'ev_shelf' ? 'EV Shelf' :
                          item.location
                        ) : 'No location set'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant={item.quantity <= 5 ? "destructive" : "secondary"} className="shrink-0 mb-2">
                      {item.quantity} in stock
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => decrementQuantity(item._id, item.quantity)}
                        disabled={updatingItems[item._id] || item.quantity <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => incrementQuantity(item._id, item.quantity)}
                        disabled={updatingItems[item._id]}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-gray-500 border-t border-gray-100 p-3 sm:p-4">
                Last updated: {new Date(item.created_at).toISOString().split('T')[0]}
              </CardFooter>
            </Card>
          ))}

          {filteredInventory.length === 0 && !isLoading && (
            <div className="col-span-full flex justify-center items-center h-40 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No items found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
