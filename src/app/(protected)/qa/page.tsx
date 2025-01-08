/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react';
import React, { useState } from 'react'
import AskQuestionCard from '../dashboard/ask-question-card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import MDEditor from '@uiw/react-md-editor';
import CodeReferences from '../dashboard/code-references';

const QAPage = () => {
    const { projectId } = useProject();
    const { data: questions } = api.project.getQuestions.useQuery({ projectId });
    const [questionIndex, setQuestionIndex] = useState(0);
    const question = questions?.[questionIndex];

    return (
        <Sheet>
            <AskQuestionCard />
            <div className="h-4" />
            <h1 className="text-xl font-semibold">Saved Questions</h1>
            <div className="h-2" />
            <div className="flex flex-col gap-2">
                {questions?.map((question, index) => {
                    return <React.Fragment key={question.id}>
                        <SheetTrigger onClick={() => setQuestionIndex(index)}>
                            <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow border">
                                <img src={question.user.imageUrl ?? ""} alt="" className="rounded-full" width={30} height={30} />
                                <div className="text-left flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-700 line-clamp-1 text-lg font-medium">
                                            {question.question}
                                        </p>
                                        <span className="text-sx text-gray-300 whitespace-nowrap">
                                            {question.createdAt.toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 line-clamp-1 text-sm">
                                        {question.answer}
                                    </p>
                                </div>
                            </div>
                        </SheetTrigger>
                    </React.Fragment>
                })}
            </div>
            {question && (
                <SheetContent className="sm:max-w-[80vw]">
                    <SheetHeader>
                        <SheetTitle>
                            {question.question}
                        </SheetTitle>
                        <MDEditor.Markdown source={question.answer} />
                        <CodeReferences filesReferences={(question.filesReferences ?? []) as any} />
                    </SheetHeader>
                </SheetContent>
            )}
        </Sheet>
    )
}

export default QAPage