const fs = require('fs');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

async function generateWorks() {
  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 100
    });

    const works = issues
      .filter(issue => !issue.pull_request)
      .map(issue => ({
        id: issue.number,
        title: issue.title,
        body: issue.body || '',
        tags: issue.labels.map(label => label.name),
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        url: issue.html_url
      }));

    fs.writeFileSync('works.json', JSON.stringify(works, null, 2));
    console.log(`Generated works.json with ${works.length} works.`);
  } catch (error) {
    console.error('Error generating works.json:', error);
    process.exit(1);
  }
}

generateWorks();
