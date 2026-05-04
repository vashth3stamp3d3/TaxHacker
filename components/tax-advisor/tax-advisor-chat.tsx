"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Bot, GripHorizontal, Loader2, MessageCircle, Send, X } from "lucide-react"
import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type ChatSource = {
  guideId: string
  title: string
  sourceUrl: string
}

type Position = {
  x: number
  y: number
}

function capturePageContext() {
  const main = document.querySelector("main") || document.body
  const visibleText = (main.innerText || document.body.innerText || "")
    .replace(/\s+/g, " ")
    .slice(0, 6000)

  return {
    url: window.location.pathname + window.location.search,
    title: document.title,
    selectedText: window.getSelection()?.toString().slice(0, 1500) || "",
    visibleText,
  }
}

export function TaxAdvisorChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi, I can review this page with CRA guidance for Canadian corporate tax, GST/HST, payroll, and taxable-benefit questions.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sources, setSources] = useState<ChatSource[]>([])
  const [position, setPosition] = useState<Position>({ x: 24, y: 24 })
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem("taxAdvisorPosition")
    if (stored) {
      try {
        setPosition(JSON.parse(stored))
      } catch {
        // Ignore malformed local storage.
      }
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("taxAdvisorPosition", JSON.stringify(position))
  }, [position])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!dragStart.current) return
      const nextX = Math.max(8, Math.min(window.innerWidth - 88, dragStart.current.x + event.clientX - dragStart.current.pointerX))
      const nextY = Math.max(8, Math.min(window.innerHeight - 88, dragStart.current.y + event.clientY - dragStart.current.pointerY))
      setPosition({ x: nextX, y: nextY })
    }

    const onMouseUp = () => {
      dragStart.current = null
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  function startDrag(event: ReactMouseEvent) {
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: position.x,
      y: position.y,
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = input.trim()
    if (!question || isLoading) return

    const nextMessages = [...messages, { role: "user" as const, content: question }]
    setMessages(nextMessages)
    setInput("")
    setIsLoading(true)
    setSources([])

    try {
      const response = await fetch("/api/tax-advisor/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          pageContext: capturePageContext(),
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "The tax advisor could not answer right now.")
      }

      setMessages([...nextMessages, { role: "assistant", content: result.answer || "I could not produce an answer." }])
      setSources(result.sources || [])
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "The tax advisor could not answer right now.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed z-50"
      style={{
        right: position.x,
        bottom: position.y,
      }}
    >
      {isOpen ? (
        <Card className="w-[min(420px,calc(100vw-24px))] overflow-hidden shadow-2xl">
          <CardHeader className="cursor-move select-none border-b p-3" onMouseDown={startDrag}>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="h-4 w-4" />
                CRA Tax Advisor
              </CardTitle>
              <div className="flex items-center gap-1">
                <GripHorizontal className="h-4 w-4 text-muted-foreground" />
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex h-[560px] max-h-[calc(100vh-140px)] flex-col gap-3 p-3">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm leading-relaxed",
                    message.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-muted"
                  )}
                >
                  {message.content}
                </div>
              ))}
              {isLoading ? (
                <div className="mr-8 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking CRA guidance and this page...
                </div>
              ) : null}
            </div>
            {sources.length > 0 ? (
              <div className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">CRA sources used</div>
                {sources.slice(0, 4).map((source) => (
                  <a key={`${source.guideId}-${source.sourceUrl}`} href={source.sourceUrl} target="_blank" className="block truncate underline">
                    {source.title}
                  </a>
                ))}
              </div>
            ) : null}
            <form onSubmit={sendMessage} className="flex gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about GST, payroll, taxable benefits, T2, or this page..."
                className="max-h-28 min-h-12 resize-none"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-12 w-12 shrink-0">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          className="h-14 w-14 cursor-move rounded-full shadow-2xl"
          onClick={() => setIsOpen(true)}
          onMouseDown={startDrag}
          aria-label="Open CRA tax advisor"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
