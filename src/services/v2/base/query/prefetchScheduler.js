const scheduleIdleTask = (callback) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback)
  } else {
    setTimeout(callback, 1)
  }
}

const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0))

const runInBatches = async (tasks, batchSize = 5) => {
  const pending = [...tasks]

  while (pending.length) {
    const batch = pending.splice(0, batchSize)
    await Promise.allSettled(batch.map((task) => task()))

    if (pending.length) {
      await yieldToMain()
    }
  }
}

export const schedulePrefetch = (tasks, batchSize = 5) => {
  scheduleIdleTask(() => runInBatches(tasks, batchSize))
}
