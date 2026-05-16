const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174/api'

export async function api(path, { token, body, method = 'GET', form } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(form ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form || (body ? JSON.stringify(body) : undefined),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const exportChat = (room, type = 'txt') => {
  const text = room.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
  const blob = new Blob([type === 'pdf' ? `NexusAI Chat Export\n\n${text}` : text], { type: type === 'pdf' ? 'application/pdf' : 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${room.title || 'nexus-chat'}.${type}`
  a.click()
  URL.revokeObjectURL(url)
}
