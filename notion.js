export async function testNotionConnection(notionKey, databaseId) {
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

export async function fetchNotionLinks(notionKey, databaseId, startCursor = null, allLinks = []) {
  try {
    const url = `https://api.notion.com/v1/databases/${databaseId}/query`
    const requestBody = { page_size: 100 }

    if (startCursor) {
      requestBody.start_cursor = startCursor
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Error API ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      for (const page of data.results) {
        const nameProperty = page.properties.Name
        let name = ''
        if (nameProperty?.title?.length > 0) {
          name = nameProperty.title[0].plain_text
        }

        const urlProperty = Object.values(page.properties).find(
          (prop) => prop.type === 'url' || prop.type === 'rich_text',
        )

        let url = null
        if (urlProperty?.type === 'url') {
          url = urlProperty.url
        } else if (urlProperty?.type === 'rich_text' && urlProperty.rich_text.length > 0) {
          url = urlProperty.rich_text[0].text.content
        }

        if (name && url) {
          allLinks.push({ name, url })
        }
      }
    }

    if (data.has_more && data.next_cursor) {
      return fetchNotionLinks(notionKey, databaseId, data.next_cursor, allLinks)
    }

    return allLinks
  } catch (error) {
    console.error('Error fetching Notion links:', error)
    throw error
  }
}

export async function searchInNotion(keyword, notionKey, databaseId) {
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

    if (data.results?.length > 0) {
      const urlProperty = Object.values(data.results[0].properties).find(
        (prop) => prop.type === 'url' || prop.type === 'rich_text',
      )

      if (urlProperty?.type === 'url') {
        return urlProperty.url
      } else if (urlProperty?.type === 'rich_text' && urlProperty.rich_text.length > 0) {
        return urlProperty.rich_text[0].text.content
      }
    }

    return null
  } catch (error) {
    console.error('Error searching in Notion:', error)
    throw error
  }
}
