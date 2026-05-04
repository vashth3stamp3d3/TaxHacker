import { approveSuggestionAction, dismissSuggestionAction, refreshAutomationAction } from "@/app/(app)/automation/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getAutomationSuggestions, getNotificationTasks } from "@/models/automation"
import { ensureActiveOrganization } from "@/models/organizations"

export const metadata = {
  title: "Automation",
}

export default async function AutomationPage() {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const [suggestions, tasks] = await Promise.all([
    getAutomationSuggestions(organization.id),
    getNotificationTasks(organization.id),
  ])

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Automation</h1>
          <p className="text-muted-foreground">
            Reviewable AI-style suggestions for bookkeeping, inventory, jobs, cash flow, and GST.
          </p>
        </div>
        <form action={refreshAutomationAction}>
          <Button type="submit">Refresh Suggestions</Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AutomationMetric title="Pending" value={suggestions.filter((item) => item.status === "pending").length} />
        <AutomationMetric title="Approved" value={suggestions.filter((item) => item.status === "approved").length} />
        <AutomationMetric title="Dismissed" value={suggestions.filter((item) => item.status === "dismissed").length} />
        <AutomationMetric title="Tasks" value={tasks.filter((item) => item.status === "open").length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suggestions</CardTitle>
          <CardDescription>Every suggestion is auditable and requires approval before becoming a posting or workflow change.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Suggestion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell>{suggestion.type}</TableCell>
                  <TableCell>
                    <div className="font-medium">{suggestion.title}</div>
                    <div className="text-sm text-muted-foreground">{suggestion.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={suggestion.status === "pending" ? "default" : "secondary"}>{suggestion.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{suggestion.confidence}%</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <form action={approveSuggestionAction}>
                      <input type="hidden" name="id" value={suggestion.id} />
                      <Button size="sm" type="submit" disabled={suggestion.status !== "pending"}>
                        Approve
                      </Button>
                    </form>
                    <form action={dismissSuggestionAction}>
                      <input type="hidden" name="id" value={suggestion.id} />
                      <Button size="sm" variant="outline" type="submit" disabled={suggestion.status !== "pending"}>
                        Dismiss
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification tasks</CardTitle>
          <CardDescription>Operational reminders created by smart checks.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.type}</TableCell>
                  <TableCell>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                  </TableCell>
                  <TableCell>{task.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function AutomationMetric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  )
}
