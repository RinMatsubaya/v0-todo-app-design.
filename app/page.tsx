"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Trash2,
  Plus,
  CalendarIcon,
  Tag,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Minus,
  Bell,
  BellOff,
  Clock,
  Hash,
  Palette,
  CalendarDays,
  AlertTriangle,
} from "lucide-react"

type Priority = "high" | "medium" | "low"
type FilterType = "all" | "active" | "completed"
type SortType = "date" | "priority" | "alphabetical" | "reminder" | "color" | "dueDate"
type TaskColor = "default" | "red" | "blue" | "yellow" | "purple" | "orange" | "pink" | "teal"

interface Task {
  id: string
  title: string
  completed: boolean
  color: TaskColor
  tags: string[]
  priority: Priority
  reminder?: Date
  dueDate?: Date
  createdAt: Date
}

const taskColors = {
  default: { name: "Default", bg: "bg-card", border: "border-l-primary", dot: "bg-primary" },
  red: { name: "Red", bg: "bg-red-50 dark:bg-red-950/20", border: "border-l-red-500", dot: "bg-red-500" },
  blue: { name: "Blue", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-l-blue-500", dot: "bg-blue-500" },
  yellow: {
    name: "Yellow",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-l-yellow-500",
    dot: "bg-yellow-500",
  },
  purple: {
    name: "Purple",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-l-purple-500",
    dot: "bg-purple-500",
  },
  orange: {
    name: "Orange",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-l-orange-500",
    dot: "bg-orange-500",
  },
  pink: { name: "Pink", bg: "bg-pink-50 dark:bg-pink-950/20", border: "border-l-pink-500", dot: "bg-pink-500" },
  teal: { name: "Teal", bg: "bg-teal-50 dark:bg-teal-950/20", border: "border-l-teal-500", dot: "bg-teal-500" },
}

export default function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium")
  const [newTaskColor, setNewTaskColor] = useState<TaskColor>("default")
  const [newTaskTags, setNewTaskTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [tagFilter, setTagFilter] = useState<string>("")
  const [colorFilter, setColorFilter] = useState<TaskColor | "">("")
  const [sortBy, setSortBy] = useState<SortType>("date")
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [editingTags, setEditingTags] = useState<string[]>([])
  const [editingTagInput, setEditingTagInput] = useState("")
  const [reminderTask, setReminderTask] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [dueDateTask, setDueDateTask] = useState<string | null>(null)
  const [selectedDueDate, setSelectedDueDate] = useState<Date>()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [showEditTagSuggestions, setShowEditTagSuggestions] = useState(false)

  // Get all unique tags from tasks
  const allTags = Array.from(new Set(tasks.flatMap((task) => task.tags))).sort()

  // Get all unique colors from tasks
  const usedColors = Array.from(new Set(tasks.map((task) => task.color)))

  // Get tag suggestions based on input
  const getTagSuggestions = (input: string, currentTags: string[]) => {
    if (!input.trim()) return []
    return allTags.filter((tag) => tag.toLowerCase().includes(input.toLowerCase()) && !currentTags.includes(tag))
  }

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true)
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          setNotificationsEnabled(permission === "granted")
        })
      }
    }
  }, [])

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      tasks.forEach((task) => {
        if (task.reminder && !task.completed && task.reminder <= now && notificationsEnabled) {
          new Notification(`Reminder: ${task.title}`, {
            body: `Task "${task.title}" is due now!`,
            icon: "/favicon.ico",
          })
          // Remove the reminder after notification
          setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, reminder: undefined } : t)))
        }
      })
    }

    const interval = setInterval(checkReminders, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [tasks, notificationsEnabled])

  const isDueDateOverdue = (dueDate: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return due < today
  }

  const isDueDateToday = (dueDate: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return due.getTime() === today.getTime()
  }

  const isDueDateSoon = (dueDate: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const timeDiff = due.getTime() - today.getTime()
    return timeDiff > 0 && timeDiff <= 7 * 24 * 60 * 60 * 1000 // Within 7 days
  }

  const getDueDateStatus = (dueDate: Date) => {
    if (isDueDateOverdue(dueDate)) {
      return {
        color: "text-red-500",
        icon: <AlertTriangle className="w-3 h-3" />,
        text: "Overdue",
        bgColor: "bg-red-50 dark:bg-red-950/20",
      }
    } else if (isDueDateToday(dueDate)) {
      return {
        color: "text-orange-500",
        icon: <Clock className="w-3 h-3" />,
        text: "Due Today",
        bgColor: "bg-orange-50 dark:bg-orange-950/20",
      }
    } else if (isDueDateSoon(dueDate)) {
      return {
        color: "text-yellow-500",
        icon: <CalendarDays className="w-3 h-3" />,
        text: "Due Soon",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      }
    } else {
      return {
        color: "text-blue-500",
        icon: <CalendarDays className="w-3 h-3" />,
        text: "Scheduled",
        bgColor: "bg-blue-50 dark:bg-blue-950/20",
      }
    }
  }

  const openDueDateDialog = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    setDueDateTask(taskId)
    if (task?.dueDate) {
      setSelectedDueDate(task.dueDate)
    } else {
      setSelectedDueDate(new Date())
    }
  }

  const saveDueDate = () => {
    if (dueDateTask && selectedDueDate) {
      setTasks(tasks.map((task) => (task.id === dueDateTask ? { ...task, dueDate: selectedDueDate } : task)))
    }
    setDueDateTask(null)
    setSelectedDueDate(undefined)
  }

  const removeDueDate = (taskId: string) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, dueDate: undefined } : task)))
  }

  const cancelDueDate = () => {
    setDueDateTask(null)
    setSelectedDueDate(undefined)
  }

  const addTag = (tag: string, isEditing = false) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (!trimmedTag) return

    if (isEditing) {
      if (!editingTags.includes(trimmedTag)) {
        setEditingTags([...editingTags, trimmedTag])
      }
      setEditingTagInput("")
    } else {
      if (!newTaskTags.includes(trimmedTag)) {
        setNewTaskTags([...newTaskTags, trimmedTag])
      }
      setTagInput("")
    }
    setShowTagSuggestions(false)
    setShowEditTagSuggestions(false)
  }

  const removeTag = (tagToRemove: string, isEditing = false) => {
    if (isEditing) {
      setEditingTags(editingTags.filter((tag) => tag !== tagToRemove))
    } else {
      setNewTaskTags(newTaskTags.filter((tag) => tag !== tagToRemove))
    }
  }

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.trim(),
        completed: false,
        color: newTaskColor,
        tags: newTaskTags,
        priority: newTaskPriority,
        createdAt: new Date(),
      }
      setTasks([task, ...tasks])
      setNewTask("")
      setNewTaskTags([])
      setTagInput("")
      setNewTaskPriority("medium")
      setNewTaskColor("default")
    }
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const startEditing = (task: Task) => {
    setEditingTask(task.id)
    setEditingTitle(task.title)
    setEditingTags([...task.tags])
    setEditingTagInput("")
  }

  const saveEdit = (id: string) => {
    if (editingTitle.trim()) {
      setTasks(
        tasks.map((task) => (task.id === id ? { ...task, title: editingTitle.trim(), tags: editingTags } : task)),
      )
    }
    setEditingTask(null)
    setEditingTitle("")
    setEditingTags([])
    setEditingTagInput("")
  }

  const cancelEdit = () => {
    setEditingTask(null)
    setEditingTitle("")
    setEditingTags([])
    setEditingTagInput("")
  }

  const updateTaskPriority = (id: string, priority: Priority) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, priority } : task)))
  }

  const updateTaskColor = (id: string, color: TaskColor) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, color } : task)))
  }

  const openReminderDialog = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    setReminderTask(taskId)
    if (task?.reminder) {
      setSelectedDate(task.reminder)
      setSelectedTime(task.reminder.toTimeString().slice(0, 5))
    } else {
      setSelectedDate(new Date())
      setSelectedTime("09:00")
    }
  }

  const saveReminder = () => {
    if (reminderTask && selectedDate) {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const reminderDate = new Date(selectedDate)
      reminderDate.setHours(hours, minutes, 0, 0)

      setTasks(tasks.map((task) => (task.id === reminderTask ? { ...task, reminder: reminderDate } : task)))
    }
    setReminderTask(null)
    setSelectedDate(undefined)
    setSelectedTime("")
  }

  const removeReminder = (taskId: string) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, reminder: undefined } : task)))
  }

  const cancelReminder = () => {
    setReminderTask(null)
    setSelectedDate(undefined)
    setSelectedTime("")
  }

  const isReminderOverdue = (reminder: Date) => {
    return new Date() > reminder
  }

  const isReminderSoon = (reminder: Date) => {
    const now = new Date()
    const timeDiff = reminder.getTime() - now.getTime()
    return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000 // Within 24 hours
  }

  const handleKeyPress = (e: React.KeyboardEvent, isTagInput = false, isEditing = false) => {
    if (e.key === "Enter") {
      if (isTagInput) {
        const input = isEditing ? editingTagInput : tagInput
        if (input.trim()) {
          addTag(input, isEditing)
        }
      } else if (editingTask) {
        saveEdit(editingTask)
      } else {
        addTask()
      }
    } else if (e.key === "Escape") {
      if (editingTask) {
        cancelEdit()
      }
      setShowTagSuggestions(false)
      setShowEditTagSuggestions(false)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    let matchesFilter = true
    let matchesTag = true
    let matchesColor = true

    // Apply completion filter
    if (filter === "active") matchesFilter = !task.completed
    if (filter === "completed") matchesFilter = task.completed

    // Apply tag filter
    if (tagFilter) {
      matchesTag = task.tags.includes(tagFilter)
    }

    // Apply color filter
    if (colorFilter) {
      matchesColor = task.color === colorFilter
    }

    return matchesFilter && matchesTag && matchesColor
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    } else if (sortBy === "alphabetical") {
      return a.title.localeCompare(b.title)
    } else if (sortBy === "color") {
      return a.color.localeCompare(b.color)
    } else if (sortBy === "reminder") {
      // Sort by reminder date, tasks with reminders first
      if (a.reminder && !b.reminder) return -1
      if (!a.reminder && b.reminder) return 1
      if (a.reminder && b.reminder) return a.reminder.getTime() - b.reminder.getTime()
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy === "dueDate") {
      // Sort by due date, overdue first, then by date
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime()
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case "high":
        return <ArrowUp className="w-3 h-3 text-red-500" />
      case "medium":
        return <Minus className="w-3 h-3 text-yellow-500" />
      case "low":
        return <ArrowDown className="w-3 h-3 text-green-500" />
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
    }
  }

  const getTaskColorClasses = (color: TaskColor) => {
    return taskColors[color]
  }

  const getReminderStatus = (reminder: Date) => {
    if (isReminderOverdue(reminder)) {
      return { color: "text-red-500", icon: <Bell className="w-3 h-3" />, text: "Overdue" }
    } else if (isReminderSoon(reminder)) {
      return { color: "text-yellow-500", icon: <Clock className="w-3 h-3" />, text: "Soon" }
    } else {
      return { color: "text-blue-500", icon: <CalendarIcon className="w-3 h-3" />, text: "Scheduled" }
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const totalCount = tasks.length
  const reminderCount = tasks.filter((task) => task.reminder && !task.completed).length
  const dueDateCount = tasks.filter((task) => task.dueDate && !task.completed).length
  const overdueCount = tasks.filter((task) => task.dueDate && !task.completed && isDueDateOverdue(task.dueDate)).length

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Todo App</h1>
          <p className="text-muted-foreground">Stay organized and productive</p>
          {totalCount > 0 && (
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                {completedCount} of {totalCount} tasks completed
              </div>
              {reminderCount > 0 && (
                <div className="flex items-center justify-center gap-1">
                  <Bell className="w-3 h-3" />
                  {reminderCount} task{reminderCount !== 1 ? "s" : ""} with reminders
                </div>
              )}
              {dueDateCount > 0 && (
                <div className="flex items-center justify-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {dueDateCount} task{dueDateCount !== 1 ? "s" : ""} with due dates
                  {overdueCount > 0 && <span className="text-red-500 font-medium">({overdueCount} overdue)</span>}
                </div>
              )}
              {allTags.length > 0 && (
                <div className="flex items-center justify-center gap-1">
                  <Hash className="w-3 h-3" />
                  {allTags.length} tag{allTags.length !== 1 ? "s" : ""} in use
                </div>
              )}
              {usedColors.length > 1 && (
                <div className="flex items-center justify-center gap-1">
                  <Palette className="w-3 h-3" />
                  {usedColors.length} color{usedColors.length !== 1 ? "s" : ""} in use
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Task Input */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e)}
                className="flex-1"
              />
              <Select value={newTaskPriority} onValueChange={(value: Priority) => setNewTaskPriority(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="px-3 bg-transparent">
                    <div className={`w-4 h-4 rounded-full ${getTaskColorClasses(newTaskColor).dot}`} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Choose Color</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(taskColors).map(([colorKey, colorData]) => (
                        <button
                          key={colorKey}
                          onClick={() => setNewTaskColor(colorKey as TaskColor)}
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                            newTaskColor === colorKey
                              ? "border-foreground scale-110"
                              : "border-border hover:border-foreground/50"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full ${colorData.dot}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button onClick={addTask} className="px-6">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="Add tags (press Enter)..."
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value)
                    setShowTagSuggestions(e.target.value.length > 0)
                  }}
                  onKeyPress={(e) => handleKeyPress(e, true)}
                  onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                  className="text-sm"
                />
                {showTagSuggestions && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-popover border rounded-md shadow-md mt-1 max-h-32 overflow-y-auto">
                    {getTagSuggestions(tagInput, newTaskTags).map((tag) => (
                      <button
                        key={tag}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => addTag(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {newTaskTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {newTaskTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {totalCount > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                  <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                    All ({totalCount})
                  </Button>
                  <Button
                    variant={filter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("active")}
                  >
                    Active ({totalCount - completedCount})
                  </Button>
                  <Button
                    variant={filter === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("completed")}
                  >
                    Completed ({completedCount})
                  </Button>
                </div>
                <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">By Date</SelectItem>
                    <SelectItem value="priority">By Priority</SelectItem>
                    <SelectItem value="reminder">By Reminder</SelectItem>
                    <SelectItem value="dueDate">By Due Date</SelectItem>
                    <SelectItem value="color">By Color</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {usedColors.length > 1 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Filter by color:</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={colorFilter === "" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setColorFilter("")}
                    >
                      All Colors
                    </Button>
                    {usedColors.map((color) => (
                      <Button
                        key={color}
                        variant={colorFilter === color ? "default" : "outline"}
                        size="sm"
                        onClick={() => setColorFilter(color)}
                        className="text-xs flex items-center gap-2"
                      >
                        <div className={`w-3 h-3 rounded-full ${getTaskColorClasses(color).dot}`} />
                        {taskColors[color].name} ({tasks.filter((t) => t.color === color).length})
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {allTags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Filter by tag:</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={tagFilter === "" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTagFilter("")}
                    >
                      All Tags
                    </Button>
                    {allTags.map((tag) => (
                      <Button
                        key={tag}
                        variant={tagFilter === tag ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTagFilter(tag)}
                        className="text-xs"
                      >
                        #{tag} ({tasks.filter((t) => t.tags.includes(tag)).length})
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {filter === "all" && !tagFilter && !colorFilter
                      ? "No tasks yet. Add one above to get started!"
                      : `No ${filter !== "all" ? filter + " " : ""}tasks found${
                          tagFilter ? ` with tag "${tagFilter}"` : ""
                        }${colorFilter ? ` with color "${taskColors[colorFilter].name}"` : ""}.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            sortedTasks.map((task) => {
              const colorClasses = getTaskColorClasses(task.color)
              const dueDateStatus = task.dueDate ? getDueDateStatus(task.dueDate) : null
              return (
                <Card
                  key={task.id}
                  className={`transition-all duration-200 border-l-4 ${
                    task.completed ? "opacity-60" : ""
                  } ${colorClasses.border} ${colorClasses.bg} ${
                    dueDateStatus && !task.completed && isDueDateOverdue(task.dueDate!) ? dueDateStatus.bgColor : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="mt-0.5"
                      />

                      <div className={`w-3 h-3 rounded-full ${colorClasses.dot} flex-shrink-0`} />

                      <div className="flex-1 min-w-0">
                        {editingTask === task.id ? (
                          <div className="space-y-2">
                            <div className="flex gap-2 items-center">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyPress={(e) => handleKeyPress(e)}
                                className="flex-1 text-sm"
                                autoFocus
                              />
                              <Button variant="ghost" size="sm" onClick={() => saveEdit(task.id)} className="p-1">
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={cancelEdit} className="p-1">
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <div className="relative">
                                <Input
                                  placeholder="Add/edit tags (press Enter)..."
                                  value={editingTagInput}
                                  onChange={(e) => {
                                    setEditingTagInput(e.target.value)
                                    setShowEditTagSuggestions(e.target.value.length > 0)
                                  }}
                                  onKeyPress={(e) => handleKeyPress(e, true, true)}
                                  onFocus={() => setShowEditTagSuggestions(editingTagInput.length > 0)}
                                  onBlur={() => setTimeout(() => setShowEditTagSuggestions(false), 200)}
                                  className="text-sm"
                                />
                                {showEditTagSuggestions && (
                                  <div className="absolute top-full left-0 right-0 z-10 bg-popover border rounded-md shadow-md mt-1 max-h-32 overflow-y-auto">
                                    {getTagSuggestions(editingTagInput, editingTags).map((tag) => (
                                      <button
                                        key={tag}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => addTag(tag, true)}
                                      >
                                        #{tag}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {editingTags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {editingTags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      #{tag}
                                      <button
                                        onClick={() => removeTag(tag, true)}
                                        className="ml-1 hover:text-destructive"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getPriorityIcon(task.priority)}
                              <p
                                className={`text-sm font-medium ${
                                  task.completed ? "line-through text-muted-foreground" : "text-foreground"
                                }`}
                              >
                                {task.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {task.createdAt.toLocaleDateString()}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {task.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${colorClasses.dot}`} />
                                {taskColors[task.color].name}
                              </Badge>
                              {task.dueDate && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs flex items-center gap-1 ${dueDateStatus?.color}`}
                                >
                                  {dueDateStatus?.icon}
                                  Due: {task.dueDate.toLocaleDateString()}
                                </Badge>
                              )}
                              {task.reminder && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs flex items-center gap-1 ${getReminderStatus(task.reminder).color}`}
                                >
                                  {getReminderStatus(task.reminder).icon}
                                  {task.reminder.toLocaleDateString()}{" "}
                                  {task.reminder.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </Badge>
                              )}
                              {task.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {task.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                      onClick={() => setTagFilter(tag)}
                                    >
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!task.completed && editingTask !== task.id && (
                          <>
                            <Select
                              value={task.priority}
                              onValueChange={(value: Priority) => updateTaskPriority(task.id, value)}
                            >
                              <SelectTrigger className="w-16 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Med</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="p-1">
                                  <Palette className="w-4 h-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">Change Color</h4>
                                  <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(taskColors).map(([colorKey, colorData]) => (
                                      <button
                                        key={colorKey}
                                        onClick={() => updateTaskColor(task.id, colorKey as TaskColor)}
                                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                                          task.color === colorKey
                                            ? "border-foreground scale-110"
                                            : "border-border hover:border-foreground/50"
                                        }`}
                                      >
                                        <div className={`w-5 h-5 rounded-full ${colorData.dot}`} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </>
                        )}

                        <Popover open={dueDateTask === task.id} onOpenChange={(open) => !open && cancelDueDate()}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 ${task.dueDate ? getDueDateStatus(task.dueDate).color : ""}`}
                              onClick={() => openDueDateDialog(task.id)}
                            >
                              <CalendarDays className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-4">
                              <h4 className="font-medium">Set Due Date</h4>
                              <Calendar
                                mode="single"
                                selected={selectedDueDate}
                                onSelect={setSelectedDueDate}
                                className="rounded-md border"
                              />
                              <div className="flex gap-2">
                                <Button onClick={saveDueDate} size="sm" className="flex-1">
                                  Save Due Date
                                </Button>
                                {task.dueDate && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      removeDueDate(task.id)
                                      cancelDueDate()
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Popover open={reminderTask === task.id} onOpenChange={(open) => !open && cancelReminder()}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 ${task.reminder ? getReminderStatus(task.reminder).color : ""}`}
                              onClick={() => openReminderDialog(task.id)}
                            >
                              {task.reminder ? <Bell className="w-4 h-4" /> : <CalendarIcon className="w-4 h-4" />}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-4">
                              <h4 className="font-medium">Set Reminder</h4>
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                className="rounded-md border"
                              />
                              <div className="flex gap-2">
                                <Input
                                  type="time"
                                  value={selectedTime}
                                  onChange={(e) => setSelectedTime(e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={saveReminder} size="sm" className="flex-1">
                                  Save Reminder
                                </Button>
                                {task.reminder && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      removeReminder(task.id)
                                      cancelReminder()
                                    }}
                                  >
                                    <BellOff className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>

                        {editingTask !== task.id && (
                          <Button variant="ghost" size="sm" onClick={() => startEditing(task)} className="p-1">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Stats Footer */}
        {totalCount > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Total tasks: {totalCount}</span>
                <span>Completed: {completedCount}</span>
                <span>Remaining: {totalCount - completedCount}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
