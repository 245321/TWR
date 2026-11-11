/**
 * Клас сутності публікації (Article)
 */
class Article {
  constructor(title, content, tags = [], id = null, createdAt = null) {
    this.id = id || crypto.randomUUID();
    this.title = title.trim();
    this.content = content.trim();
    this.tags = Array.isArray(tags) ? tags : [];
    this.createdAt = createdAt || new Date().toISOString();
  }

  /**
   * Спрощений парсер Markdown у безпечний HTML через RegExp
   */
  static parseMarkdown(markdownText) {
    if (!markdownText) return '';

    // Екранування потенційно небезпечних базових HTML-символів
    let escaped = markdownText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Заголовки ## H2 та # H1
    escaped = escaped.replace(/^##\s+(.*)$/gim, '<h2>$1</h2>');
    escaped = escaped.replace(/^#\s+(.*)$/gim, '<h1>$1</h1>');

    // 2. Жирний текст
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Курсивний текст
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 4. Посилання [текст](url)
    escaped = escaped.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 5. Перенос рядків
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
  }
}

/**
 * Клас-менеджер колекції публікацій (BlogManager)
 */
class BlogManager {
  constructor(storageKey = 'blog_articles') {
    this.storageKey = storageKey;
    this.articles = [];
    this.loadFromStorage();
  }

  add(article) {
    this.articles.unshift(article);
    this.saveToStorage();
  }

  update(id, updatedData) {
    const index = this.articles.findIndex(a => a.id === id);
    if (index !== -1) {
      this.articles[index] = {
        ...this.articles[index],
        title: updatedData.title.trim(),
        content: updatedData.content.trim(),
        tags: updatedData.tags
      };
      this.saveToStorage();
    }
  }

  remove(id) {
    this.articles = this.articles.filter(a => a.id !== id);
    this.saveToStorage();
  }

  getById(id) {
    return this.articles.find(a => a.id === id);
  }

  saveToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.articles));
  }

  loadFromStorage() {
    const rawData = localStorage.getItem(this.storageKey);
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        this.articles = parsed.map(item => new Article(
          item.title,
          item.content,
          item.tags,
          item.id,
          item.createdAt
        ));
      } catch (err) {
        console.error('Помилка відновлення даних з localStorage:', err);
        this.articles = [];
      }
    }
  }

  getAllTags() {
    const tagSet = new Set();
    this.articles.forEach(article => {
      article.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  filterAndSearch(query = '', selectedTag = '') {
    let result = [...this.articles];

    if (query.trim()) {
      const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');
      result = result.filter(article => regex.test(article.title));
    }

    if (selectedTag) {
      result = result.filter(article => article.tags.includes(selectedTag));
    }

    return result;
  }
}