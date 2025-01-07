/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import useProject from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

const CommitLog = () => {
    const { projectId, project } = useProject();
    const { data: commits } = api.project.getCommits.useQuery({ projectId });
    return (
        <>
            <ul className="space-y-6">
                {commits?.map((commit, commitIndex) => {
                    return (
                        <li key={commit.id} className="relative flex gap-x-4">
                            <div
                                className={cn(
                                    commitIndex === commits.length - 1 ? "h-6" : "-bottom-6",
                                    "absolute left-0 top-0 flex w-6 justify-center",
                                )}
                            >
                                <div className="w-px translate-x-1 bg-gray-200" />
                            </div>

                            <>
                                <img
                                    src={commit.commitAuthorAvatar}
                                    alt="commit avatar"
                                    className="relative mt-3 size-8 flex-none rounded-full bg-gray-50"
                                />
                                <div className="flex-auto rounded-md bg-white p-3 ring-1 ring-inset ring-gray-200">
                                    <div className="flex justify-between gap-x-4">
                                        <Link
                                            target="_blank"
                                            href={`${project?.githubUrl}/commits/${commit.commitHash}`}
                                            className="py-0.5 text-xs leading-5 text-gray-500"
                                        >
                                            <span className="font-medium text-gray-900">
                                                {commit.commitAuthorName}
                                            </span>{" "}
                                            <span className="inline-flex items-center">
                                                commited
                                                <ExternalLink className="ml-1 size-4" />
                                            </span>
                                        </Link>
                                    </div>
                                    <span className="font-semibold">
                                        {commit.commitMessage}
                                    </span>
                                    <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                                        {commit.summary}
                                    </pre>
                                </div>
                            </>
                        </li>
                    );
                })}
            </ul>
        </>
    );
};

export default CommitLog;
