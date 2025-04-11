"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, AlertTriangle, RefreshCw, Plus, Minus } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

// Define the Item type based on our MongoDB schema
interface Item {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  image_url?: string;
  created_at: string;
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
      const response = await fetch('http://localhost:5000/api/items')
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data')
      }
      
      const data = await response.json()
      setInventory(data)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Update item quantity
  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return
    
    setUpdatingItems(prev => ({ ...prev, [itemId]: true }))
    
    try {
      const response = await fetch(`http://localhost:5000/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update item quantity')
      }
      
      const updatedItem = await response.json()
      
      // Update the item in the local state
      setInventory(prev => 
        prev.map(item => item._id === itemId ? updatedItem : item)
      )
      
      toast.success(`Quantity updated to ${newQuantity}`)
    } catch (err) {
      console.error('Error updating item quantity:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update quantity')
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }))
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
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search inventory..."
              className="pl-8 w-full sm:w-[240px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="shrink-0" 
            onClick={fetchInventory}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {lowStockItems > 0 && (
          <div className="flex items-center gap-2 text-amber-600 mt-2 sm:mt-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm sm:text-base">{lowStockItems} items low in stock</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading inventory...</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInventory.map((item) => (
            <Card key={item._id} className="overflow-hidden inventory-card">
              <CardHeader className="p-0">
                <div className="relative h-36 sm:h-48 w-full">
                  <Image 
                    src={item.image_url || "/placeholder.svg"} 
                    alt={item.name} 
                    fill 
                    className="object-cover" 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg sm:text-xl line-clamp-1">{item.name}</CardTitle>
                    <CardDescription>{item.category}</CardDescription>
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
              <CardFooter className="text-xs text-muted-foreground border-t p-3 sm:p-4">
                Last updated: {new Date(item.created_at).toLocaleDateString()}
              </CardFooter>
            </Card>
          ))}

          {filteredInventory.length === 0 && !isLoading && (
            <div className="col-span-full flex justify-center items-center h-40">
              <p className="text-muted-foreground">No items found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
