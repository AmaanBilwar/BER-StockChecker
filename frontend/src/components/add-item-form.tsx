"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
import { Camera, Upload, Scan, Check, X } from "lucide-react"

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
  location: z.string({
    required_error: "Please enter a location.",
  })
})

export default function AddItemForm() {
  const [activeTab, setActiveTab] = useState("manual")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isBackCamera, setIsBackCamera] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      quantity: 1,
      location: "",
    },
  })

  // Cleanup function for camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setError(null)

    try {
      
      // Prepare the data to send to the API
      const itemData = {
        name: values.name,
        category: values.category,
        quantity: values.quantity,
        location: values.location,
        image_url: previewImage || null,
      }

      console.log("Submitting item data:", itemData);

      // Make API call to create item
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save item")
      }

      const savedItem = await response.json();
      console.log("Saved item response:", savedItem);

      // Success
      setIsSuccess(true)

      // Reset form after success
      setTimeout(() => {
        form.reset()
        setPreviewImage(null)
        setIsSuccess(false)
      }, 2000)
    } catch (err) {
      console.error("Error saving item:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
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

  const startCamera = async (useBackCamera = true) => {
    try {
      console.log("Starting camera...")

      // First set camera as active so video element renders
      setIsCameraActive(true)
      setIsBackCamera(useBackCamera)

      // Wait a bit for the video element to be created
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (!videoRef.current) {
        throw new Error("Video element not found. Please try again.")
      }

      console.log("Video element found:", videoRef.current)

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access")
      }

      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: useBackCamera ? "environment" : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      console.log("Got media stream:", mediaStream)
      setStream(mediaStream)

      videoRef.current.srcObject = mediaStream

      // Add event listeners for video element
      videoRef.current.onloadedmetadata = () => {
        console.log("Video metadata loaded")
        videoRef.current?.play().catch((e) => {
          console.error("Error playing video:", e)
          setError("Failed to play video stream")
        })
      }

      videoRef.current.onplay = () => {
        console.log("Video started playing")
      }

      videoRef.current.onerror = (e) => {
        console.error("Video element error:", e)
        setError("Error displaying video stream")
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setIsCameraActive(false)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
    }
  }

  const switchCamera = async () => {
    // Switch to the opposite camera
    await startCamera(!isBackCamera)
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const captureImage = () => {
    if (!videoRef.current) return

    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL("image/jpeg")
      setPreviewImage(imageData)
      stopCamera()
    }
  }

  const handleScan = async () => {
    if (!previewImage) {
      setError("Please capture an image first")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Send image to backend for OCR processing
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: previewImage }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process image")
      }

      const data = await response.json()

      // Update form with scanned data
      form.setValue("name", data.name)
      form.setValue("quantity", data.quantity)
      form.setValue("location", data.location)

      // Try to determine category based on the raw text
      const rawText = data.raw_text.toLowerCase()
      let category = "other"

      if (rawText.includes("motor") || rawText.includes("controller") || rawText.includes("circuit")) {
        category = "electronics"
      } else if (rawText.includes("bolt") || rawText.includes("nut") || rawText.includes("screw")) {
        category = "mechanical"
      } else if (rawText.includes("battery") || rawText.includes("power")) {
        category = "power"
      } else if (rawText.includes("material") || rawText.includes("sheet")) {
        category = "materials"
      } else if (rawText.includes("tool") || rawText.includes("wrench")) {
        category = "tools"
      }

      form.setValue("category", category)

    } catch (err) {
      console.error("Error scanning item:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full card-modern">
      <CardContent className="p-3 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="scan">Scan Item</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 sm:space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  <div className="space-y-3 sm:space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter item name" {...field} className="input-modern" />
                          </FormControl>
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
                            <Input type="number" min="1" {...field} className="input-modern" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel>Location</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full input-modern">
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent
                              position="popper"
                              className="w-full min-w-[8rem] max-w-[--radix-select-trigger-width]"
                              sideOffset={4}
                            >
                              <SelectItem value="ice_electronics">ICE Electronics</SelectItem>
                              <SelectItem value="electronics_drawer">Electronics Drawer</SelectItem>
                              <SelectItem value="powertrain_drawer">Powertrain Drawer</SelectItem>
                              <SelectItem value="ev_shelf">EV Shelf</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="image">Item Image</Label>
                      <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:gap-4">
                        <div className="border border-gray-200 rounded-lg overflow-hidden w-full aspect-square flex items-center justify-center bg-gray-50">
                          {previewImage ? (
                            <img
                              src={previewImage || "/placeholder.svg"}
                              alt="Preview"
                              className="max-h-full object-contain"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Upload className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-500 mt-2">Upload an image</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 text-xs sm:text-sm max-w-[120px]"
                            asChild
                          >
                            <label htmlFor="image-upload" className="cursor-pointer">
                              <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                            className="flex-1 text-xs sm:text-sm max-w-[120px]"
                            onClick={() => setPreviewImage(null)}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full text-white button-modern" disabled={isSubmitting || isSuccess}>
                  {isSubmitting ? (
                    "Saving..."
                  ) : isSuccess ? (
                    <span className="flex items-center justify-center">
                      <Check className="mr-2 h-4 w-4" /> Saved Successfully
                    </span>
                  ) : (
                    "Save Item"
                  )}
                </Button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="scan" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label>Scan Item</Label>
                  <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden w-full aspect-square sm:aspect-video relative bg-gray-50">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
                      onLoadedMetadata={() => console.log("Video element metadata loaded")}
                      onPlay={() => console.log("Video element started playing")}
                      onError={(e) => {
                        console.error("Video element error:", e)
                        setError("Error displaying video stream")
                      }}
                    />
                    {!isCameraActive && previewImage && (
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Captured item"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    )}
                    {!isCameraActive && !previewImage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-4">
                          <Camera className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-red-500" />
                          <p className="text-sm text-gray-500 mt-2">Click "Start Camera" to begin scanning</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {!isCameraActive && !previewImage && (
                      <Button
                        type="button"
                        className="w-full col-span-full text-white button-modern"
                        onClick={() => {
                          console.log("Start camera button clicked")
                          startCamera(true)
                        }}
                      >
                        <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Start Camera
                      </Button>
                    )}
                    {isCameraActive && (
                      <>
                        <Button type="button" className="w-full text-white button-modern" onClick={captureImage}>
                          <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Capture
                        </Button>
                        <Button type="button" variant="outline" className="w-full" onClick={switchCamera}>
                          <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Switch Camera
                        </Button>
                        <Button type="button" variant="outline" className="w-full" onClick={stopCamera}>
                          <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {previewImage && (
                      <>
                        <Button
                          type="button"
                          className="w-full sm:col-span-2 text-white button-modern"
                          onClick={handleScan}
                          disabled={isSubmitting}
                        >
                          <Scan className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {isSubmitting ? "Scanning..." : "Scan Item"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setPreviewImage(null)}
                        >
                          <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Clear
                        </Button>
                      </>
                    )}
                  </div>
                  {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Will be filled after scan" {...field} className="input-modern" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full input-modern">
                                <SelectValue placeholder="Will be filled after scan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent
                              position="popper"
                              className="w-full min-w-[8rem] max-w-[--radix-select-trigger-width]"
                              sideOffset={4}
                            >
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
                            <Input type="number" min="1" {...field} className="input-modern" />
                          </FormControl>
                          <FormDescription className="text-xs sm:text-sm text-gray-500">
                            Adjust quantity if needed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel>Location</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full input-modern">
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent
                              position="popper"
                              className="w-full min-w-[8rem] max-w-[--radix-select-trigger-width]"
                              sideOffset={4}
                            >
                              <SelectItem value="ice_electronics">ICE Electronics</SelectItem>
                              <SelectItem value="electronics_drawer">Electronics Drawer</SelectItem>
                              <SelectItem value="powertrain_drawer">Powertrain Drawer</SelectItem>
                              <SelectItem value="ev_shelf">EV Shelf</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full mt-3 sm:mt-4 text-white button-modern"
                      disabled={isSubmitting || isSuccess}
                    >
                      {isSubmitting ? (
                        "Saving..."
                      ) : isSuccess ? (
                        <span className="flex items-center justify-center">
                          <Check className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Saved Successfully
                        </span>
                      ) : (
                        "Save Item"
                      )}
                    </Button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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
