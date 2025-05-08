import { testNotionConnection, searchInNotion } from './notion.js'
import { loadNotionLinks } from './ui.js'

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput')
  const searchBtn = document.getElementById('searchBtn')
  const optionsBtn = document.getElementById('optionsBtn')
  const statusMessage = document.getElementById('status-message')
  const configStatus = document.getElementById('config-status')
  const linksContainer = document.getElementById('links-container')

  chrome.storage.sync.get(['notionKey', 'databaseId'], (result) => {
    if (result.notionKey && result.databaseId) {
      testNotionConnection(result.notionKey, result.databaseId).then((isWorking) => {
        if (isWorking) {
          statusMessage.textContent = 'Key configured successfully'
          configStatus.className = 'configured'
          searchInput.disabled = false
          searchBtn.disabled = false
          linksContainer.style.display = 'block'
          loadNotionLinks(result.notionKey, result.databaseId)
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

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click()
    }
  })
})
