'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ForbiddenAccess() {
    return (
        <div className="mx-auto max-w-2xl py-10">
            <Card className="border-warning/30 bg-warning/5">
                <CardHeader>
                    <CardTitle>Access restricted</CardTitle>
                    <CardDescription>
                        Your account is signed in, but this section is not available for your role.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Please use the sidebar to open a section available to your role.
                </CardContent>
            </Card>
        </div>
    )
}
