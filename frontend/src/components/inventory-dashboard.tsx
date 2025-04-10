"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, AlertTriangle } from "lucide-react"
import Image from "next/image"

// Mock inventory data
const initialInventory = [
  {
    id: 1,
    name: "Motor Controller",
    category: "Electronics",
    quantity: 5,
    image: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-10",
  },
  {
    id: 2,
    name: "Battery Cell",
    category: "Power",
    quantity: 120,
    image: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-09",
  },
  {
    id: 3,
    name: "Carbon Fiber Sheet",
    category: "Materials",
    quantity: 8,
    image: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-08",
  },
  {
    id: 4,
    name: "Wheel Hub",
    category: "Mechanical",
    quantity: 12,
    image: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-07",
  },
  {
    id: 5,
    name: "Suspension Spring",
    category: "Mechanical",
    quantity: 16,
    image: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-06",
  },
  {
    id: 6,
    name: "Microcontroller",
    category: "Electronics",
    quantity: 3,
    image: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-05",
  },
]

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState(initialInventory)
  const [searchQuery, setSearchQuery] = useState("")

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
        </div>

        {lowStockItems > 0 && (
          <div className="flex items-center gap-2 text-amber-600 mt-2 sm:mt-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm sm:text-base">{lowStockItems} items low in stock</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredInventory.map((item) => (
          <Card key={item.id} className="overflow-hidden inventory-card">
            <CardHeader className="p-0">
              <div className="relative h-36 sm:h-48 w-full">
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <CardTitle className="text-lg sm:text-xl line-clamp-1">{item.name}</CardTitle>
                  <CardDescription>{item.category}</CardDescription>
                </div>
                <Badge variant={item.quantity <= 5 ? "destructive" : "secondary"} className="shrink-0">
                  {item.quantity} in stock
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t p-3 sm:p-4">
              Last updated: {item.lastUpdated}
            </CardFooter>
          </Card>
        ))}

        {filteredInventory.length === 0 && (
          <div className="col-span-full flex justify-center items-center h-40">
            <p className="text-muted-foreground">No items found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
