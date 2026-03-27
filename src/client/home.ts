const form = document.getElementById('create-form') as HTMLFormElement
const input = document.getElementById('list-name') as HTMLInputElement
const secretInput = document.getElementById('create-secret') as HTMLInputElement
const error = document.getElementById('error') as HTMLParagraphElement

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const name = input.value.trim()
  if (!name) return

  const btn = form.querySelector('button[type=submit]') as HTMLButtonElement
  btn.disabled = true
  error.textContent = ''

  try {
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Create-Secret': secretInput.value,
      },
      body: JSON.stringify({ name }),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error)
    window.location.href = `/list/${body.id}`
  } catch (err) {
    error.textContent = err instanceof Error ? err.message : 'Something went wrong'
    btn.disabled = false
  }
})
