document.addEventListener('DOMContentLoaded', () => {
  const manager = new BlogManager();

  // DOM Елементи
  const form = document.querySelector('#article-form');
  const editIdInput = document.querySelector('#edit-article-id');
  const titleInput = document.querySelector('#article-title');
  const tagsInput = document.querySelector('#article-tags');
  const contentInput = document.querySelector('#article-content');
  const submitBtn = document.querySelector('#submit-btn');
  const cancelEditBtn = document.querySelector('#cancel-edit-btn');
  const formHeading = document.querySelector('#form-heading');

  const livePreview = document.querySelector('#live-preview');
  const charCounter = document.querySelector('#content-char-counter');

  const titleError = document.querySelector('#title-error');
  const tagsError = document.querySelector('#tags-error');
  const contentError = document.querySelector('#content-error');

  const searchInput = document.querySelector('#search-input');
  const tagFilterSelect = document.querySelector('#tag-filter-select');
  const articlesContainer = document.querySelector('#articles-container');
  const articlesCount = document.querySelector('#articles-count');

  const themeToggleBtn = document.querySelector('#theme-toggle-btn');
  const themeIcon = document.querySelector('#theme-icon');

  // Патерни регулярних виразів для валідації
  const PATTERNS = {
    title: /^.{5,120}$/, // Від 5 до 120 довільних символів
    tag: /^[a-zA-Zа-яА-ЯіїєґІЇЄҐ0-9_-]{2,20}$/, // Кожен окремий тег
    contentMinLength: 10
  };


  // Dark mode
  function initTheme() {
    const savedTheme = localStorage.getItem('theme_preference') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      themeIcon.textContent = '☀️';
    } else {
      document.body.classList.remove('dark-mode');
      themeIcon.textContent = '🌙';
    }
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
    themeIcon.textContent = isDark ? '☀️' : '🌙';
  });

  // Валідація полів форми
  function parseTags(rawString) {
    if (!rawString.trim()) return [];
    return rawString
      .split(/[,\s]+/)
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }

  function validateTitle() {
    const val = titleInput.value.trim();
    if (!PATTERNS.title.test(val)) {
      titleInput.classList.add('input-error');
      titleError.textContent = 'Заголовок має містити від 5 до 120 символів.';
      return false;
    }
    titleInput.classList.remove('input-error');
    titleError.textContent = '';
    return true;
  }

  function validateTags() {
    const tags = parseTags(tagsInput.value);
    if (tags.length === 0) {
      tagsInput.classList.add('input-error');
      tagsError.textContent = 'Вкажіть хоча б один тег.';
      return false;
    }
    const invalidTag = tags.find(t => !PATTERNS.tag.test(t));
    if (invalidTag) {
      tagsInput.classList.add('input-error');
      tagsError.textContent = `Некоректний тег "${invalidTag}". Дозволені літери, цифри, дефіс (2-20 симв.).`;
      return false;
    }
    tagsInput.classList.remove('input-error');
    tagsError.textContent = '';
    return true;
  }

  function validateContent() {
    const val = contentInput.value.trim();
    if (val.length < PATTERNS.contentMinLength) {
      contentInput.classList.add('input-error');
      contentError.textContent = `Текст має бути довшим за ${PATTERNS.contentMinLength} символів.`;
      return false;
    }
    contentInput.classList.remove('input-error');
    contentError.textContent = '';
    return true;
  }

  // Live Markdown Preview та підрахунок символів
  contentInput.addEventListener('input', () => {
    const rawText = contentInput.value;
    charCounter.textContent = `${rawText.length} / 3000`;
    livePreview.innerHTML = Article.parseMarkdown(rawText) || '<em style="color:gray;">Тут відображатиметься форматований текст...</em>';
  });

  titleInput.addEventListener('input', validateTitle);
  tagsInput.addEventListener('input', validateTags);
  contentInput.addEventListener('input', validateContent);

  // Динамічний рендеринг списку (DOM API)
  function renderArticles() {
    const query = searchInput.value;
    const selectedTag = tagFilterSelect.value;
    const filteredList = manager.filterAndSearch(query, selectedTag);

    articlesContainer.innerHTML = '';
    articlesCount.textContent = filteredList.length;

    if (filteredList.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-placeholder';
      emptyDiv.textContent = 'Публікацій не знайдено. Створіть нову або змініть фільтри.';
      articlesContainer.append(emptyDiv);
      return;
    }

    filteredList.forEach(article => {
      const card = document.createElement('article');
      card.className = 'article-card';
      card.dataset.id = article.id;

      // Header картки
      const header = document.createElement('div');
      header.className = 'article-header';

      const titleEl = document.createElement('h3');
      titleEl.className = 'article-title';
      titleEl.textContent = article.title;

      const dateEl = document.createElement('span');
      dateEl.className = 'article-meta';
      dateEl.textContent = new Date(article.createdAt).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      header.append(titleEl, dateEl);

      // Вміст (розпарсений Markdown)
      const contentEl = document.createElement('div');
      contentEl.className = 'article-content';
      contentEl.innerHTML = Article.parseMarkdown(article.content);

      // Теги
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'article-tags';
      article.tags.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.textContent = `#${tag}`;
        badge.dataset.tag = tag;
        tagsContainer.append(badge);
      });

      // Панель дій
      const actions = document.createElement('div');
      actions.className = 'article-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-sm btn-secondary edit-btn';
      editBtn.textContent = 'Редагувати';

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-sm btn-danger delete-btn';
      deleteBtn.textContent = 'Видалити';

      actions.append(editBtn, deleteBtn);

      card.append(header, contentEl, tagsContainer, actions);
      articlesContainer.append(card);
    });

    updateTagFilterDropdown();
  }

  function updateTagFilterDropdown() {
    const currentSelected = tagFilterSelect.value;
    const allTags = manager.getAllTags();

    tagFilterSelect.innerHTML = '<option value="">Усі теги</option>';
    allTags.forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = `#${tag}`;
      if (tag === currentSelected) opt.selected = true;
      tagFilterSelect.append(opt);
    });
  }

  function resetForm() {
    form.reset();
    editIdInput.value = '';
    formHeading.textContent = 'Створити публікацію';
    submitBtn.textContent = 'Опублікувати';
    cancelEditBtn.classList.add('hidden');
    livePreview.innerHTML = '<em style="color:gray;">Тут відображатиметься форматований текст...</em>';
    charCounter.textContent = '0 / 3000';
    [titleInput, tagsInput, contentInput].forEach(inp => inp.classList.remove('input-error'));
    titleError.textContent = '';
    tagsError.textContent = '';
    contentError.textContent = '';
  }

  // Обробка події Submit форми
  form.addEventListener('submit', (event) => {
    event.preventDefault(); // Скасування стандартного перезавантаження сторінки

    const isTitleValid = validateTitle();
    const isTagsValid = validateTags();
    const isContentValid = validateContent();

    if (!isTitleValid || !isTagsValid || !isContentValid) {
      return;
    }

    const title = titleInput.value;
    const tags = parseTags(tagsInput.value);
    const content = contentInput.value;
    const editId = editIdInput.value;

    if (editId) {
      // Оновлення існуючої публікації
      manager.update(editId, { title, content, tags });
    } else {
      // Додавання нової публікації
      const newArticle = new Article(title, content, tags);
      manager.add(newArticle);
    }

    resetForm();
    renderArticles();
  });

  cancelEditBtn.addEventListener('click', resetForm);

  // Делегування подій на контейнері списку статей
  articlesContainer.addEventListener('click', (event) => {
    // 1. Видалення статті
    const deleteBtn = event.target.closest('.delete-btn');
    if (deleteBtn) {
      const card = deleteBtn.closest('.article-card');
      const id = card.dataset.id;
      if (confirm('Ви впевнені, що хочете видалити цю публікацію?')) {
        manager.remove(id);
        if (editIdInput.value === id) resetForm();
        renderArticles();
      }
      return;
    }

    // 2. Редагування статті
    const editBtn = event.target.closest('.edit-btn');
    if (editBtn) {
      const card = editBtn.closest('.article-card');
      const id = card.dataset.id;
      const article = manager.getById(id);

      if (article) {
        editIdInput.value = article.id;
        titleInput.value = article.title;
        tagsInput.value = article.tags.join(', ');
        contentInput.value = article.content;
        charCounter.textContent = `${article.content.length} / 3000`;
        livePreview.innerHTML = Article.parseMarkdown(article.content);

        formHeading.textContent = 'Редагувати публікацію';
        submitBtn.textContent = 'Зберегти зміни';
        cancelEditBtn.classList.remove('hidden');

        window.scrollTo({ top: form.offsetTop - 30, behavior: 'smooth' });
      }
      return;
    }

    // 3. Клік по тегу (швидка фільтрація)
    const tagBadge = event.target.closest('.tag-badge');
    if (tagBadge) {
      const tag = tagBadge.dataset.tag;
      tagFilterSelect.value = tag;
      renderArticles();
    }
  });

  // Пошук та фільтрація в реальному часі
  searchInput.addEventListener('input', renderArticles);
  tagFilterSelect.addEventListener('change', renderArticles);

  // Початкова ініціалізація
  initTheme();
  renderArticles();
  livePreview.innerHTML = '<em style="color:gray;">Тут відображатиметься форматований текст...</em>';
});