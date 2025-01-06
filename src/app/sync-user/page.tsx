import { auth, clerkClient } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { db } from "../../server/db"

const SyncUser = async () => {
    const { userId } = await auth()
    if (!userId) {
        throw new Error('User not found')
    }

    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)

    if (!user.emailAddresses[0]?.emailAddress) {
        return notFound()
    }

    try {
        await db.user.upsert({
            where: {
                emailAddress: user.emailAddresses[0]?.emailAddress ?? "",
            },
            update: {
                imageUrl: user.imageUrl,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            create: {
                id: userId,
                emailAddress: user.emailAddresses[0]?.emailAddress ?? "",
                imageUrl: user.imageUrl,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        })
    } catch (e) {
        const error = e as Error
        console.error('Error upserting user:', error.message)
        throw new Error('Failed to sync user')
    }

    return redirect('/dashboard')
}

export default SyncUser
