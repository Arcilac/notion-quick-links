import { fetchNotionLinks } from './notion.js'

export async function loadNotionLinks(notionKey, databaseId) {
  const searchInput = document.getElementById('searchInput')
  const linksList = document.getElementById('links-list')

  try {
    linksList.innerHTML = '<div class="loading">Loading links from Notion...</div>'

    const links = await fetchNotionLinks(notionKey, databaseId)

    if (links.length === 0) {
      linksList.innerHTML = '<div class="no-links">No links found in your database</div>'
      return
    }

    links.sort((a, b) => a.name.localeCompare(b.name))
    linksList.innerHTML = ''

    links.forEach((link, index) => {
      const linkItem = document.createElement('div')
      linkItem.className = 'link-item'
      linkItem.textContent = link.name
      linkItem.style.animationDelay = `${index * 0.05}s`

      linkItem.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.update(tabs[0].id, { url: link.url })
          window.close()
        })
      })

      linksList.appendChild(linkItem)
    })

    searchInput.addEventListener('input', () => {
      const searchText = searchInput.value.toLowerCase().trim()
      const linkItems = linksList.querySelectorAll('.link-item')
      let hasVisibleItems = false

      linkItems.forEach((item) => {
        const name = item.textContent.toLowerCase()
        if (name.includes(searchText)) {
          item.style.display = 'block'
          hasVisibleItems = true
        } else {
          item.style.display = 'none'
        }
      })

      const noResults = document.querySelector('.no-results')

      if (!hasVisibleItems && searchText !== '') {
        if (!noResults) {
          const noResultsDiv = document.createElement('div')
          noResultsDiv.className = 'no-links no-results'
          noResultsDiv.textContent = 'No matches found'
          linksList.appendChild(noResultsDiv)
        }
      } else {
        if (noResults) {
          noResults.remove()
        }
      }
    })
  } catch (error) {
    console.error('Error loading Notion links:', error)
    linksList.innerHTML = `<div class="no-links">Error loading links: ${error.message}</div>`
  }
}
