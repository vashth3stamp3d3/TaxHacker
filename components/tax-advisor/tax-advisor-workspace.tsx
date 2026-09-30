"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FormEvent, useState } from "react"

type ChatMessage = { role: "user" | "assistant"; content: string }

export function TaxAdvisorWorkspace({
  initialThreadId,
  initialMessages,
}: {
  initialThreadId?: string
  initialMessages?: ChatMessage[]
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages?.length
      ? initialMessages
      : [
          {
            role: "assistant",
            content:
              "Ask about GST, T2 planning, or the document you have open. I use CRA excerpts and structured ERP data, and I will not claim to file or sign off.",
          },
        ]
  )
  const [input, setInput] = useState("")
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId)
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const content = input.trim()
    if (!content) return
    const nextMessages = [...messages, { role: "user" as const, content }]
    setMessages(nextMessages)
    setInput("")
    setIsLoading(true)
    try {
      const entity = document.querySelector("[data-entity-type]") as HTMLElement | null
      const response = await fetch("/api/tax-advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          threadId,
          entityRef: entity
            ? { type: entity.dataset.entityType, id: entity.dataset.entityId }
            : undefined,
          pageContext: {
            url: window.location.pathname,
            title: document.title,
            visibleText: (document.querySelector("main")?.innerText || "").slice(0, 6000),
          },
        }),
      })
      const data = await response.json()
      if (data.threadId) setThreadId(data.threadId)
      setMessages([...nextMessages, { role: "assistant", content: data.answer || data.error || "No answer" }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[480px] space-y-3 overflow-auto rounded-md border p-3 text-sm">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`}>
              <div className="font-medium">{message.role === "user" ? "You" : "Advisor"}</div>
              <div className="whitespace-pre-wrap text-muted-foreground">{message.content}</div>
            </div>
          ))}
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={4} />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Thinking..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
