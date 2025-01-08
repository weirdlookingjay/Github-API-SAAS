"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import useProject from "@/hooks/use-project"
import { useState } from "react"
import Image from "next/image"
import { askQuestion } from "./actions"
import { readStreamableValue } from "ai/rsc";
import MDEditor from "@uiw/react-md-editor"
import CodeReferences from "./code-references"
import { api } from "@/trpc/react"
import { toast } from "sonner"

const AskQuestionCard = () => {
    const { project } = useProject()
    const [open, setOpen] = useState(false)
    const [question, setQuestion] = useState("")
    const [loading, setLoading] = useState(false)
    const [filesReferences, setFilesReferences] = useState<{ fileName: string; sourceCode: string; summary: string }[]>([])
    const [answer, setAnswer] = useState("")
    const saveAnswer = api.project.saveAnswer.useMutation();

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!project?.id) return
        setLoading(true)
        setAnswer("")
        setFilesReferences([])

        const { output, filesReferences } = await askQuestion(question, project.id)
        setOpen(true)
        setFilesReferences(filesReferences)

        for await (const delta of readStreamableValue(output)) {
            if (delta) {
                setAnswer(ans => ans + delta)
            }
        }

        setLoading(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[80vw]">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <DialogTitle>
                                <Image src="/logo.png" alt="" width={40} height={40} />
                            </DialogTitle>
                            <Button disabled={saveAnswer.isPending} variant={"outline"} onClick={() => {
                                saveAnswer.mutate({
                                    projectId: project!.id,
                                    question,
                                    answer,
                                    filesReferences
                                }, {
                                    onSuccess: () => {
                                        toast.success("Answer saved successfully!")
                                    },
                                    onError: () => {
                                        toast.error("Failed to save answer");
                                    }
                                })
                            }}>
                                Save Answer
                            </Button>
                        </div>
                    </DialogHeader>

                    <MDEditor.Markdown source={answer} className="max-w-[70vw] !h-full max-h-[40vh] overflow-scroll" />
                    <div className="h-4" />
                    <CodeReferences filesReferences={filesReferences} />

                    <Button type="button" onClick={() => { setOpen(false) }}>
                        Close
                    </Button>

                </DialogContent>
            </Dialog>

            <Card className="relative col-span-3">
                <CardHeader>
                    <CardTitle>Ask a question</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit}>
                        <Textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Which file should I edit to change the home page?"
                        />
                        <div className="h-4" />
                        <Button type="submit" disabled={loading || !question.trim()}>
                            {loading ? 'Thinking...' : 'Ask Dionysus!'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}

export default AskQuestionCard