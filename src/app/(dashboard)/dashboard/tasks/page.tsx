'use client'

import { Suspense } from 'react'
import TasksContent from './tasks-content'
import { Card, CardContent } from '@/components/ui/card'

function LoadingFallback() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center text-gray-500">加载中...</div>
      </CardContent>
    </Card>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TasksContent />
    </Suspense>
  )
}
