window.addEventListener('storage', handleStorageChange)

function handleStorageChange(event) {
    if (event.key !== '__user_traits') return

    const { newValue, oldValue } = event
    const isNewValueDifferent = JSON.parse(newValue).client_id !== JSON.parse(oldValue).client_id

    if (isNewValueDifferent) {
        window.location.reload()
    }
}
