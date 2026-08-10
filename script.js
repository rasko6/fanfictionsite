// verify age.
document.addEventListener('DOMContentLoaded', function() {
    const gate = document.getElementById('age-gate');
    const mainContent = document.getElementById('main-content');
    const checkbox = document.getElementById('age-checkbox');
    const enterBtn = document.getElementById('enter-btn');

    if (localStorage.getItem('ageVerified') === 'true') {
        console.log("User verified age")
        gate.style.display = 'none';
        mainContent.style.display = 'block';
        return;
    }

    checkbox.addEventListener('change', function() {
        if (this.checked) {
            enterBtn.classList.add('enabled');
        } else {
            enterBtn.classList.remove('enabled');
        }
    });

    enterBtn.addEventListener('click', function() {
        if (checkbox.checked) {
            localStorage.setItem('ageVerified', 'true');
            gate.style.display = 'none';
            mainContent.style.display = 'block';
        }
    });
});

const worksList = document.getElementById('works-list');
const tagFilterContainer = document.getElementById('tag-filter');
const REPO = 'https://github.com/rasko6/fanfictionsite';

let allWorks = [];
let selectedTags = new Set();

// load data
async function loadWorks() {
  try {
    const response = await fetch('works.json');
    if (!response.ok) throw new Error('Failed to fetch works.json');
    allWorks = await response.json();
    renderTags();
    renderWorks();
  } catch (error) {
    worksList.innerHTML = '<p>⚠️ Could not load works. Please try again later.</p>';
    console.error(error);
  }
}

// get tags
function renderTags() {
  const tagSet = new Set();
  allWorks.forEach(work => work.tags.forEach(tag => tagSet.add(tag)));
  const sortedTags = Array.from(tagSet).sort();

  tagFilterContainer.innerHTML = '';
  // all button
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.dataset.tag = 'all';
  allBtn.addEventListener('click', () => {
    selectedTags.clear();
    highlightActiveTag(allBtn);
    renderWorks();
  });
  tagFilterContainer.appendChild(allBtn);

  // buttons for tags
  sortedTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.addEventListener('click', () => {
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
      } else {
        selectedTags.add(tag);
      }
      highlightActiveTag(btn);
      renderWorks();
    });
    tagFilterContainer.appendChild(btn);
  });

  highlightActiveTag(tagFilterContainer.querySelector('[data-tag="all"]'));
}

// highlight
function highlightActiveTag(clickedBtn) {
  const buttons = tagFilterContainer.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    const tag = btn.dataset.tag;
    if (tag === 'all' && selectedTags.size === 0) {
      btn.classList.add('active');
    } else if (selectedTags.has(tag)) {
      btn.classList.add('active');
    }
  });
}

// filter
function renderWorks() {
  const filtered = allWorks.filter(work => {
    if (selectedTags.size === 0) return true;
    return work.tags.some(tag => selectedTags.has(tag));
  });

  if (filtered.length === 0) {
    worksList.innerHTML = '<p>No works match the selected tags.</p>';
    return;
  }

  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  worksList.innerHTML = filtered.map(work => `
    <div class="work-card" data-issue-id="${work.id}">
      <h2>${escapeHtml(work.title)}</h2>
      <div class="tags">${work.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join(' ')}</div>
      <div class="body">${escapeHtml(work.body).replace(/\n/g, '<br>')}</div>
      <div class="meta">Posted: ${new Date(work.created_at).toLocaleDateString()}</div>
      <a href="${work.url}" target="_blank">🔗 View on GitHub</a>
      <button class="comments-toggle" onclick="toggleComments(${work.id}, this)">💬 Show Comments</button>
      <div class="comments-container" style="display: none;"></div>
    </div>
  `).join('');
}

// XSS prevent
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// --- FETCH AND DISPLAY GITHUB COMMENTS ---
window.toggleComments = async function(issueId, button) {
  const container = button.nextElementSibling; // the comments-container div

  // If already open, just close it
  if (container.style.display === 'block') {
    container.style.display = 'none';
    button.textContent = '💬 Show Comments';
    return;
  }

  // Show the container and set loading state
  container.style.display = 'block';
  button.textContent = 'Loading...';
  button.disabled = true;

  // If we already loaded comments before, just show them
  if (container.children.length > 0) {
    button.textContent = '💬 Hide Comments';
    button.disabled = false;
    return;
  }

  try {
    const url = `https://api.github.com/repos/${REPO}/issues/${issueId}/comments`;
    const response = await fetch(url, {
      headers: {
        'Authorization': 'token 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' 
      }
    });

    if (!response.ok) throw new Error('Failed to load comments');

    const comments = await response.json();

    if (comments.length === 0) {
      container.innerHTML = '<p class="no-comments">No comments yet. Be the first!</p>';
    } else {
      let html = '';
      comments.forEach(comment => {
        html += `
          <div class="comment">
            <img src="${comment.user.avatar_url}" alt="avatar" class="comment-avatar">
            <div class="comment-body">
              <strong>${escapeHtml(comment.user.login)}</strong>
              <span class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</span>
              <p>${escapeHtml(comment.body).replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    }

    button.textContent = '💬 Hide Comments';
    button.disabled = false;

  } catch (error) {
    container.innerHTML = '<p class="error">⚠️ Could not load comments.</p>';
    button.textContent = '💬 Show Comments';
    button.disabled = false;
    console.error('Comment error:', error);
  }
};

// initialize
loadWorks();
