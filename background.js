chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  try {
    const { notionKey, databaseId } = await chrome.storage.sync.get(['notionKey', 'databaseId'])

    if (!notionKey || !databaseId || !text.trim()) return

    const suggestions = await searchSuggestionsInNotion(text.trim(), notionKey, databaseId)
    suggest(suggestions)
  } catch (error) {
    console.error('Error getting suggestions:', error)
  }
})

async function searchSuggestionsInNotion(keyword, notionKey, databaseId) {
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
        page_size: 5,
      }),
    })

    if (!response.ok) {
      console.error(`Error API Notion: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      return data.results.map((result) => {
        const title = result.properties.Name.title.map((t) => t.plain_text).join('')
        return {
          content: title,
          description: title,
        }
      })
    }

    return []
  } catch (error) {
    console.error('Error searching suggestions:', error)
    return []
  }
}

chrome.omnibox.onInputEntered.addListener(async (text) => {
  try {
    const keyword = text.trim()

    const { notionKey, databaseId } = await chrome.storage.sync.get(['notionKey', 'databaseId'])

    if (!notionKey || !databaseId) {
      chrome.runtime.openOptionsPage()
      return
    }

    const url = await searchInNotion(keyword, notionKey, databaseId)

    if (url) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.update(tabs[0].id, { url: url })
      })
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.update(tabs[0].id, {
          url: `https://www.google.com/search?q=${encodeURIComponent(text)}`,
        })
      })
    }
  } catch (error) {
    console.error('Error to process command:', error)
  }
})

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.url.startsWith('http://get/') || details.url.startsWith('https://get/')) {
    const keyword = details.url.split('get/')[1].trim()

    if (keyword) {
      chrome.tabs.update(details.tabId, { url: 'about:blank' })

      const { notionKey, databaseId } = await chrome.storage.sync.get(['notionKey', 'databaseId'])

      if (!notionKey || !databaseId) {
        chrome.runtime.openOptionsPage()
        return
      }

      const url = await searchInNotion(keyword, notionKey, databaseId)

      if (url) {
        chrome.tabs.update(details.tabId, { url: url })
      } else {
        chrome.tabs.update(details.tabId, {
          url: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
        })
      }
    }
  }
})

async function searchInNotion(keyword, notionKey, databaseId) {
  const lowerKeyword = keyword.toLowerCase()

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
            contains: keyword.trim(),
          },
        },
        page_size: 1,
      }),
    })

    if (!response.ok) {
      console.error(`Error API Notion: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const urlProperty = Object.values(data.results[0].properties).find(
        (prop) => prop.type === 'url' || prop.type === 'rich_text',
      )

      if (urlProperty) {
        let resultUrl = null

        if (urlProperty.type === 'url') {
          resultUrl = urlProperty.url
        } else if (urlProperty.type === 'rich_text' && urlProperty.rich_text.length > 0) {
          resultUrl = urlProperty.rich_text[0].text.content
        }

        return resultUrl
      }
    }

    return null
  } catch (error) {
    console.error('Error to search in Notion:', error)
    return null
  }
}

chrome.omnibox.setDefaultSuggestion({
  description: 'Type a keyword to search your Notion links',
})
