document.addEventListener('DOMContentLoaded', () => {
  const notionKeyInput = document.getElementById('notionKey')
  const databaseIdInput = document.getElementById('databaseId')
  const saveButton = document.getElementById('saveBtn')
  const statusElement = document.getElementById('status')
  const togglePassword = document.getElementById('togglePassword')

  togglePassword.addEventListener('click', function () {
    const type = notionKeyInput.getAttribute('type') === 'password' ? 'text' : 'password'
    notionKeyInput.setAttribute('type', type)

    this.querySelector('i').classList.toggle('fa-eye')
    this.querySelector('i').classList.toggle('fa-eye-slash')
  })

  chrome.storage.sync.get(['notionKey', 'databaseId'], (result) => {
    if (result.notionKey) {
      notionKeyInput.value = result.notionKey
    }
    if (result.databaseId) {
      databaseIdInput.value = result.databaseId
    }
  })

  saveButton.addEventListener('click', async () => {
    const notionKey = notionKeyInput.value.trim()
    const databaseId = databaseIdInput.value.trim()

    if (!notionKey || !databaseId) {
      showStatus('Please enter both fields', 'error')
      return
    }

    try {
      showStatus('Verifying connection with Notion...', '')
      const isValid = await validateNotionConfig(notionKey, databaseId)

      if (isValid) {
        chrome.storage.sync.set(
          {
            notionKey,
            databaseId,
          },
          () => {
            if (chrome.runtime.lastError) {
              showStatus('Error saving configuration: ' + chrome.runtime.lastError.message, 'error')
            } else {
              showStatus('Configuration saved successfully', 'success')
            }
          },
        )
      }
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error')
    }
  })

  function showStatus(message, type) {
    statusElement.textContent = message
    statusElement.className = type

    if (type === 'success') {
      setTimeout(() => {
        statusElement.textContent = ''
        statusElement.className = ''
      }, 3000)
    }
  }

  async function validateNotionConfig(notionKey, databaseId) {
    try {
      let response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${notionKey}`,
          'Notion-Version': '2022-06-28',
        },
      })

      if (!response.ok && (response.status === 404 || response.status === 400)) {
        const databaseIdNoHyphens = databaseId.replace(/-/g, '')
        response = await fetch(`https://api.notion.com/v1/databases/${databaseIdNoHyphens}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${notionKey}`,
            'Notion-Version': '2022-06-28',
          },
        })

        if (response.ok) {
          databaseIdInput.value = databaseIdNoHyphens
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          showStatus('Invalid API Key. Please check your Notion API key.', 'error')
        } else if (response.status === 404) {
          showStatus('Database not found. Please check the database ID.', 'error')
        } else {
          showStatus(`Error ${response.status}: ${response.statusText}`, 'error')
        }
        return false
      }

      const data = await response.json()

      const properties = data.properties
      let hasNameProperty = false
      let hasUrlProperty = false

      for (const key in properties) {
        if (properties[key].type === 'title') {
          hasNameProperty = true
        }
        if (properties[key].type === 'url' || properties[key].type === 'rich_text') {
          hasUrlProperty = true
        }
      }

      if (!hasNameProperty || !hasUrlProperty) {
        showStatus(
          'Your database must have at least one title property and one URL/text property',
          'error',
        )
        return false
      }

      return true
    } catch (error) {
      console.error('Validation error:', error)
      showStatus(`Validation error: ${error.message}`, 'error')
      return false
    }
  }
})
