"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DataTableExample } from "./data-table-example";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DatePicker } from "@/components/ui/date-picker"


import { ChartExample } from "./chart-example";


import { Autocomplete } from "@/components/ui/autocomplete"


const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  language: z.string(),
  dateOfBirth: z.date().optional(),
  framework: z.string().optional(),
})

function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      language: "en",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="rw">Kinyarwanda</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                This will be the default language for your account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
                <DatePicker />
              <FormDescription>
                Your date of birth is used to calculate your age.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="framework"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Framework</FormLabel>
              <Autocomplete />
              <FormDescription>
                Select your favorite framework.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}


export default function DesignSystemPage() {
  return (
    <TooltipProvider>
      <main className="container mx-auto p-8 space-y-12">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">EMR Design System</h1>
          <p className="text-muted-foreground">
            A showcase of the foundational UI elements for the new EMR.
          </p>
        </header>

        {/* Typography Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold border-b pb-2">Typography</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Heading 1</h1>
              <h2 className="text-3xl font-semibold">Heading 2</h2>
              <h3 className="text-2xl font-semibold">Heading 3</h3>
              <h4 className="text-xl font-semibold">Heading 4</h4>
              <h5 className="text-lg font-semibold">Heading 5</h5>
              <h6 className="text-base font-semibold">Heading 6</h6>
            </div>
            <div className="space-y-4">
              <p className="text-base">
                This is a paragraph of body text. It's the default size and weight for most content. 
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              <p className="text-sm text-muted-foreground">
                This is a smaller, muted text, often used for captions or subtitles.
              </p>
              <blockquote className="border-l-4 pl-4 italic">
                "This is a blockquote. It stands out from the rest of the text."
              </blockquote>
            </div>
          </div>
        </section>

        {/* Colors Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold border-b pb-2">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24 rounded-md bg-background border"></div>
              <span>Background</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24 rounded-md bg-foreground"></div>
              <span className="text-white">Foreground</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24 rounded-md bg-card border"></div>
              <span>Card</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24 rounded-md bg-primary"></div>
              <span>Primary</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24 rounded-md bg-secondary"></div>
              <span>Secondary</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24 rounded-md bg-accent"></div>
              <span>Accent</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24 rounded-md bg-muted"></div>
              <span>Muted</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24 rounded-md bg-destructive"></div>
              <span>Destructive</span>
            </div>
          </div>
        </section>
        
        {/* Components Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold border-b pb-2">Components</h2>
          <div className="space-y-8">
              <div>
                  <h3 className="text-2xl font-semibold mb-4">Buttons</h3>
                  <div className="flex flex-wrap gap-4 items-center">
                      <Button>Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="link">Link</Button>
                  </div>
              </div>
              <div>
                  <h3 className="text-2xl font-semibold mb-4">Data Display</h3>
                  <div className="flex flex-wrap gap-4 items-start">
                    <Card className="w-[350px]">
                      <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card Description</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>This is the card content area. It can hold any information you need.</p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline">Cancel</Button>
                        <Button>Deploy</Button>
                      </CardFooter>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <Badge>Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="destructive">Destructive</Badge>
                            <Badge variant="outline">Outline</Badge>
                        </div>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline">Hover me</Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This is a tooltip!</p>
                            </TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">Open Menu</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem>Billing</DropdownMenuItem>
                                <DropdownMenuItem>Team</DropdownMenuItem>
                                <DropdownMenuItem>Subscription</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
              </div>
              <div>
                  <h3 className="text-2xl font-semibold mb-4">Chart</h3>
                  <ChartExample />
              </div>
              <div>
                  <h3 className="text-2xl font-semibold mb-4">Form</h3>
                  <ProfileForm />
              </div>
              <div>
                  <h3 className="text-2xl font-semibold mb-4">Data Table</h3>
                  <DataTableExample />
              </div>
          </div>
        </section>

      </main>
    </TooltipProvider>
  );
}
