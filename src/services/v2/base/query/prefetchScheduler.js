const scheduleIdleTask = (callback) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback)
  } else {
    setTimeout(callback, 1)
  }
}

const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0))

const runWithConcurrency = async (tasks, concurrency = 4) => {
  for (let idx = 0; idx < tasks.length; idx += concurrency) {
    const batch = tasks.slice(idx, idx + concurrency)
    await Promise.allSettled(batch.map((task) => task()))
    if (idx + concurrency < tasks.length) {
      await yieldToMain()
    }
  }
}

export const schedulePrefetch = (tasks, concurrency = 4) => {
  scheduleIdleTask(() => runWithConcurrency(tasks, concurrency))
}
