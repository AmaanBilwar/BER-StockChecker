"use client"

import type React from "react"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Upload, Scan, Check } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Item name must be at least 2 characters.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  quantity: z.coerce.number().min(1, {
    message: "Quantity must be at least 1.",
  }),
})

export default function AddItemForm() {
  const [activeTab, setActiveTab] = useState("manual")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      quantity: 1,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      console.log(values)
      setIsSubmitting(false)
      setIsSuccess(true)

      // Reset form after success
      setTimeout(() => {
        form.reset()
        setPreviewImage(null)
        setIsSuccess(false)
      }, 2000)
    }, 1000)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleScan = () => {
    // In a real app, this would activate the camera and process the scan
    // For now, we'll just simulate a successful scan with a timeout
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      form.setValue("name", "Scanned Motor Controller")
      form.setValue("category", "electronics")
      form.setValue("quantity", 1)
      setPreviewImage("/placeholder.svg?height=200&width=200")
    }, 1500)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="scan">Scan Item</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter item name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="electronics">Electronics</SelectItem>
                              <SelectItem value="mechanical">Mechanical</SelectItem>
                              <SelectItem value="power">Power</SelectItem>
                              <SelectItem value="materials">Materials</SelectItem>
                              <SelectItem value="tools">Tools</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image">Item Image</Label>
                      <div className="mt-2 flex flex-col items-center justify-center gap-4">
                        <div className="border rounded-lg overflow-hidden w-full aspect-square flex items-center justify-center bg-muted/30">
                          {previewImage ? (
                            <img
                              src={previewImage || "/placeholder.svg"}
                              alt="Preview"
                              className="max-h-full object-contain"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mt-2">Upload an image</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button type="button" variant="outline" className="w-full" asChild>
                            <label htmlFor="image-upload" className="cursor-pointer">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                              <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleImageUpload}
                              />
                            </label>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setPreviewImage(null)}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || isSuccess}>
                  {isSubmitting ? (
                    "Saving..."
                  ) : isSuccess ? (
                    <span className="flex items-center">
                      <Check className="mr-2 h-4 w-4" /> Saved Successfully
                    </span>
                  ) : (
                    "Save Item"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="scan" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label>Scan Item</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden w-full aspect-video flex items-center justify-center bg-muted/30">
                    {previewImage ? (
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Scanned item"
                        className="max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Camera className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Camera preview will appear here</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" className="w-full" onClick={handleScan} disabled={isSubmitting}>
                      <Scan className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Scanning..." : "Scan Item"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Will be filled after scan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Will be filled after scan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="electronics">Electronics</SelectItem>
                              <SelectItem value="mechanical">Mechanical</SelectItem>
                              <SelectItem value="power">Power</SelectItem>
                              <SelectItem value="materials">Materials</SelectItem>
                              <SelectItem value="tools">Tools</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormDescription>Adjust quantity if needed</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full mt-4" disabled={isSubmitting || isSuccess}>
                      {isSubmitting ? (
                        "Saving..."
                      ) : isSuccess ? (
                        <span className="flex items-center">
                          <Check className="mr-2 h-4 w-4" /> Saved Successfully
                        </span>
                      ) : (
                        "Save Item"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
