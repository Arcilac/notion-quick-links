document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput')
  const searchBtn = document.getElementById('searchBtn')
  const optionsBtn = document.getElementById('optionsBtn')
  const statusMessage = document.getElementById('status-message')
  const configStatus = document.getElementById('config-status')

  chrome.storage.sync.get(['notionKey', 'databaseId'], (result) => {
    if (result.notionKey && result.databaseId) {
      testNotionConnection(result.notionKey, result.databaseId).then((isWorking) => {
        if (isWorking) {
          statusMessage.textContent = 'Key configured successfully'
          configStatus.className = 'configured'
          searchInput.disabled = false
          searchBtn.disabled = false
        } else {
          statusMessage.textContent = 'Error connecting to Notion'
          configStatus.className = 'not-configured'
          searchInput.disabled = true
          searchBtn.disabled = true
        }
      })
    } else {
      statusMessage.textContent = 'Key not configured'
      configStatus.className = 'not-configured'
      searchInput.disabled = true
      searchBtn.disabled = true
    }
  })

  searchBtn.addEventListener('click', async () => {
    const searchTerm = searchInput.value.trim()

    if (!searchTerm) return

    try {
      const { notionKey, databaseId } = await chrome.storage.sync.get(['notionKey', 'databaseId'])
      statusMessage.textContent = 'Searching...'

      const url = await searchInNotion(searchTerm, notionKey, databaseId)

      if (url) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.update(tabs[0].id, { url: url })
          window.close()
        })
      } else {
        statusMessage.textContent = 'No link found with that name'
        configStatus.className = 'not-configured'
      }
    } catch (error) {
      statusMessage.textContent = `Error: ${error.message}`
      configStatus.className = 'not-configured'
    }
  })

  async function testNotionConnection(notionKey, databaseId) {
    try {
      const url = `https://api.notion.com/v1/databases/${databaseId}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${notionKey}`,
          'Notion-Version': '2022-06-28',
        },
      })

      return response.ok
    } catch (error) {
      console.error('Error verifying Notion connection:', error)
      return false
    }
  }

  async function searchInNotion(keyword, notionKey, databaseId) {
    try {
      const url = `https://api.notion.com/v1/databases/${databaseId}/query`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${notionKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Name',
            title: {
              contains: keyword,
            },
          },
          page_size: 1,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error API ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const urlProperty = Object.values(data.results[0].properties).find(
          (prop) => prop.type === 'url' || prop.type === 'rich_text',
        )

        if (urlProperty) {
          if (urlProperty.type === 'url') {
            return urlProperty.url
          } else if (urlProperty.type === 'rich_text' && urlProperty.rich_text.length > 0) {
            return urlProperty.rich_text[0].text.content
          }
        }
      }

      return null
    } catch (error) {
      console.error('Error searching in Notion:', error)
      throw error
    }
  }

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click()
    }
  })
})
