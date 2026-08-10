const fs = require('fs');

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const token = process.env.GITHUB_TOKEN;

async function generateWorks() {
  try {
    console.log(`📡 Fetching issues from ${owner}/${repo}...`);

    const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const issues = await response.json();

    const works = issues
      .filter(issue => !issue.pull_request)
      .map(issue => ({
        id: issue.number,
        title: issue.title,
        body: issue.body || '',
        tags: issue.labels.map(label => label.name),
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        url: issue.html_url,
      }));

    fs.writeFileSync('works.json', JSON.stringify(works, null, 2));
    console.log(`Generated works.json with ${works.length} works.`);

    if (works.length === 0) {
      console.log('No open issues found. Created an empty list.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    fs.writeFileSync('works.json', JSON.stringify([], null, 2));
    console.log('Created empty works.json due to error.');
    process.exit(1);
  }
}

generateWorks();
